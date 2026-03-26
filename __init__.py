from aiohttp import web

# V3 schema
from comfy_api.v0_0_2 import ComfyExtension, io, ui
from server import PromptServer
from .utils import (
    SkeletonData,
    coco2skeleton,
    draw_skeleton,
    draw_coco18_cv2,
    scale_default_coco18,
)
from typing import Literal

import json
import nodes


class EditorNode(io.ComfyNode):
    @classmethod
    def define_schema(cls) -> io.Schema:
        return io.Schema(
            node_id="comfyui-openpose-editor-konva-node",
            display_name="OEKonva Editor Node",
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
                io.Combo.Input("bone_style", ["line", "ellipse"], "Bone Style", default="line"),
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
        cls, width: int, height: int, preview_switch: bool, skeleton_json_str: str, bone_style: Literal["line", "ellipse"]
    ) -> io.NodeOutput:
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
        cls, width: int, height: int, preview_switch: bool, skeleton_json_str: str, bone_style: Literal["line", "ellipse"]
    ) -> str:
        return f"{width}{height}{bone_style}{skeleton_json_str}"


class OEKonvaExtension(ComfyExtension):
    # 必须声明为异步
    async def get_node_list(self) -> list[type[io.ComfyNode]]:
        return [EditorNode]


async def comfy_entrypoint() -> OEKonvaExtension:
    return OEKonvaExtension()


__all__ = ["WEB_DIRECTORY"]
WEB_DIRECTORY = "./web"
