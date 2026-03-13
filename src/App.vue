<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { Dialog } from "primevue"
import Skeleton from "@/components/Skeleton.vue"
import { EVENTS } from "./constants";

const showEditor = ref(false);
const editorWidth = ref(512);
const editorHeight = ref(512);

function showEditorDialog(e: CustomEvent) {
    editorWidth.value = e.detail.width;
    editorHeight.value = e.detail.height;
    showEditor.value = true;
}

onMounted(() => {
    window.addEventListener(EVENTS.showEditor, showEditorDialog);
});

onUnmounted(() => {
    window.removeEventListener(EVENTS.showEditor, showEditorDialog);  
});
</script>

<template>
  <Dialog header="Openpose Editor Konva" v-model:visible="showEditor" style="max-width: 85vw; max-height: 85vh;">
    <Skeleton :width="editorWidth" :height="editorHeight"></Skeleton>
  </Dialog>
</template>

<style scoped>

</style>
