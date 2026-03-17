from aiohttp import web
from server import PromptServer
from .utils import (
    SkeletonData,
    coco2skeleton,
    draw_pose,
    draw_pose_coco18_only,
    image2tensor,
    pose_kp2json,
    scale_default_coco18,
    use_routes,
)

import json
import nodes
import torch


skeleton_json: SkeletonData | None = None
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
                "skeleton_json_str": (
                    "STRING",
                    {"display": "Skeleton JSON", "multiline": True},
                ),
            }
        }

    RETURN_TYPES = ("IMAGE", "STRING", "STRING")
    RETURN_NAMES = ("COCO18 Image", "Skeleton JSON", "Test Output")
    OUTPUT_NODE = True
    FUNCTION = "run"

    async def run(self, width: int, height: int, skeleton_json_str: str):
        global skeleton_json
        if (
            skeleton_json
            and skeleton_json["width"] == width
            and skeleton_json["height"] == height
        ):
            # 实际上，若这里记忆的尺寸和前台传来的不一致，就需要弃用记忆
            img_tensor = image2tensor(draw_pose(skeleton_json))
        else:
            # skeleton_json_str为空，或需要弃用记忆
            # 先创建默认骨骼，再用它给skeleton_json赋值
            PromptServer.instance.send_sync(
                "using-default", {"width": width, "height": height}
            )
            scaled_coco18 = scale_default_coco18(width, height)
            default_img = draw_pose_coco18_only(width, height, scaled_coco18)
            img_tensor = image2tensor(default_img)
            skeleton_json = coco2skeleton(scaled_coco18, width, height)
        # 保存到 ComfyUI temp 目录，以供前端显示预览图
        res = nodes.PreviewImage().save_images(img_tensor)
        res["result"] = img_tensor, json.dumps(skeleton_json), skeleton_json_str  # type: ignore
        return res  # {"ui": {"images": [...]} "result": (image,)}

    @classmethod
    def IS_CHANGED(cls, width: int, height: int, skeleton_json_str: str):
        global skeleton_json
        return "{}{}{}{}".format(str(skeleton_json), width, height, skeleton_json_str)


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
    global skeleton_json
    skeleton_json = await req.json()
    return web.json_response({"status": "ok"}, status=200)


@PromptServer.instance.routes.post(ROUTES["get-skeleton-json-from-backend"])
async def send_skeleton_json(_: web.Request):
    global skeleton_json
    if skeleton_json:
        return web.json_response(skeleton_json, status=200)
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
