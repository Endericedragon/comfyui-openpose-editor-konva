import Konva from "konva";

import { Joint } from "./myUtils";

class CameraStatus {
    x: number;
    y: number;
    scale: number;

    constructor(x: number, y: number, scale: number) {
        this.x = x;
        this.y = y;
        this.scale = scale;
    }

    static from(stage: Konva.Stage): CameraStatus {
        return new CameraStatus(
            stage.x(),
            stage.y(),
            stage.scaleX(),
        );
    }

    set(stage: Konva.Stage) {
        stage.setAttrs({
            x: this.x,
            y: this.y,
            scaleX: this.scale,
            scaleY: this.scale,
        });
    }
}

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

export { CameraStatus, StageStatus }