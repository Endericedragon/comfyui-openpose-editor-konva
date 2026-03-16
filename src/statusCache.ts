class StageStatus {
    opacity: number; // 背景透明度
    bgImgBase64: string; // 背景图片的base64
    offsetX: number; // 背景图片的x偏移量
    offsetY: number; // 背景图片的y偏移量
    scale: number; // 背景图片的缩放比例

    constructor(opacity: number, bgImgBase64: string, offsetX: number, offsetY: number, scale: number) {
        this.opacity = opacity;
        this.bgImgBase64 = bgImgBase64;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.scale = scale;
    }
}

export { StageStatus }