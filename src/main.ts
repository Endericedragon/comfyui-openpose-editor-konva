// vue
import { createApp } from "vue"
// primevue
import PrimeVue from "primevue/config";
import Tooltip from 'primevue/tooltip';
import Aura from '@primeuix/themes/aura';
import { definePreset } from "@primeuix/themes"
// shared data types
// import { comfyApp, utils, EVENTS } from "./constants.js";
import { comfyApp, EVENTS } from "./constants.js";
import App from "./App.vue"
// // extensions/comfyui-openpose-editor-konva是固定的，后续内容和/web目录有关
// const CSS_PATH = "extensions/comfyui-openpose-editor-konva/assets/style.css";
// utils.addStylesheet(CSS_PATH);
// Copied from comfy-frontend-package
const ComfyUIPreset = definePreset(Aura, {
    semantic: {
        primary: Aura['primitive'].blue
    }
})

comfyApp.registerExtension({
    name: "endericedragon.comfyui-openpose-editor-konva",
    async nodeCreated(node, _app) {
        if (node.comfyClass === "comfyui-openpose-editor-konva-node") {
            const widgets = node.widgets!;
            const widthWidget = widgets?.find(w => w.name.toLowerCase() === "width")!;
            const heightWidget = widgets?.find(w => w.name.toLowerCase() === "height")!;
            const boneStyleWidget = widgets?.find(w => w.name.toLowerCase() === "bone_style")!;
            // 隐藏skeleton_json_str，因为它是用来传输数据的，前端不需要它
            const skeletonJsonWidget = widgets?.find(w => w.name.toLowerCase() === "skeleton_json_str")!;
            skeletonJsonWidget.hidden = true;
            // 组件读写
            type WidgetType = typeof widgets[0];
            const widgetRW = (widget: WidgetType) => (val?: string) => {
                if (val) {
                    widget.value = val;
                } else {
                    return widget.value as string;
                }
            };
            const boneStyleRW = widgetRW(boneStyleWidget);
            const jsonStrRW = widgetRW(skeletonJsonWidget);
            const widthRW = widgetRW(widthWidget);
            const heightRW = widgetRW(heightWidget);
            // @ts-ignore
            // 当后端发现JSON不对劲时，通知前端更新正确的JSON
            app.api.addEventListener("send-skeleton-json", (e: CustomEvent) => {
                // 收到skeleton_json_str后，更新widget的值
                // 由于从后端发来，故必然正确
                // widthRW(e.detail["width"]);
                // heightRW(e.detail["height"]);
                jsonStrRW(JSON.stringify(e.detail));
                // warnInvalidJSON();
            });
            // 加个按钮替代右键菜单吧
            node.addWidget("button", "Open Editor", "", () => {
                // const content = tryParseJson(jsonStrRW());
                // if (content && content["width"] && content["height"]) {
                //     widthRW(content["width"]);
                //     heightRW(content["height"]);
                // }
                window.dispatchEvent(new CustomEvent(EVENTS.showEditor, {
                    detail: {
                        width: widthRW(),
                        height: heightRW(),
                        jsonStrRW,
                        boneStyleRW,
                    }
                }));
            });
        }
    },
    async setup() {
        let mountPoint = document.createElement("span");
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
        // 移除莫名其妙的mask。目前已知该mask一定会在使用konva的v-stage后出现，暂无很好的解决办法，只能在DOMContentLoaded后移除。
        const weirdMask = document.querySelector('[data-pc-section="mask"]');
        if (weirdMask) {
            console.log("Removing weird mask...");
            weirdMask.remove();
        } else {
            console.log("No weird mask found.");
        }
    }
});
