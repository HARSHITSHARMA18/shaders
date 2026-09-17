# Brand Lab — first vertical slice

Status: Phase 1 complete for review. Stop here; further Scenes, Compare, setup transfer, and exports require the user's direction. Work stays on `feat/brand-lab`; do not merge.

## Decision — Campaign first, one shared live material

Evidence: the [audit](./brand-lab-audit.md) maps the real 14-item registry and nine WebGL2 implementations. Several already process images/video. Field effects support palette-driven generated material; they do not process photographs.

Consequence: `/brand-lab` presents FORME, an independent cultural gathering, through a portrait poster, square material study, masked identity strip, and quiet invitation. One real shader source is copied into four 2D presentation canvases, each with a purposeful crop or mask. Generated effects occupy a narrow material strip beside the original photograph in the study. Image/video effects process the supplied media across the material. Nothing is a substitute gradient.

Revisit when: a reviewed Scene needs independently parameterized instances, or profiling shows GPU-to-2D copies becoming expensive.

## Decision — reuse public shader source unchanged

Evidence: all adapters import the existing `app/components` renderer re-exports; the installable `registry/default` implementations and core labs are unchanged. Registry names/titles reach the shell from generated `registry.json`. Only existing `app/components/ShaderCatalog.tsx` changes, adding the entry link. The root layout, analytics, logo primitive, paper/ink tokens, and existing photograph are reused.

Consequence: native shader parameters remain typed at the adapter boundary. Durable brand, selection, placement, palette, and strength live in local React state; frame rendering stays outside React. Ordinary brand edits preserve the active canvas and use the renderers' existing settings refs. Native media changes can rebuild their own effects. Strength is **composition opacity**, not an invented universal native shader intensity API. Placement is final-output clipping/cropping, not a claim that every shader natively supports media or SVG masks.

Revisit when: portable setup is approved. Extract each adapter's real component props then, separately from composition opacity/crop/mask metadata.

## Decision — quiet, functional controls only

Evidence: the completed slice has one Campaign label, all 14 visual shader tiles plus Original, three keyboard-selectable Surfaces, contextual placement/strength, and a native dialog for name, campaign line, two colors, logo, and image/video. The dialog traps focus through native modal behavior and closes with Escape. Input type/size/decode validation happens before replacement; old assets survive failures; blob URLs are revoked on replacement/reset/unmount.

Consequence: Original/Brand palette modes use actual native color props where useful; Refractive Lens keeps its optical tint and disables Brand. Blend is deferred. Logo masking uses uploaded image alpha; transparent logos work best. Particle Assembly uses the brand name as its word target; direct uploaded-SVG particle assembly is not implemented. Videos animate through compatible native shader renderers; the unaffected Original media region is a paused film still.

`Explore shader` navigates into the existing editor with its own defaults/persisted controls. It does **not** transfer Brand Lab values. There are no fake export, copy setup, Compare, or other Scene buttons.

## Decision — static rail and bounded source lifecycle

Evidence: 14 PNGs were captured from real rendered material, serially. The six Field thumbnails were refreshed after the canonical-scale visual correction. They are 128 × 128, totaling 435,322 bytes. They create no WebGL thumbnail contexts. They show the default identity's representative material, and do not regenerate with custom brand inputs.

Consequence: live source is 640 × 800 CSS px, with the existing renderer DPR caps (up to 2). Four 2D presentation canvases use CSS-pixel backing sizes. Copy scheduling caps at 30 fps. A zero-size paint-contained source wrapper avoids hidden-canvas mobile overflow. The whole live source unmounts when the document or Scene is hidden. Reduced motion captures a short initial still and releases the live renderer; changing brand/shader can recapture it. Detached private contexts explicitly lose their slot after native cleanup, preventing reliance on browser GC across repeated switches.

Compilation/no-WebGL/context-loss failure falls back to the original artwork while preserving usable controls. Initial artwork remains visible until a subsequent copy, avoiding a first-draw blank-frame race.

Visual QA also exposed an angular wrap seam when the initial field adapter used scale 0.9. The viscous fragment computes `sin((radius * 19 - angle * 2) * scale - time * 2)`; arbitrary scale changes the angular period across `atan`'s branch cut. Returning to the public component's canonical scale 1 closes the wrap without changing its GLSL source. Field adapters now use that default.

Revisit when: HiDPI/mobile profiling warrants a smaller source, production measurements show insufficient input responsiveness, or shared crops compromise an effect's native composition.

## Validation and observations

- Production Next.js build, TypeScript, whole-repository ESLint, and all five existing application tests passed.
- Optional headless Chromium checks exercised every canonical shader: all 14 produced nonflat actual pixels; one live source; stable poster width; no uncaught errors.
- Browser checks passed Original, keyboard Surface selection, placement/strength, immediate brand copy propagation, preservation of the source during copy edits, valid image/SVG-logo uploads, invalid PNG recovery, uploaded video through Exposure Grid, reset URL revocation, reduced-motion recapture, 390 × 844 mobile, 1024 × 900 tablet, no-WebGL fallback, and 18 additional shader switches beyond the browser's usual context limit.
- No context exhaustion warnings. The report contains one intentional failed blob fetch from the URL-revocation assertion; it is not a render/media failure.
- Observed copy cadence: approximately **28.6 copies/sec** for Thermal Etch in headless Chromium at 1440 × 1000, DPR 1, with one 640 × 800 source and four presentation canvases. This measures the preview-copy scheduler, not native GPU frame time.
- The 14-shader development sweep observed first copied frames in 168–1823 ms (mean ~1022 ms). Those cold selections include lazy chunks, development overhead, and native shader compilation; they are not production/warm switching promises or a guarantee of media readiness. Originals remain visible during preparation.
- GPU timing/memory, complete browser/device coverage, deterministic asset capture, and composed export readiness remain unmeasured/unimplemented. The shared-preview path needs broader profiling before expansion; don't infer desktop/HiDPI performance from one headless run.

## Reproduce browser validation

The optional `scripts/brand-lab-browser-check.mjs` uses an existing Playwright installation; no product/package dependency was added. Set `BRAND_LAB_PLAYWRIGHT_PATH` to its CommonJS entry and optionally `BRAND_LAB_BROWSER` to Chromium/Chrome. Run with the app serving `BRAND_LAB_URL` (default `http://127.0.0.1:3000/brand-lab`). `BRAND_LAB_TEST_VIDEO` enables an optional local video fixture test. `BRAND_LAB_CAPTURE_PREVIEWS=1` recaptures real thumbnails. `BRAND_LAB_SKIP_SHADER_SWEEP=1` runs just interaction/resilience checks after a focused lifecycle change.

Reports and desktop/mobile screenshots go into ignored `outputs/brand-lab`. Reference-video stills were inspected there; no supplied reference is shipped. The video demonstrates palette feedback, asset browsing, and contextual properties; its dark three-panel/layer editor was deliberately not reproduced.

The host's `npm` shim points at a missing npm CLI; checks were run with `node node_modules/...` and `node --test` instead. This is a local environment limitation, not a changed package script.

## Review refinement — 17 September 2026

The first review asked for a more deliberate sidebar, removal of duplicate hover tooltips, a styled placement menu, and reconsideration of Accent placement. Desktop now uses compact named material rows with thumbnail/selection treatments; tablet retains a small two-column browser and one dark custom tooltip; mobile uses a horizontal strip. Native `title` tooltips were removed. A local placement listbox supports arrow keys, Home/End, Enter/Space, Escape, Tab, and outside-click dismissal. Descriptions explain the composition roles. Accent placement was removed from the poster/study mode definitions and CSS because its floating rectangles lacked a convincing compositional role. The invitation's deliberately composed material sample remains.

Future variety still follows the handoff's curated Scene model: different compositions and applications, with several coherent Surfaces per Scene. This review does not authorize building a pattern/template library or the remaining Scenes.

Validation: production build/TypeScript, scoped ESLint, and production interaction/resilience browser checks passed. Reviewed captures at 1745 × 828 and 390 × 844. Browser checks now bring the study into view before waiting for material readiness, respecting the existing offscreen preview pause; keyboard placement selection, focus return, Escape dismissal, and absence of native tooltip/Accent options are asserted. No renderer implementation was changed in this refinement.

## Second review refinement — dialog and asset-local controls

Added the desktop material sidebar's left border and balanced its inset. The brand dialog explicitly sets fixed insets and automatic margins (the global reset removes the native dialog margins), centers on desktop, bounds its height with internal scrolling, and becomes a full-height mobile sheet. Its accessible name points to the heading. Placement/strength moved from the canvas footer to a small asset-anchored floating region, clamped to the viewport and repositioned on scrolling/resizing; mobile uses a bottom treatment card. The card hides when the selected asset leaves the viewport, remembers the selection, and closes with Escape or its close button, restoring focus to the asset. No rendering or durable-state architecture changed.

Validation: production build/TypeScript, scoped ESLint, visual inspection at 1745 × 828 / 390 × 844, and final production browser checks passed. Checks assert centered/bounded desktop dialog, full-height mobile dialog, visible asset-local controls within the viewport, removal of footer controls, and the existing interactions/resilience checks. Some earlier headless runs timed out returning from Original to Thermal; a final production rerun passed. Cold shader preparation still warrants performance follow-up before expansion. Readiness failures now emit diagnostic state and a screenshot, rather than only a timeout.

## Review questions before expansion

Judge the overall Campaign composition, the default identity/media choice, the balance of shader material and untouched photography, and whether sharing one treatment through cropped/masked roles provides enough creative range. Approve or refine that direction before adding another Scene or any export/setup infrastructure.
