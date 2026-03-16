<script setup lang="ts">
import 'primeicons/primeicons.css';
import { Button, Slider, InputGroup, InputGroupAddon } from "primevue";
import { ref, onMounted, onUnmounted } from "vue";
import Konva from "konva";
import { Stage as VStage, Layer as VLayer, Circle as VCircle, Line as VLine, Image as VImage, Rect as VRect } from 'vue-konva';
import { setMousePattern, resetMousePattern, Joint, postTextData, postJsonData } from "@/myUtils";
import { StageStatus } from "@/statusCache";
import { DEFAULT_JOINTS, DEFAULT_BONES, scaleJoints, SerializedJoints } from "@/defaultCoco18";
import { comfyApp, EMPTY_BASE64, ROUTES } from "@/constants";

const emits = defineEmits(["afterClose"]);

const SCALE_BY = 1.1;
// 从外界传入宽度和高度。
const props = defineProps({
  width: {
    type: Number,
    default: 512,
  },
  height: {
    type: Number,
    default: 512,
  },
  closeCallback: {
    type: Function,
  },
  lastStageStatus: {
    type: StageStatus,
  }
});
const [stageWidth, stageHeight] = [props.width, props.height];
// 初始的关节位置、名字和颜色。
// 在onMount中，会主动找后端同步最新的骨骼数据。
const joints = ref<Joint[]>((() => {
  let res = DEFAULT_JOINTS();
  scaleJoints(res, stageWidth, stageHeight);
  return res;
})());
// 初始的骨头连接关系和颜色。均为定值。
const bones = ref(DEFAULT_BONES);
// 舞台的一些配置。
// 从lastStageStatus中恢复舞台状态。
const stageRef = ref<Konva.Stage>();
const currentStageScale = ref(props.lastStageStatus?.scale || 1.0);
const stageConfig = ref({
  width: stageWidth,
  height: stageHeight,
  scaleX: currentStageScale,
  scaleY: currentStageScale,
  x: props.lastStageStatus?.offsetX || 0,
  y: props.lastStageStatus?.offsetY || 0,
});
// 背景图片和黑幕的配置。
const rectConfig = ref({
  width: stageWidth,
  height: stageHeight,
  fill: "black",
  stroke: "grey",
  strokeWidth: 4,
});
// 背景图片及其透明度。同样尝试从lastStageStatus中恢复。
const bgOpacity = ref(props.lastStageStatus?.opacity || 0.4);
const imgTag = new Image();
imgTag.src = props.lastStageStatus?.bgImgBase64 || EMPTY_BASE64;
imgTag.style.overflow = "hidden";
const bgScale = ref({ x: 1, y: 1 });
const bgConfig = ref({
  image: imgTag,
  scale: bgScale,
  opacity: bgOpacity,
});
// 背景图片加载完成后，根据图片的宽高比设置缩放比例。
imgTag.onload = _ => {
  bgScale.value = {
    x: stageWidth / imgTag.width,
    y: stageHeight / imgTag.height
  };
};
/**
 * 处理关节移动，将关节的新位置传导回joints数组中。
 * bones会跟着变化的。
 */
function handleJointMove(e: Konva.KonvaEventObject<DragEvent>) {
  const target = e.target;
  const targetId = parseInt(target?.id());
  const targetX = target?.x();
  const targetY = target?.y();
  joints.value[targetId].x = targetX;
  joints.value[targetId].y = targetY;
}
/**
 * 关闭窗口，可选择是否保存骨骼Json
 */
function handleDialogClose(doSave: boolean) {
  const stage = stageRef.value?.getStage();
  if (!stage) { return; }
  // 保存舞台状态
  const ss = new StageStatus(bgOpacity.value, bgConfig.value.image.src, stage.x(), stage.y(), stage.scaleX());
  if (!ss) { return; }
  // 保存骨骼图JSON
  if (doSave) {
    // 只在点击保存时才会记忆骨骼和舞台状态
    handleSendSkeleton();
    // 通知父组件更新状态
    emits("afterClose", ss);
  }
  props.closeCallback?.();
}
/**
 * 重置相机位置和缩放比例
 */
function handleCameraReset() {
  const stage = stageRef.value?.getStage();
  if (!stage) { return; }
  stage.setAttrs({
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
  });
  currentStageScale.value = 1.0;
}
/**
 * 处理舞台鼠标按下事件，如果按下的是鼠标中键，则将舞台设置为可拖动状态。
 */
function handleStageMidDrag(e: Konva.KonvaEventObject<MouseEvent>) {
  const mouseKey = e.evt.button;
  if (mouseKey === 1) {
    // Middle key
    e.evt.preventDefault();
    stageRef.value?.getStage()?.draggable(true);
    setMousePattern();
  }
}
/**
 * 处理鼠标在任意地方释放的事件，若释放的是中键，则将舞台设置为不可拖动状态。
 */
function handleMouseRelease(e: MouseEvent) {
  const mouseKey = e.button;
  const stage = stageRef.value?.getStage();
  if (mouseKey === 1) {
    // Middle key
    e.preventDefault();
    if (stage && stage.draggable()) {
      stage.draggable(false);
    }
    resetMousePattern();
  }
}
/**
 * 处理鼠标滚轮事件，实现缩放功能。
 */
function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
  e.evt.preventDefault();
  // 通过滚轮的滚动方向来确定缩放的倍数。
  const delta = e.evt.deltaY;
  // 计算新的缩放比例。
  const stage = stageRef.value?.getStage();
  if (!stage) { return; }
  // 由于总是XY同步缩放，因此只获取其中一个就足够了
  const originalScale = stage.scaleX();
  const newScale = delta < 0 ? originalScale * SCALE_BY : originalScale / SCALE_BY;
  // 计算鼠标在舞台上的位置。
  const mousePos = stage.getPointerPosition();
  if (!mousePos) { return; }
  const [oldX, oldY] = [mousePos.x - stage.x(), mousePos.y - stage.y()];
  stage.setAttrs({
    x: stage.x() - oldX * (newScale / originalScale - 1),
    y: stage.y() - oldY * (newScale / originalScale - 1),
  });
  currentStageScale.value = newScale;
}
/**
 * 导出骨骼图的JSON编码，然后传回后端
 */
function handleSendSkeleton() {
  const serializedJoints = SerializedJoints.fromJoints(joints.value, stageWidth, stageHeight);
  const jsonObj = serializedJoints.toObj();
  // Send to backend
  postJsonData(comfyApp, ROUTES["send-skeleton-json-to-backend"], jsonObj, false).then(
    (_) => {
      comfyApp.extensionManager.toast.add({
        severity: "success",
        summary: "OE-Konva Success",
        detail: "Skeleton JSON sent to backend!",
        life: 3000
      });
    }
  );
}
/**
 * 从后端加载骨骼图JSON
 */
function tryLoadSkeletonFromBackend() {
  postTextData(comfyApp, ROUTES["get-skeleton-json-from-backend"], "", true).then(
    jsonData => {
      // 由于postTextData只能传递字符串，所以需要解析两次，一次在这里，一次在SerializedJoints.deserialize中
      if (jsonData) {
        const info = new SerializedJoints(jsonData.width, jsonData.height, jsonData.people[0].pose_keypoints_2d);
        joints.value = info.toJoints();
      }
    });
}
/**
 * 加载背景图片
 */
const fileInputRef = ref<HTMLInputElement>();
function triggerLoadImg() {
  fileInputRef.value?.click();
}
function uploadFileInEvent(
  e: Event, expectedType: string, wantPlainText: boolean = true, callbackFn: (result: string) => void
) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    alert("No file selected!");
    return;
  }
  // 类型检查
  if (!file.type.startsWith(expectedType)) {
    alert(`Expect ${expectedType}, but found ${file.type}!`);
    return;
  }
  // 读取为base64或纯文本
  const reader = new FileReader();
  reader.onerror = (e) => {
    alert("Failed to read file! " + e.target?.error);
  };
  reader.onload = (e) => {
    const result = e.target?.result as string;
    callbackFn(result);
  }
  if (wantPlainText) {
    reader.readAsText(file);
  } else {
    reader.readAsDataURL(file);
  }
  input.value = "";
}
/**
 * 用上传的图片替换当前背景
 */
function handleLoadBg(e: Event) {
  uploadFileInEvent(e, "image/", false, (base64str) => {
    imgTag.src = base64str;
    // 之前已经设计过imgTag.onload 事件，因此这里不需要再处理。
  });
}
function handleClearBg() {
  imgTag.src = EMPTY_BASE64;
}
// 加载骨骼图JSON文件
const jsonInputRef = ref<HTMLInputElement>();
function triggerLoadSkeleton() {
  jsonInputRef.value?.click();
}
/**
 * 加载上传的骨骼图JSON文件
 */
function handleLoadSkeleton(e: Event) {
  uploadFileInEvent(e, "application/json", true, (result) => {
    const uploadedInfo = SerializedJoints.deserialize(result);
    if (uploadedInfo.width !== stageWidth || uploadedInfo.height !== stageHeight) {
      comfyApp.extensionManager.toast.add({
        severity: "warn",
        summary: "Size unmatched!",
        detail: `Skeleton size (${uploadedInfo.width}x${uploadedInfo.height}) does not match with editor size! (${stageWidth}x${stageHeight})`,
        life: 3000,
      });
    }
    joints.value = uploadedInfo.toJoints();
  });
}
/** 
 * 下载骨骼JSON文件
 */
function triggerDownloadSkeleton() {
  // 创建blob对象
  const serializedJoints = SerializedJoints.fromJoints(joints.value, stageWidth, stageHeight);
  const jsonStr = serializedJoints.serialize();
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  // 造一个链接
  const link = document.createElement('a');
  link.href = url;
  link.style.display = "none";
  link.download = 'skeleton.json';
  document.body.appendChild(link);
  link.click();

  // 4. 清理：移除链接并释放对象 URL
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
/**
 * 将骨骼姿势恢复为默认状态，即coco18里存储的状态
 */
function handleResetSkeleton() {
  joints.value = DEFAULT_JOINTS();
  scaleJoints(joints.value, stageWidth, stageHeight);
}
// function handleDebug() {
//   const stage = stageRef.value.getStage();
//   alert(`${stage.x()}, ${stage.y()}`);
// }
// 配置全局事件监听器，保证中键释放时关闭画布拖拽。
const skeletonContainer = ref<Element>();
onMounted(() => {
  skeletonContainer.value = document.getElementsByClassName("skeleton-container")[0];
  window.addEventListener("mouseup", handleMouseRelease);
  tryLoadSkeletonFromBackend();
});
onUnmounted(() => {
  window.removeEventListener("mouseup", handleMouseRelease);
});
</script>

<template>
  <!-- <span>Actual Width: {{ actualWidth }}</span> -->
  <!-- 隐藏的输入栏，点击它就会加载图片并触发@change函数 -->
  <div style="display: none">
    <input type="file" ref="fileInputRef" accept="image/*" @change="handleLoadBg" />
    <input type="file" ref="jsonInputRef" accept="application/json" @change="handleLoadSkeleton" />
  </div>



  <div class="oe-row">
    <InputGroup>
      <InputGroupAddon>
        <!-- 上传/下载骨骼JSON文件 -->
        <Button @click="triggerLoadSkeleton" v-tooltip.bottom="'Load Skeleton JSON'">
          <i class="pi pi-upload"></i>
        </Button>
      </InputGroupAddon>
      <InputGroupAddon>
        <Button @click="triggerDownloadSkeleton" v-tooltip.bottom="'Save Skeleton JSON'">
          <i class="pi pi-download"></i>
        </Button>
      </InputGroupAddon>
      <!-- 骨骼重置 -->
      <InputGroupAddon>
        <Button @click="handleResetSkeleton" v-tooltip.bottom="'Reset Skeleton'">
          <i class="pi pi-undo"></i>
        </Button>
      </InputGroupAddon>
      <!-- 视角重置按钮 -->
      <InputGroupAddon>
        <Button @click="handleCameraReset" v-tooltip.bottom="'Camera Reset'">
          <i class="pi pi-camera"></i>
        </Button>
      </InputGroupAddon>
      <!-- 背景透明度滑块 -->
      <InputGroupAddon class="opacity-slider">
        <Slider v-model="bgOpacity" :max="1" :step="0.02" v-tooltip.bottom="'Background Opacity'" />
      </InputGroupAddon>
      <!-- 加载/卸载背景图片 -->
      <InputGroupAddon>
        <Button @click="triggerLoadImg" v-tooltip.bottom="'Load Background'">
          <i class="pi pi-image"></i>
        </Button>
      </InputGroupAddon>
      <InputGroupAddon>
        <Button @click="handleClearBg" v-tooltip.bottom="'Clear Background'">
          <i class="pi pi-eraser"></i>
        </Button>
      </InputGroupAddon>
      <!-- 保存/关闭按钮 -->
      <InputGroupAddon>
        <Button @click="handleDialogClose(true)" v-tooltip.bottom="'Save and Close'" severity="success">
          <i class="pi pi-check"></i>
        </Button>
      </InputGroupAddon>
      <InputGroupAddon>
        <Button @click="handleDialogClose(false)" v-tooltip.bottom="'Close without Saving'" severity="danger">
          <i class="pi pi-times"></i>
        </Button>
      </InputGroupAddon>
      <!-- <InputGroupAddon>
        <Button @click="handleDebug" v-tooltip.bottom="'Show Debug info'" severity="success">
          <i class="pi pi-bell"></i>
        </Button>
      </InputGroupAddon> -->
    </InputGroup>
  </div>

  <div class="skeleton-container">
    <v-stage :config="stageConfig" ref="stageRef" @mousedown="handleStageMidDrag" @wheel="handleWheel">
      <v-layer>
        <v-rect :config="rectConfig"></v-rect>
      </v-layer>
      <v-layer>
        <v-image :config="bgConfig" />
      </v-layer>
      <v-layer>
        <v-line v-for="(bone, idx) in bones" :key="'bone-' + idx" :config="{
          points: bone.getKonvaBonePoints(joints),
          stroke: bone.color,
          // strokeWidth: 5,
          strokeWidth: 5 / currentStageScale,
        }"></v-line>

        <v-circle class="sk-joint" v-for="(joint, idx) in joints" :config="{
          id: `${idx}`,
          x: joint.x,
          y: joint.y,
          // radius: 4,
          radius: 4 / currentStageScale,
          draggable: true,
          fill: joint.color,
        }" @dragmove="handleJointMove" @mouseover="setMousePattern" @mouseout="resetMousePattern"></v-circle>
      </v-layer>
    </v-stage>
  </div>
</template>

<style scoped>
.skeleton-container {
  max-width: 80vw;
  max-height: 70vh;
  overflow: hidden;
  border: dotted grey;
}

.sk-joint:hover {
  cursor: pointer;
}

.oe-row {
  width: 100%;
  position: absolute;
  display: flex;
  justify-content: flex-start;
  flex-direction: row;
  align-items: center;
  padding: 0.5em;
}

.oe-row>* {
  margin: 0.5em;
  transition: 0.2s;
  opacity: 0.4;
  z-index: 1 !important;
}

.oe-row>*:hover {
  opacity: 1;
}

.opacity-slider {
  min-width: 8em;
}

.opacity-slider>* {
  min-width: 100%;
}
</style>