from aiohttp import web
from server import PromptServer
import base64
from io import BytesIO
from PIL import Image
from nodes import LoadImage
import torch
import numpy as np

base64_string = ""


class EditorController:
    CATEGORY = "OpenPose.Editor.Konva"

    @classmethod
    def INPUT_TYPES(
        cls,
    ) -> dict:
        return {
            "required": {
                "width": (
                    "INT",
                    {"default": 512, "step": 64, "display": "Width"},
                ),
                "height": (
                    "INT",
                    {"default": 512, "step": 64, "display": "Height"},
                ),
            }
        }

    RETURN_TYPES = ("IMAGE", "TEXT")
    RETURN_NAMES = ("COCO18 Image", "Skeleton JSON")
    FUNCTION = "run"

    def run(self, width: int, height: int):
        return base64_to_tensor(base64_string), ""

    @classmethod
    def IS_CHANGED(cls, width: int, height: int):
        return width, height, base64_string


@PromptServer.instance.routes.post("/oe-konva/skeletonBase64")
async def save_skeleton_base64(request: web.Request) -> web.Response:
    global base64_string
    data = await request.text()
    base64_string = data.split(",")[1]
    return web.json_response({"status": "ok"}, status=200)


def base64_to_tensor(base64_str: str):
    """
    将 Base64 图片字符串转换为 torch.Tensor，形状为 [1, H, W, C] (RGB, 0-1)

    Args:
        base64_str: 包含图片数据的 Base64 字符串，可能带 data:image/xxx;base64, 前缀

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


__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
NODE_CLASS_MAPPINGS = {
    "OpenPoseEditorKonva Controller": EditorController,
}
NODE_DISPLAY_NAME_MAPPINGS = dict()
WEB_DIRECTORY = "./web"
