// vue
import { createApp } from "vue"
// primevue
import PrimeVue from "primevue/config";
// shared data types
import { comfyApp, utils, postTextData, EVENTS } from "./constants.js";
import App from "./App.vue"

// extensions/comfyui-mdnotes是固定的，后续内容和/web目录有关
const CSS_PATH = "extensions/comfyui-mdnotes/assets/style.css";
utils.addStylesheet(CSS_PATH);


comfyApp.registerExtension({
    name: "endericedragon.comfyui-openpose-editor-konva",
    settings: [
        {
            id: "OptionName",
            name: "Save after closing the markdown editor?",
            type: "boolean",
            defaultValue: false
        }
    ],
    getNodeMenuItems(node) {
        // 每次点击右键都会触发这个回调函数
        // //! 调试用，正式发布时记得注释掉
        // for (let widget of node.widgets) {
        //     console.log(widget.name?.toString());
        // }

        const nodeTypeStr = node.type;
        let newMenuOptions = [];
        if (nodeTypeStr === "OpenPoseEditorKonva Controller") {
            return [
                {
                    content: "Show OpenPose Editor (Konva)",
                    callback: () => {
                        // 触发自定义事件，展示编辑器窗口
                        window.dispatchEvent(new CustomEvent(EVENTS.showEditor, {}));
                    }
                }
            ];
        } else {
            return [];
        }

        // comfyApp.extensionManager.toast.add({
        //     severity: "warn",
        //     life: 3000,
        //     summary: "MDNotes Warning",
        //     detail: "Found no note, ready to create one",
        // });
    },
    async setup() {
        let mountPoint = document.createElement("div");
        mountPoint.id = "mdnotes-ui";
        document.body.appendChild(mountPoint);
        createApp(App)
            .use(PrimeVue)
            .mount(mountPoint);
    }
});
