// vue
import { createApp } from "vue"
// primevue
import PrimeVue from "primevue/config";
import Tooltip from 'primevue/tooltip';
import Aura from '@primeuix/themes/aura';
import { definePreset } from "@primeuix/themes"
// shared data types
import { comfyApp, utils, EVENTS } from "./constants.js";
import App from "./App.vue"
// extensions/comfyui-openpose-editor-konva是固定的，后续内容和/web目录有关
const CSS_PATH = "extensions/comfyui-openpose-editor-konva/assets/style.css";
utils.addStylesheet(CSS_PATH);
// Copied from comfy-frontend-package
const ComfyUIPreset = definePreset(Aura, {
    semantic: {
        primary: Aura['primitive'].blue
    }
})

comfyApp.registerExtension({
    name: "endericedragon.comfyui-openpose-editor-konva",
    async nodeCreated(node, _app) {
        if (node.comfyClass === "OpenPoseEditorKonva Controller") {
            const widgets = node.widgets;
            const widthWidget = widgets?.find(w => w.name.toLowerCase() === "width");
            const heightWidget = widgets?.find(w => w.name.toLowerCase() === "height");
            const skeletonJsonWidget = widgets?.find(w => w.name.toLowerCase() === "skeleton_json_str");
            skeletonJsonWidget.hidden = true;
            // 加个按钮替代右键菜单吧
            node.addWidget("button", "Open Editor", null, () => {
                window.dispatchEvent(new CustomEvent(EVENTS.showEditor, {
                    detail: {
                        width: widthWidget?.value,
                        height: heightWidget?.value,
                        jsonWidget: skeletonJsonWidget,
                    }
                }));
            });
        }
    },
    async setup() {
        // @ts-ignore: Why?
        comfyApp.api.addEventListener("using-default", (e) => {
            comfyApp.extensionManager.toast.add({
                severity: "warn",
                summary: "Using Default",
                detail: "Using default skeleton. Please save your work before closing the editor.",
                life: 3000
            })
        });
        let mountPoint = document.createElement("div");
        mountPoint.id = "oe-konva-ui";
        document.body.appendChild(mountPoint);
        createApp(App)
            .use(PrimeVue, {
                // 不指定主题就爆炸，这是什么鬼事情？
                theme: {
                    preset: ComfyUIPreset
                }
            })
            .directive('tooltip', Tooltip)
            .mount(mountPoint);
    }
});
