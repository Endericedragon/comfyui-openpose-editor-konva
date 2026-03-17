import { comfyApp } from "./constants";

function triple2ColorStr(tri: number[]): string {
    return `rgb(${tri.join(",")})`;
}

class Joint {
    x: number;
    y: number;
    color: string;

    constructor(x: number, y: number, color: number[]) {
        this.x = x;
        this.y = y;
        this.color = triple2ColorStr(color);
    }
}

class Bone {
    from: number;
    to: number;
    color: string;

    constructor(from: number, to: number, color: number[]) {
        this.from = from;
        this.to = to;
        this.color = triple2ColorStr(color);
    }

    getKonvaBonePoints(jointMapping: Joint[]) {
        const fromJoint = jointMapping[this.from];
        const toJoint = jointMapping[this.to];
        if (!fromJoint || !toJoint) {
            throw new Error("Invalid joint index");
        }
        return [fromJoint.x, fromJoint.y, toJoint.x, toJoint.y];
    }
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

export { Joint, Bone, setMousePattern, resetMousePattern, tryParseJson };