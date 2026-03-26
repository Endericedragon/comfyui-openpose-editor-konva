// ComfyUI utils
import { Window } from "./types/comfyAPI.js";
import ROUTES from "@/routes.json";

const cuWin = window as unknown as Window;
const comfyApp = cuWin.comfyAPI.app.app;
const utils = cuWin.comfyAPI.utils;

// import ROUTES from "./routes.json";

const EVENTS = {
    showEditor: "showOpenPoseEditorKonva"
};

const OPTIONS = {
    boneStyle: "comfyui-openpose-editor-konva.bone_style",
};

const EMPTY_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IB2cksfw" +
    "AAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAAZiS0dEAP8A/wD/oL2nkwAAAAlw" +
    "SFlzAAAuIwAALiMBeKU/dgAAAAd0SU1FB+oDDgIvDipUXqMAAAALSURBVAjXY2AAAgAABQAB4iYFmwAAAABJRU5ErkJggg==";

export { comfyApp, utils, EVENTS, ROUTES, OPTIONS, EMPTY_BASE64 };