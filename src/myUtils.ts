import { comfyApp } from "./constants";

function triple2ColorStr(tri: number[]): string {
    return `rgb(${tri.join(",")})`;
}
// 设置鼠标样式的辅助函数
function setMousePattern() {
    document.body.style.cursor = "move";
}
function resetMousePattern() {
    document.body.style.cursor = "default";
}
function tryParseJson(jsonStr: string) {
    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        comfyApp.extensionManager.toast.add({
            severity: "error",
            summary: "Invalid JSON",
            detail: "Check the console for detail",
            life: 5000
        });
        console.error(e);
        return null;
    }
}

async function postTextData(route: string, text: string) {
    const resp = await comfyApp.api.fetchApi(route, {
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
                summary: "RPC Error",
                detail: `Status code = ${resp.status}`,
                life: 3000
            });
            return Promise.reject(resp.status);
    }
}

export { triple2ColorStr, setMousePattern, resetMousePattern, tryParseJson, postTextData };