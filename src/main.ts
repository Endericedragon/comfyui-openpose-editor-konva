// vue
import { createApp } from "vue"
// primevue
import PrimeVue from "primevue/config";
import Tooltip from 'primevue/tooltip';
import Aura from '@primeuix/themes/aura';
import { definePreset } from "@primeuix/themes"
// shared data types
import { comfyApp, utils, EVENTS, OPTIONS, ROUTES } from "./constants.js";
import App from "./App.vue"
import { postTextData } from "./myUtils.js";
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
    settings: [
        {
            id: OPTIONS.boneStyle,
            name: "Select bone style",
            type: "combo",
            defaultValue: "ellipse",
            options: [
                { text: "Ellipse", value: "ellipse" },
                { text: "Line", value: "line" }
            ],
            onChange(newValue, _oldValue) {
                postTextData(ROUTES["set-bone-style"], newValue);
            },
        }
    ],
    async nodeCreated(node, app) {
        if (node.comfyClass === "comfyui-openpose-editor-konva-node") {
            const widgets = node.widgets;
            const widthWidget = widgets?.find(w => w.name.toLowerCase() === "width");
            const heightWidget = widgets?.find(w => w.name.toLowerCase() === "height");
            // 隐藏skeleton_json_str，因为它是用来传输数据的，前端不需要它
            const skeletonJsonWidget = widgets?.find(w => w.name.toLowerCase() === "skeleton_json_str");
            skeletonJsonWidget.hidden = true;
            function widgetReadWrite(val?: string) {
                if (val) {
                    skeletonJsonWidget.value = val;
                } else {
                    return skeletonJsonWidget.value;
                }
            }
            // @ts-ignore
            app.api.addEventListener("send-skeleton-json", (e) => {
                // 收到skeleton_json_str后，更新widget的值
                // 由于是后端发来的，所以一定合法
                skeletonJsonWidget.value = JSON.stringify(e.detail);
            });
            // 加个按钮替代右键菜单吧
            node.addWidget("button", "Open Editor", null, () => {
                window.dispatchEvent(new CustomEvent(EVENTS.showEditor, {
                    detail: {
                        width: widthWidget?.value,
                        height: heightWidget?.value,
                        storageRW: widgetReadWrite,
                    }
                }));
            });
        }
    },
    async setup() {
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
