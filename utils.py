from .types import Coco18Data, SkeletonData, PoseKeypoint
from typing import Literal

import cv2
import json
import math
import numpy as np
import pathlib
import torch

THIS_NODE_DIR = pathlib.Path(__file__).parent



def draw_coco18_cv2(
    canvas_width: int,
    canvas_height: int,
    coco18_data: Coco18Data | None,
    bone_style: Literal["line", "ellipse"],
) -> torch.Tensor:
    """
    接受coco18数据，使用cv2绘制并返回torch.Tensor

    Args:
        width: 期望图像的宽度
        height: 期望图像的高度
        coco18_data: coco18 数据，若无则本地读取

    Returns:
        tensor: torch.Tensor，形状为 [1, H, W, C]，数据类型 torch.float32，值范围 0~1
    """
    msaa_scale: int = 3
    msaa_scale_half: float = (msaa_scale - 1) / 2.0 + 1
    img = np.zeros(
        (canvas_height * msaa_scale, canvas_width * msaa_scale, 3), dtype=np.uint8
    )
    scaled_than_512: float = min(canvas_width, canvas_height) / 512.0
    if coco18_data is None:
        coco18_data = load_default_coco18()
    for bone in coco18_data["bones"]:
        from_joint, to_joint, color = bone
        x1, y1 = coco18_data["joints"][from_joint][:2]
        x2, y2 = coco18_data["joints"][to_joint][:2]
        x1 *= msaa_scale
        y1 *= msaa_scale
        x2 *= msaa_scale
        y2 *= msaa_scale
        center = round((x1 + x2) / 2), round((y1 + y2) / 2)
        radius_x = round(
            math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 2
        )  # half bone length
        radius_y = round(
            4 * scaled_than_512 * msaa_scale_half
        )  # maximum bone width (half)
        angle = math.atan2(y2 - y1, x2 - x1) * 180 / math.pi
        if bone_style == "line":
            cv2.line(img, (int(x1), int(y1)), (int(x2), int(y2)), color, radius_y * 2, cv2.LINE_AA)
        else:
            cv2.ellipse(img, center, (radius_x, radius_y), angle, 0, 360, color, -1, cv2.LINE_AA)
    for joint in coco18_data["joints"]:
        x, y, color = joint
        x *= msaa_scale
        y *= msaa_scale
        r = round(6 * scaled_than_512 * msaa_scale_half)
        center = round(x), round(y)
        cv2.circle(img, center, r, color, -1)
    shrunk = cv2.resize(img, (canvas_width, canvas_height))
    tensor = torch.from_numpy(shrunk.astype(np.float32) / 255.0).unsqueeze(0)
    return tensor


def draw_skeleton(
    skeleton_data: SkeletonData, bone_style: Literal["line", "ellipse"] = "ellipse"
) -> torch.Tensor:
    """
    接受被用户修改过的skeleton数据，用它修正默认的coco18数据，以重现前端的骨骼图像

    Args:
        skeleton_data: 被用户修改的骨骼数据，需从远端取回字符串并解析

    Returns:
        img: PIL ImageFile，RGB模式，值范围 0~255
    """
    coco18_data = load_default_coco18()
    # 0. 更新coco18_data的关节位置
    pose_keypoints_2d = skeleton_data["people"][0]["pose_keypoints_2d"]
    for i in range(0, len(pose_keypoints_2d), 3):
        x, y = pose_keypoints_2d[i], pose_keypoints_2d[i + 1]
        coco18_data["joints"][i // 3] = (x, y, coco18_data["joints"][i // 3][2])
    # 1. 调用 draw_pose_coco18_only 函数
    return draw_coco18_cv2(
        skeleton_data["width"], skeleton_data["height"], coco18_data, bone_style
    )


def load_default_coco18() -> Coco18Data:
    with open(THIS_NODE_DIR / "src" / "coco18_data.json", "r") as f:
        data: Coco18Data = json.load(f)
    return data


def scale_default_coco18(width: int, height: int) -> Coco18Data:
    """
    缩放默认的 coco18 数据，以适应不同的宽度和高度

    Args:
        width: 目标宽度
        height: 目标高度

    Returns:
        Coco18Data: 缩放后的 coco18 数据
    """
    data = load_default_coco18()
    scale_by: float = min(width, height) / 480
    # 先以(0, 0)为中心做放大
    for i in range(len(data["joints"])):
        bruh = data["joints"][i]
        data["joints"][i] = (bruh[0] * scale_by, bruh[1] * scale_by, bruh[2])
    # 再分别以点1和点8为水平/竖直中点，调整到中心位置
    delta_x = data["joints"][1][0] - width // 2
    delta_y = data["joints"][8][1] - height // 2
    for i in range(len(data["joints"])):
        bruh = data["joints"][i]
        data["joints"][i] = (bruh[0] - delta_x, bruh[1] - delta_y, bruh[2])
    return data


def pose_kp2json(image_tensor: torch.Tensor, pose_keypoint: list[PoseKeypoint]):
    """
    将 pose_keypoints 数据转换为 JSON 字符串

    Args:
        image: 输入的图像张量，形状为 [1, H, W, 3]
        pose_keypoints: 输入的 pose_keypoints 数据

    Returns:
        json_str: JSON 字符串，包含 "width", "height", "people" 三个字段

    """
    # 1. 从 image 张量中自动获取宽度和高度
    # image: [1, H, W, 3]
    image_height, image_width = image_tensor.shape[1:3]

    # 2. 从复杂的 POSE_KEYPOINT 数据中提取出 "people" 列表
    processed_people = []

    for pose_kp in pose_keypoint:
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


def coco2skeleton(data: Coco18Data, width: int, height: int) -> SkeletonData:
    """
    将 coco18 数据转换为骨骼数据

    Args:
        data: coco18 数据
        width: 输入图像的宽度
        height: 输入图像的高度

    Returns:
        SkeletonData: 骨骼数据
    """
    bruh = [0.0] * 18 * 3
    for i, each in enumerate(data["joints"]):
        bruh[3 * i] = each[0]
        bruh[3 * i + 1] = each[1]
        bruh[3 * i + 2] = 1
    res: SkeletonData = {
        "width": width,
        "height": height,
        "people": [{"pose_keypoints_2d": bruh}],
    }
    return res
