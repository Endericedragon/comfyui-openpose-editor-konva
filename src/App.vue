<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { Dialog } from "primevue"
import Skeleton from "@/components/Skeleton.vue"
import { EVENTS } from "./constants";
import { StageStatus } from "./statusCache.js";

const showEditor = ref(false);
const editorWidth = ref(512);
const editorHeight = ref(512);
const lastStageStatus = ref<null | StageStatus>(null);
let jsonStrRW: (val?: string) => string | null;
let boneStyleRW: (val?: string) => string | null;

function showEditorDialog(e: CustomEvent) {
  editorWidth.value = e.detail.width;
  editorHeight.value = e.detail.height;
  jsonStrRW = e.detail.jsonStrRW;
  boneStyleRW = e.detail.boneStyleRW;
  showEditor.value = true;
}

function handleSavingStatus(ss: StageStatus) {
  lastStageStatus.value = ss;
}

onMounted(() => {
  window.addEventListener(EVENTS.showEditor, showEditorDialog);
});

onUnmounted(() => {
  window.removeEventListener(EVENTS.showEditor, showEditorDialog);
});
// 移除莫名其妙的mask。目前已知该mask一定会在使用konva的v-stage后出现，暂无很好的解决办法，只能在DOMContentLoaded后移除。
document.addEventListener('DOMContentLoaded', () => {
  const weirdMask = document.querySelector(".p-blockui-mask.p-overlay-mask.p-overlay-mask-enter.p-blockui-mask-document.p-overlay-mask-leave[[data-pc-section=\"mask\"]]");
  if (weirdMask) {
    weirdMask.remove();
  }
});
</script>

<template>
  <Dialog v-model:visible="showEditor" style="max-width: 85vw; max-height: 85vh;">
    <template #container="{ closeCallback }">
      <Skeleton :width="editorWidth" :height="editorHeight" :closeCallback="closeCallback" :lastStageStatus :jsonStrRW
        :boneStyleRW @after-close="handleSavingStatus"></Skeleton>
    </template>
  </Dialog>
</template>

<style scoped></style>
