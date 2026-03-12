import type { ComfyApp } from "@comfyorg/comfyui-frontend-types"

interface Window {
    comfyAPI: {
        app: {
            app: ComfyApp
        },
        utils: {
            addStylesheet: (
                urlOrFile: string,
                relativeTo?: string
            ) => Promise<void>,
            applyClasses: (
                element: HTMLElement,
                classList: ClassList,
                ...requiredClasses: string[]
            ) => void,
            setStorageValue: (id: string, value: string) => void,
            getStorageValue: (id: string) => string | null,
            uploadFile: (accept: string) => Promise<File>
        }
    }
}

export type ClassList = string | string[] | Record<string, boolean>
export { Window }