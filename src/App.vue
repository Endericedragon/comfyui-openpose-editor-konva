<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { Dialog } from "primevue"
import Skeleton from "@/components/Skeleton.vue"
import { EVENTS } from "./constants";
import { StageStatus } from "./statusCache.js";

const showEditor = ref(false);
const editorWidth = ref(512);
const editorHeight = ref(512);
let skeletonJsonWidget: HTMLTextAreaElement | null = null;
const lastStageStatus = ref<null | StageStatus>(null);

function showEditorDialog(e: CustomEvent) {
  editorWidth.value = e.detail.width;
  editorHeight.value = e.detail.height;
  skeletonJsonWidget = e.detail.jsonWidget;
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
</script>

<template>
  <Dialog v-model:visible="showEditor" style="max-width: 85vw; max-height: 85vh;">
    <template #container="{ closeCallback }">
      <Skeleton :width="editorWidth" :height="editorHeight" :closeCallback="closeCallback" :lastStageStatus :skeletonJsonWidget
        @after-close="handleSavingStatus"></Skeleton>
    </template>
  </Dialog>
</template>

<style scoped></style>
