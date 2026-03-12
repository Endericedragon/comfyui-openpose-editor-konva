<script setup lang="ts">
import { ref } from "vue";
import { Button, Dialog, InputGroup, InputGroupAddon, InputNumber } from "primevue"
import Skeleton from "@/components/Skeleton.vue"

const showEditor = ref(false);
const editorWidth = ref(512);
const editorHeight = ref(512);
</script>

<template>
  <Dialog v-model:visible="showEditor" style="max-width: 85vw; max-height: 85vh;">
    <Skeleton :width="editorWidth" :height="editorHeight"></Skeleton>
  </Dialog>
</template>

<style scoped>

</style>
