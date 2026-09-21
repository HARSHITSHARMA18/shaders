# Web Scene — 2026-09-18

Implemented on feat/brand-lab, unstaged/uncommitted for review.

## Composition

An explicit content-led landing-page specimen: a restrained browser frame and navigation, serif hero copy beside an architectural shader window, an editorial feature with recognisable photography, and a dark CTA carrying a small shader-filled brand mark. Paper, readable content and space remain prominent. The shared drafting grid/rulers sit around the composition. Mobile stacks hero text and material, then the feature and CTA.

Three independently selectable Surfaces: Website hero (1600 × 900, Media/Background), Feature visual (1200 × 800, Media/Mask), Call to action (1600 × 500, Mask/Background). Dimensions describe intended assets; mobile is a responsive visual composition rather than a pixel-exact export. Background modes use a legibility scrim above actual shader pixels; scrims do not substitute for shader integration. The hero keeps generated material contained, optical shaders process actual media, and Particle retains its native word frame without the arch clip. Feature material is full-media for compatible effects and contained beside original photography for generated effects. Etch remains image-only, with its existing generated fallback for video.

The browser domain, navigation and CTA text are illustrative content inside selectable Surfaces, not a deployed site or navigation destination. They do not introduce fake application controls. Brand inputs, supplied logo, palette, numeric tuning, Original and uploads reuse the existing implementation.

## Integration

Added explicit WebScene.tsx, WEB_SURFACES and WEB_TREATMENTS. SceneId/sceneSurfaces/setup validation now accept campaign, identity and web. sceneLabel supplies accurate canvas, setup-notice, tuning and editor-return labels. BrandLab retains separate Surface treatments and shared brand/shader/tuning through all three Scenes. Version-2 Web links restore the Web Scene and its native settings; existing Campaign and Identity links remain supported.

Reused CanvasFrame, ShaderMaterial and its one-source preview architecture, SurfaceControls/PlacementPicker, ShaderControlsDrawer/DialKit Slider, PaletteEditor and temporary native editor transfer. No canonical shader source, registry/install artifact or dependencies changed. No universal layout engine, Product, Editorial, Social, Compare or exports implemented.

## Validation and limits

Production build/TypeScript, scoped lint and five repository tests pass. Optional brand-lab-web-check.mjs verifies all fourteen native effects produce non-flat hero pixels, one source and stable browser width; contextual placement/keyboard editing; three-Scene switching and treatment retention; tuning, setup restoration and editor return; Original; video input; mobile/tablet bounds and reduced-motion source release. Desktop screenshots were visually inspected. Mobile/tablet overflow was traced to hero/CTA aspect ratios plus minimum heights; both widths are explicitly constrained to the containing canvas. Desktop and mobile compositions were visually inspected.

The shared source still shares geometry/settings between roles. Uploaded files remain local, must be replaced in portable links, and are not exported. Core-editor edits do not flow back into Brand Lab. Physical-device performance remains unmeasured. Stop for Web composition review before expanding again.
