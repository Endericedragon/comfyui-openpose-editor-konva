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

const EMPTY_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IB2cksfw" +
    "AAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAAZiS0dEAP8A/wD/oL2nkwAAAAlw" + 
    "SFlzAAAuIwAALiMBeKU/dgAAAAd0SU1FB+oDDgIvDipUXqMAAAALSURBVAjXY2AAAgAABQAB4iYFmwAAAABJRU5ErkJggg==";

export { postTextData, comfyApp, utils, EVENTS, EMPTY_BASE64 };