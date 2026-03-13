import os
import pathlib
from functools import lru_cache
from typing import TypedDict
import mimetypes

import folder_paths
from aiohttp import web, ClientSession
from server import PromptServer


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

    def run(self):
        pass


# @PromptServer.instance.routes.post("/oe-konva/initialize")
# async def initialize_editor(request: web.Request) -> web.Response:

#     return web.json_response({"status": "ok"}, status=200)


__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
NODE_CLASS_MAPPINGS = {
    "OpenPoseEditorKonva Controller": EditorController,
}
NODE_DISPLAY_NAME_MAPPINGS = dict()
WEB_DIRECTORY = "./web"
