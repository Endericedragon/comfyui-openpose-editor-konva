from io import BytesIO
from PIL import Image, ImageDraw
from .types import Coco18Data, SkeletonData, PoseKeypoint

import base64
import json
import numpy as np
import pathlib
import torch

THIS_NODE_DIR = pathlib.Path(__file__).parent

def base64_to_tensor(base64_str: str):
    """
    将 Base64 图片字符串转换为 torch.Tensor，形状为 [1, H, W, C] (RGB, 0-1)

    Args:
        base64_str: 包含图片数据的 Base64 字符串，带 data:image/xxx;base64, 前缀

    Returns:
        torch.Tensor: 形状 [1, H, W, C]，数据类型 torch.float32，值范围 0~1
    """
    # 1. 去除 data:image/xxx;base64, 前缀（如果存在）
    if base64_str.startswith("data:image"):
        base64_str = base64_str.split(",", 1)[-1]

    # 2. Base64 解码为字节数据
    image_bytes = base64.b64decode(base64_str)

    # 3. 使用 PIL 打开图像
    with Image.open(BytesIO(image_bytes)) as img:
        # 转换为 RGB（去掉 alpha 通道，如果有）
        img = img.convert("RGB")
        # 获取 numpy 数组，形状 (H, W, C)
        img_np = np.array(img).astype(np.float32) / 255.0  # 归一化到 [0,1]

    # 4. 转换为 torch Tensor 并增加 batch 维度
    tensor = torch.from_numpy(img_np).unsqueeze(0)  # [1, H, W, C]

    return tensor


def draw_pose(coco18_data: Coco18Data, skeleton_data: SkeletonData):
    """
    接受默认的coco18数据，以及被用户修改过的skeleton数据，以重现前端的骨骼图像
    """
    # 设置缩放比例以实现近似的抗锯齿
    scale_by: int = 4
    # 0. 更新coco18_data的关节位置
    pose_keypoints_2d = skeleton_data["people"][0]["pose_keypoints_2d"]
    for i in range(0, len(pose_keypoints_2d), 3):
        x, y = pose_keypoints_2d[i], pose_keypoints_2d[i + 1]
        coco18_data["joints"][i // 3] = (x, y, coco18_data["joints"][i // 3][2])
    # 1. 空白画布
    img = Image.new(
        "RGB", (skeleton_data["width"] * scale_by, skeleton_data["height"] * scale_by)
    )
    draw = ImageDraw.Draw(img)
    for bone in coco18_data["bones"]:
        from_joint, to_joint, color = bone
        x1, y1 = coco18_data["joints"][from_joint][:2]
        x2, y2 = coco18_data["joints"][to_joint][:2]
        draw.line(
            [(x1 * scale_by, y1 * scale_by), (x2 * scale_by, y2 * scale_by)],
            fill=tuple(color),
            width=scale_by * 6,
        )
    for joint in coco18_data["joints"]:
        x, y, color = joint
        draw.ellipse(
            [
                ((x - 5) * scale_by, (y - 5) * scale_by),
                ((x + 5) * scale_by, (y + 5) * scale_by),
            ],
            fill=tuple(color),
        )
        # draw.text((x, y), str(joint[2]), fill=(255, 255, 255))
    img.resize(
        (skeleton_data["width"], skeleton_data["height"]), Image.Resampling.LANCZOS
    ).save("output/pose.png")


def pose_kps2json(image: torch.Tensor, pose_keypoints: list[PoseKeypoint]):
    # 1. 从 image 张量中自动获取宽度和高度
    # image: [1, H, W, 3]
    image_height, image_width = image.shape[1:3]

    # 2. 从复杂的 POSE_KEYPOINT 数据中提取出 "people" 列表
    processed_people = []

    for pose_kp in pose_keypoints:
        people_in_dict = pose_kp.get("people", [])
        for person in people_in_dict:
            original_keypoints = person.get("pose_keypoints_2d", [])
            num_points_to_copy = min(18 * 3, len(original_keypoints))
            processed_people.append(
                {"pose_keypoints_2d": original_keypoints[:num_points_to_copy]}
            )

    # 3. 准备要写入文件的最终数据结构
    data_to_return = {
        "width": int(image_width),
        "height": int(image_height),
        "people": processed_people,
    }

    return json.dumps(data_to_return)
