from aiohttp import web

# V3 schema
from comfy_api.v0_0_2 import ComfyExtension, io, ui
from server import PromptServer
from .utils import (
    SkeletonData,
    coco2skeleton,
    draw_skeleton,
    draw_coco18_cv2,
    pose_kp2json,
    scale_default_coco18,
    THIS_NODE_DIR,
)
from typing import Literal

import json
import nodes
import torch

with open(THIS_NODE_DIR / "src" / "routes.json", "r", encoding="utf-8") as f:
    routes = json.load(f)

bone_style: Literal["line", "ellipse"] = "line"


class EditorNode(io.ComfyNode):
    @classmethod
    def define_schema(cls) -> io.Schema:
        return io.Schema(
            node_id="comfyui-openpose-editor-konva-node",
            display_name="OpenPose Editor Konva Node",
            category="OpenPose.Editor.Konva",
            description="A Konva.js implemented OpenPose Editor Node",
            inputs=[
                io.Int.Input(
                    "width", "Width", default=512, min=512, max=64 * 128, step=8
                ),
                io.Int.Input(
                    "height", "Height", default=512, min=512, max=64 * 128, step=8
                ),
                io.Boolean.Input("preview_switch", "Preview Switch", default=True),
                # 在前端中被隐藏，专门用来传输数据
                io.String.Input("skeleton_json_str", "Skeleton JSON", default=""),
            ],
            outputs=[
                io.Image.Output("Coco18Image", "Coco 18 Image"),
                io.String.Output("skeleton_json", "Skeleton JSON"),
            ],
            is_output_node=True,
        )

    @classmethod
    def execute(
        cls, width: int, height: int, preview_switch: bool, skeleton_json_str: str
    ) -> io.NodeOutput:
        global bone_style
        print(bone_style)
        skeleton_json: SkeletonData = dict()  # type: ignore
        try:
            skeleton_json: SkeletonData = json.loads(skeleton_json_str)
        except json.JSONDecodeError:
            pass
        if (
            skeleton_json.get("width", -1) == width
            and skeleton_json.get("height", -1) == height
        ):
            # 仅当记忆的尺寸和前端传来的一致，才能复用记忆
            img_tensor = draw_skeleton(skeleton_json, bone_style)
        else:
            # skeleton_json_str为空，或需要弃用记忆
            # 先创建默认骨骼，再用它给skeleton_json赋值
            print(f"Using default skeleton, resolution = {width} x {height}")
            scaled_coco18 = scale_default_coco18(width, height)
            img_tensor = draw_coco18_cv2(width, height, scaled_coco18, bone_style)
            skeleton_json = coco2skeleton(scaled_coco18, width, height)
            # 发送skeleton_json_str到前端，前端会更新widget的值
            PromptServer.instance.send_sync("send-skeleton-json", skeleton_json)
        # 保存到 ComfyUI temp 目录，以供前端显示预览图
        res = nodes.PreviewImage().save_images(img_tensor) if preview_switch else dict()
        res["result"] = img_tensor, json.dumps(skeleton_json)  # type: ignore
        return io.NodeOutput(
            img_tensor,
            json.dumps(skeleton_json),
            ui=ui.PreviewImage(img_tensor, cls=cls),
        )

    @classmethod
    def fingerprint_inputs(
        cls, width: int, height: int, preview_switch: bool, skeleton_json_str: str
    ) -> str:
        global bone_style
        return f"{width}{height}{bone_style}{skeleton_json_str}"


class OEKonvaExtension(ComfyExtension):
    # 必须声明为异步
    async def get_node_list(self) -> list[type[io.ComfyNode]]:
        return [
            EditorNode,
            # 在这里添加更多节点
        ]


async def comfy_entrypoint() -> OEKonvaExtension:
    return OEKonvaExtension()


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
                        "step": 8,
                        "min": 512,
                        "max": 64 * 128,
                        "display": "Width",
                    },
                ),
                "height": (
                    "INT",
                    {
                        "default": 512,
                        "step": 8,
                        "min": 512,
                        "max": 64 * 128,
                        "display": "Height",
                    },
                ),
                "preview_switch": (
                    "BOOLEAN",
                    {
                        "display": "Preview Switch",
                        "default": True,
                    },
                ),
                # 在前端中被隐藏，专门用来传输数据
                "skeleton_json_str": (
                    "STRING",
                    {"display": "Skeleton JSON"},
                ),
            }
        }

    RETURN_TYPES = ("IMAGE", "STRING")
    RETURN_NAMES = ("COCO18 Image", "Skeleton JSON")
    OUTPUT_NODE = True
    FUNCTION = "run"

    async def run(
        self, width: int, height: int, preview_switch: bool, skeleton_json_str: str
    ):
        global bone_style
        print(bone_style)
        skeleton_json: SkeletonData = dict()  # type: ignore
        try:
            skeleton_json: SkeletonData = json.loads(skeleton_json_str)
        except json.JSONDecodeError:
            pass
        if (
            skeleton_json.get("width", -1) == width
            and skeleton_json.get("height", -1) == height
        ):
            # 仅当记忆的尺寸和前端传来的一致，才能复用记忆
            img_tensor = draw_skeleton(skeleton_json, bone_style)
        else:
            # skeleton_json_str为空，或需要弃用记忆
            # 先创建默认骨骼，再用它给skeleton_json赋值
            print(f"Using default skeleton, resolution = {width} x {height}")
            scaled_coco18 = scale_default_coco18(width, height)
            img_tensor = draw_coco18_cv2(width, height, scaled_coco18, bone_style)
            skeleton_json = coco2skeleton(scaled_coco18, width, height)
            # 发送skeleton_json_str到前端，前端会更新widget的值
            PromptServer.instance.send_sync("send-skeleton-json", skeleton_json)
        # 保存到 ComfyUI temp 目录，以供前端显示预览图
        res = nodes.PreviewImage().save_images(img_tensor) if preview_switch else dict()
        res["result"] = img_tensor, json.dumps(skeleton_json)  # type: ignore
        return res  # {"ui": {"images": [...]} "result": (image,)}

    @classmethod
    def IS_CHANGED(
        cls, width: int, height: int, preview_switch: bool, skeleton_json_str: str
    ):
        global bone_style
        return "{}{}{}{}".format(skeleton_json_str, width, height, bone_style)


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


@PromptServer.instance.routes.post(routes["set-bone-style"])
async def set_bone_style(req: web.Request):
    global bone_style
    bruh = await req.text()
    assert bruh in {"line", "ellipse"}
    bone_style = bruh  # type: ignore
    print(f"Setting bone style to {bone_style}.")
    return web.json_response(data={"bone_style": bone_style})


__all__ = ["WEB_DIRECTORY"]
WEB_DIRECTORY = "./web"
