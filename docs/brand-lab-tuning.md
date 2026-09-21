# Brand Lab curated shader tuning

Implemented on feat/brand-lab; all changes remain uncommitted pending user review.

The handoff requests a few meaningful shader-specific controls rather than mirroring the full editor. Tune shader opens an on-demand right-side drawer on desktop and a bottom sheet on mobile. The canvas keeps its original geometry. Choosing a Surface closes the drawer and restores the existing contextual placement/strength controls. Original artwork has no shader controls.

## Curated controls

| Shader | Native controls |
| --- | --- |
| Viscous Cursor Dye | Distortion, Trail, Speed |
| Other five Fields | Scale, Distortion, Speed |
| Thermal Pixel Ink | Cell size, Ambient heat, Speed |
| Thermal Etch Burn | Burn progress, Grain, Speed |
| Particle Assembly | Particle size, Scatter, Assembly duration |
| Refractive Lens | Lens size, Refraction, Dispersion |
| Exposure Grid | Columns, Sampling activity, Grain |
| Fluid Distortion | Distortion, Softness, Gloss |
| Blackhole Lensing | Portal radius, Lensing, Orbit |
| Specimen Index | Probes, Detail, Motion |

Viscous retains canonical scale 1: previous visual QA found an angular-wrap seam at some other scales. Trail gives a useful interaction adjustment without exposing that known visual weakness. Three controls per shader keep browsing and composition central. Optical tint remains native for Lens.

## Reuse and state

ShaderControlsDrawer uses DialKit's existing controlled Slider component directly. DialRoot does not provide panel-ID filtering and would show globally registered panels; avoiding it keeps this drawer isolated from standalone editors and their persisted presets. No new global DialKit panel or persistence key is registered. Keyboard slider support is added around the existing pointer/text-edit controls using arrow keys, Shift for larger steps, and Home/End. Escape closes the drawer and returns focus to Tune shader.

The shared PaletteEditor supplies brand color editing inside a collapsed Brand colors section. Original/Brand behavior is capability-aware. Reset clears the selected shader's numeric adjustments and returns to the Scene's Brand palette behavior, preserving brand inputs, assets, and Surface treatments.

BrandLab stores small numeric adjustments per canonical shader during the local session. Switching shaders keeps these values. native-settings.ts applies them to the selected native renderer family; the other defaults and all canonical renderer source files are untouched. ShaderMaterial passes the settings to its existing lazy source, retaining the one-WebGL-source preview architecture. Live edits update settings without remounting that source. Reduced-motion edits capture a fresh still and release the source afterward.

New setup links are version 2 and serialize the active shader's adjustments plus the actual complete native snapshot. Version-1 links migrate to empty tuning. Validation accepts only the curated keys within bounded numeric ranges, then verifies the full native snapshot; unsupported keys, invalid values, or inconsistent snapshots fall back safely. BrandLabTransfer applies those same tuned native values to the isolated editor session.

## Scope and limits

Changes are limited to app/brand-lab/BrandLab.tsx, ShaderControlsDrawer.tsx, shader-controls.ts, native-settings.ts, ShaderMaterial.tsx, setup.ts, brand-lab.css, and app/components/BrandLabTransfer.tsx, plus a FluidDistortionLab.tsx configured-JSX precision fix (three decimals for softness), documentation and local integration QA.

Links contain the active shader's adjustments, not every cached local shader variation. Uploaded media is still excluded from portable/Explore links and prompts replacement. Subsequent edits in the standalone shader editor still do not flow back into Campaign. Full editor controls remain available through Explore full editor. Physical-device performance remains unmeasured. No new Scene, export, Compare, generalized editor framework, or registry/dependency change is included.

## Verification

The final production integration run passed all 42 curated numeric controls across 14 shaders, verifying actual renderer props, untouched unrelated settings, source-canvas identity, local switching persistence, palette switching, real DialKit pointer editing, tuned setup restoration and transfers to all 14 native editors, Fluid configured-JSX softness precision, collapsed color editing, v1 migration, validation of out-of-range settings, reset, mobile bounds, and reduced-motion recapture. Build, TypeScript, scoped ESLint, and all five repository tests pass. The compact desktop drawer and mobile sheet were visually inspected after the density refinement. No uncaught browser errors were observed. Reports and screenshots live under ignored outputs/brand-lab.
