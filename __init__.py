from aiohttp import web
from server import PromptServer

import pathlib
import torch

from .utils import base64_to_tensor, pose_kps2json

base64_string = ""
skeleton_json_str = ""


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

    RETURN_TYPES = ("IMAGE", "STRING")
    RETURN_NAMES = ("COCO18 Image", "Skeleton JSON")
    FUNCTION = "run"

    def run(self, width: int, height: int):
        global base64_string, skeleton_json_str
        if base64_string and skeleton_json_str:
            return base64_to_tensor(base64_string), skeleton_json_str
        else:
            # 从未打开编辑器，无法生成骨骼图，返回空图
            return torch.zeros((1, height, width, 3)), ""

    @classmethod
    def IS_CHANGED(cls, width: int, height: int):
        global base64_string
        return base64_string


class PoseKeypoint2Json:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "image": ("IMAGE",),
                "pose_keypoint": ("POSE_KEYPOINT",),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("Json String",)
    FUNCTION = "to_json"
    OUTPUT_NODE = True
    CATEGORY = "OpenPose.Editor.Konva"

    def to_json(self, image: torch.Tensor, pose_keypoints: list):
        return pose_kps2json(image, pose_keypoints)


@PromptServer.instance.routes.post("/oe-konva/skeletonBase64")
async def save_skeleton_base64(request: web.Request) -> web.Response:
    global base64_string
    data = await request.text()
    base64_string = data.split(",")[1]
    return web.json_response({"status": "ok"}, status=200)


@PromptServer.instance.routes.post("/oe-konva/skeletonJson")
async def get_skeleton_json(req: web.Request):
    global skeleton_json_str
    skeleton_json_str = await req.text()
    # with open(THIS_NODE_DIR / "skeleton.json", "w") as f:
    #     f.write(skeleton_json_str)
    return web.json_response({"status": "ok"}, status=200)


__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
NODE_CLASS_MAPPINGS = {
    "OpenPoseEditorKonva Controller": EditorController,
    "OpenPoseEditorKonva PoseKeypoint2Json": PoseKeypoint2Json,
}
NODE_DISPLAY_NAME_MAPPINGS = dict()
WEB_DIRECTORY = "./web"
