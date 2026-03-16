import { ComfyApp } from "@comfyorg/comfyui-frontend-types";

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

async function postTextData(app: ComfyApp, route: string, text: string, wantJson: boolean) {
    const resp = await app.api.fetchApi(route, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: text
    });
    switch (resp.status) {
        case 200:
            return wantJson ? resp.json() : resp.text();
        default:
            const errorMsg = await resp.json();
            app.extensionManager.toast.add({
                severity: "error",
                summary: "OE-Konva Error",
                detail: `Status code = ${resp.status}, ${errorMsg.status}`,
                life: 3000
            });
            return Promise.reject(resp.status);
    }
}

async function postJsonData(app: ComfyApp, route: string, jsonObj: object, wantJson: boolean) {
    const resp = await app.api.fetchApi(route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonObj)
    });
    switch (resp.status) {
        case 200:
            return wantJson ? resp.json() : resp.text();
        default:
            const errorMsg = await resp.json();
            app.extensionManager.toast.add({
                severity: "error",
                summary: "OE-Konva Error",
                detail: `Status code = ${resp.status}, ${errorMsg.status}`,
                life: 3000
            });
            return Promise.reject(resp.status);
    }
}

export { Joint, Bone, setMousePattern, resetMousePattern, postTextData, postJsonData };