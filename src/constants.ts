// ComfyUI utils
import { Window } from "./types/comfyAPI.js";
import type { ComfyApp } from "@comfyorg/comfyui-frontend-types"

const cuWin = window as unknown as Window;
const comfyApp = cuWin.comfyAPI.app.app;
const utils = cuWin.comfyAPI.utils;


async function postTextData(app: ComfyApp, route: string, text: string) {
    const resp = await app.api.fetchApi(route, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: text
    });
    switch (resp.status) {
        case 200:
            return resp.text();
        default:
            comfyApp.extensionManager.toast.add({
                severity: "error",
                summary: "MDNotes Error",
                detail: `Status code = ${resp.status}`,
                life: 3000
            });
            return Promise.reject(resp.status);
    }
}

const EVENTS = {
    showEditor: "showOpenPoseEditorKonva"
};

export { postTextData, comfyApp, utils, EVENTS };