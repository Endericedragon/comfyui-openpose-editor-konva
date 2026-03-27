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
function tryParseJson(jsonStr: string): Object | null {
    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        warnInvalidJSON();
        return null;
    }
}

function warnInvalidJSON() {
    comfyApp.extensionManager.toast.add({
        severity: "warn",
        summary: "Invalid JSON",
        life: 5000
    });
}

export { triple2ColorStr, setMousePattern, resetMousePattern, tryParseJson, warnInvalidJSON };