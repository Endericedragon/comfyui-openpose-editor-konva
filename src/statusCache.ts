import { Joint } from "./myUtils";

class StageStatus {
    opacity: number; // 背景透明度
    bgImgBase64: string; // 背景图片的base64

    constructor(opacity: number, bgImgBase64: string) {
        this.opacity = opacity;
        this.bgImgBase64 = bgImgBase64;
    }
}

export { StageStatus }