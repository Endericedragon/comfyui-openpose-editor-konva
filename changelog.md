# Change Log

## [1.1.6] - 2026-03-09

### Fixed

Remove redundant output in `main.ts`.

## [1.1.5] - 2026-02-01

### Added

Now the similarity threshold is 0.5 by default, and can be modified in the setting menu.

## [1.1.3] - 2025-12-16

### Fixed

- Change the return type & value of `postJsonData` and `postTextData`.

## [1.1.2] - 2025-12-15

### Added

- Add PrimeVue Icons to the project. 

## [1.1.1] - 2025-12-12

### Added

Now we use `window.comfyAPI` to replace the import of things in `external` option of `vite.config.mts`. This modification removes all the error messages in this custom node.

### Fixed

Temporary fix for ComfyUI v0.4.0 update. In short, ComfyUI no longer provide Vue in the frontend, which results in the failure of all things in "peerDependencies" of `package.json`.

To fix that, we now use Vue as normal "dependencies", and remove the "lib" option in `vite.config.mts`.

## [1.0.9] - 2025-12-07

### Added

- Add support for unet models. Now this custom nodes could also show notes for unet models (models in `models/diffusion_models`).

### Fixed

- Fix the issue when no markdown file exists. Now it will show a warning message instead of crashing.

## [1.0.8] - 2025-10-11

### Added

- Add the very first change log file!

### Fixed

- import `EditorTrait` as a type rather than a class in `EditorModal.vue`