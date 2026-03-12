function triple2ColorStr(tri: number[]): string {
    return `rgb(${tri.join(",")})`;
}

class Joint {
    x: number;
    y: number;
    name: string;
    color: string;

    constructor(x: number, y: number, name: string, color: number[]) {
        this.x = x;
        this.y = y;
        this.name = name;
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

export { Joint, Bone, setMousePattern, resetMousePattern };