from aiohttp import web
from server import PromptServer
from .utils import (
    SkeletonData,
    coco2skeleton,
    draw_pose,
    draw_pose_coco18_only,
    image2tensor,
    load_default_coco18,
    pose_kp2json,
    scale_default_coco18,
    use_routes,
)

import json
import torch


skeleton_json_str = ""
ROUTES = use_routes()


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
                    {
                        "default": 512,
                        "step": 64,
                        "min": 64,
                        "max": 6400,
                        "display": "Width",
                    },
                ),
                "height": (
                    "INT",
                    {
                        "default": 512,
                        "step": 64,
                        "min": 64,
                        "max": 6400,
                        "display": "Height",
                    },
                ),
            }
        }

    RETURN_TYPES = ("IMAGE", "STRING")
    RETURN_NAMES = ("COCO18 Image", "Skeleton JSON")
    FUNCTION = "run"

    async def run(self, width: int, height: int):
        global skeleton_json_str
        if skeleton_json_str:
            skeleton_data: SkeletonData = json.loads(skeleton_json_str)
            # 实际上，若这里记忆的尺寸和前台传来的不一致，就需要弃用记忆
            if skeleton_data["width"] == width and skeleton_data["height"] == height:
                return (
                    image2tensor(draw_pose(skeleton_data)),
                    skeleton_json_str,
                )
        # skeleton_json_str为空，或需要弃用记忆
        PromptServer.instance.send_sync(
            "using-default", {"width": width, "height": height}
        )
        scaled_coco18 = scale_default_coco18(width, height)
        default_img = draw_pose_coco18_only(width, height, scaled_coco18)
        return image2tensor(default_img), json.dumps(
            coco2skeleton(scaled_coco18, width, height)
        )

    @classmethod
    def IS_CHANGED(cls, width: int, height: int):
        global skeleton_json_str
        return "{}({}*{})".format(skeleton_json_str, width, height)


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

    def to_json(self, image: torch.Tensor, pose_keypoint: list):
        res = pose_kp2json(image, pose_keypoint)
        return (str(res),)


@PromptServer.instance.routes.post(ROUTES["send-skeleton-json-to-backend"])
async def get_skeleton_json(req: web.Request):
    global skeleton_json_str
    skeleton_json_str = await req.text()
    return web.json_response({"status": "ok"}, status=200)


@PromptServer.instance.routes.post(ROUTES["get-skeleton-json-from-backend"])
async def send_skeleton_json(_: web.Request):
    global skeleton_json_str
    if skeleton_json_str:
        obj = json.loads(skeleton_json_str)
        return web.json_response(obj, status=200)
    else:
        return web.json_response(
            {"status": "No skeleton json in the backend!"}, status=404
        )


__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
NODE_CLASS_MAPPINGS = {
    "OpenPoseEditorKonva Controller": EditorController,
    "OpenPoseEditorKonva PoseKeypoint2Json": PoseKeypoint2Json,
}
NODE_DISPLAY_NAME_MAPPINGS = dict()
WEB_DIRECTORY = "./web"
