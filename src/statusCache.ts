import { Joint } from "./myUtils";

class StageStatus {
    opacity: number; // 背景透明度
    bgImgBase64: string; // 背景图片的base64
    lastJoints: Joint[]; // 当前关节点的位置信息

    constructor(opacity: number, bgImgBase64: string, currentJoints: Joint[]) {
        this.opacity = opacity;
        this.bgImgBase64 = bgImgBase64;
        this.lastJoints = currentJoints;
    }
}

export { StageStatus }