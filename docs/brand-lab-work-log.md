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

## Campaign refinement pass

See [the refinement review](./brand-lab-refinement.md) for the all-shader visual review, reproduced delayed-module timeout, visibility lifecycle fix, recovery/keyboard improvements, smaller mobile source, and measured GPU-draw/buffer findings. This pass remains uncommitted as requested.

## Review questions before expansion

### Brand colors and Original refinement

Brand Lab now reuses the core shader panels' `PaletteEditor` with Primary/Secondary stops, a saturation/brightness field, hue slider, and validated hex input. Light styling is scoped to the Brand Lab dialog; the shared component is unchanged. The Original entry uses a small outlined image symbol rather than the slashed glyph. TypeScript, scoped lint, and browser integration checks passed for color propagation, both stops, hue/keyboard adjustment, reset, desktop/mobile dialog bounds, and Original disabling the renderer.

The user requested that all subsequent work remain uncommitted unless they explicitly ask to commit. This refinement is left unstaged/uncommitted; earlier commits remain intact.

Judge the overall Campaign composition, the default identity/media choice, the balance of shader material and untouched photography, and whether sharing one treatment through cropped/masked roles provides enough creative range. Approve or refine that direction before adding another Scene or any export/setup infrastructure.

## 2026-09-17 — Setup links and shader-editor transfer

Added versioned Campaign setup links and isolated temporary editor transfers for all fourteen canonical shaders. Scene previews and transfer use one typed native snapshot. Saved editor values and named presets remain intact, including after temporary edits. Uploaded files are explicitly excluded from portable links and prompt replacement; Etch now supports transferred Campaign images and replacement. Native editor edits do not flow back into Campaign in this slice. See brand-lab-transfer.md for file reuse, architecture, validation, and limitations. All changes remain uncommitted on feat/brand-lab.

## 2026-09-17 — Curated in-page shader tuning

Following the user's approval of the handoff's restrained controls, added Tune shader with an on-demand right drawer/mobile sheet using actual DialKit sliders. Three capability-aware numeric controls per shader update Campaign's native renderer settings, stay separate from Surface strength/placement, and survive switching effects. Viscous exposes Trail instead of Scale to avoid a previously observed wrap seam. Reused PaletteEditor inside a collapsed Brand colors section. Added reset, keyboard interaction, focus return, and tuned setup/editor transfers; version-1 links migrate to version 2. No global DialKit panel or persisted editor values are modified. No feature expansion beyond Campaign. All changes remain uncommitted. See brand-lab-tuning.md.

## 2026-09-18 — Curated tuning final verification

Final production build and TypeScript, scoped ESLint, all five repository tests, and whitespace checks passed. Browser QA verified all 42 curated controls, tuned transfers to all fourteen native editors, source retention, local switching, palette/color editing, setup restoration, legacy migration, invalid-value handling, reset, mobile bounds, and reduced-motion recapture. Fluid configured JSX now retains the softness control's three-decimal precision. Reviewed the final compact desktop drawer and mobile sheet screenshots. Physical-device performance remains unmeasured. All changes remain uncommitted on feat/brand-lab for review.

## 2026-09-18 — Campaign performance follow-up

Measured image/video preview copies for Viscous, Exposure and Fluid at desktop and emulated-mobile viewports. ShaderMaterial now skips live offscreen presentation copies after seeding every role; reduced motion still captures the complete Scene. Desktop samples with two offscreen roles halved the copy count, while native shader rendering cost is unchanged. Scrolling resumes copied frames. A long host-pause sample is excluded from timing conclusions; physical-device testing remains pending. See brand-lab-performance.md and the review-only brand-lab-identity-proposal.md. Production build/TypeScript, scoped lint, five repository tests and the full shader/pixel/media/recovery browser checks passed. All changes remain uncommitted on feat/brand-lab.

## 2026-09-18 — Identity Scene

Following explicit user authorization, added an art-directed Identity specimen with actual shaders, restrained Scene switching, separate Surface treatments, shared brand/tuning, portable Identity setup restoration and return links from the existing editors. Desktop/mobile layouts were visually inspected. All fourteen shaders produced real pixels; treatment switching, logo replacement, setup/native transfer and reduced-motion checks passed. Particle signature controls are constrained to its actual full-frame word assembly. See brand-lab-identity.md. Everything remains unstaged/uncommitted on feat/brand-lab; no further Scenes, Compare or exports were built.

## 2026-09-18 — Drafting canvas finish

Added CanvasFrame around both Scenes with a faint 20px grid, subdued 100px major divisions on desktop, and narrow top/left rulers. SVG ticks and labels measure canvas CSS pixels from the same grid origin; PX distinguishes them from asset/export dimensions. ResizeObserver updates ruler geometry only on layout changes, with no animation loop or shader changes. Decoration is hidden from accessibility and ignores pointer input. Mobile uses a lighter single grid and a protected ruler gutter. Build/TypeScript, scoped lint, desktop/mobile ruler sizing and overflow checks passed; both Scene screenshots were visually inspected. Existing uncommitted work is preserved on feat/brand-lab.

## 2026-09-18 — Web Scene

Added an explicit Web landing-page specimen with actual shader hero, feature and CTA roles. Reused brand/tuning/context controls, drafting grid/rulers, one native preview source and setup/editor transfer. All fourteen native effects produced real hero pixels. Surface treatments survive switching among Campaign, Identity and Web; tuned Web links restore and editor transfer returns to Web. Video, Original, reduced motion and responsive bounds at 320/390/768 pixels passed. Desktop, mobile and tablet compositions were visually inspected. Fixed hero/CTA aspect-ratio plus minimum-height overflow by constraining widths to their containing canvas. Build/TypeScript, scoped lint, five repository tests, whitespace and Campaign interaction/recovery regressions passed. See brand-lab-web.md. Everything remains unstaged/uncommitted on feat/brand-lab; no further Scenes, Compare or exports were built.

## 2026-09-19 — Four-sided drafting frame

Moved the Campaign/Identity/Web switcher, active shader name, Tune shader and View original controls inside CanvasFrame below the top ruler. Added matching right/bottom rulers and corner joins around the existing faint grid, so rulers mark all four inner edges without overlapping the controls. Restored View original on narrow screens in a compact two-row toolbar. The units remain viewport CSS pixels, not export dimensions; rulers are decorative, pointer-transparent and hidden from assistive technology. Build/TypeScript, scoped lint, five repository tests, visual inspection and a 12-combination browser check of desktop/tablet/mobile ruler geometry, controls and overflow passed. Everything remains uncommitted on feat/brand-lab.

## 2026-09-19 � Scene pattern refinement

Responding to the review that Campaign, Identity and Web repeated the same centered material too often, varied the live shader's role rather than importing or reproducing reference patterns. Campaign uses a diagonal generated-material cut through photography and a full brand-name shader mask. Identity gives its secondary tile a full-field material treatment, labels it with the brand, and places a circular material specimen over the original image. Web gives the feature image a horizontal material band and the call to action sparse diagonal rails. The native renderer is still shared; deterministic, surface-specific crop windows in ShaderMaterial change the framing for generated shaders without adding WebGL contexts. Media-processing shaders keep their original media alignment. The Brand Lab controls, setup links and existing Surface treatment options remain available.

Production build, TypeScript, scoped ESLint, five repository tests and git diff --check passed. Visual QA covered Campaign/Identity/Web with Viscous Cursor Dye and Exposure Grid at 1745px and 390px; all twelve render/overflow checks passed. The main Brand Lab, Identity and Web browser checks passed across all fourteen shaders, interactions, setup and responsive states. Physical-device performance remains to be measured. All work stays unstaged and uncommitted on feat/brand-lab.

## 2026-09-19 - Art direction review: five applications

The review rejected the earlier secondary assets as too raw. Kept the Campaign hero poster as the anchor, rebuilt its material study as a two-poster campaign pair, and made the third asset a coordinated material/typography graphic pair. Rebuilt Identity around a dark typographic brand spread and two aligned graphic studies; one uses a fine halftone mask over the real shader. Rebuilt Web as a content-led promo with an inset event card, an editorial feature, and a deliberate footer banner. These adapt the compositional ideas in the user-provided Light Rails examples without copying its typography, copy, palette, or assets. Every material region still uses the repository's native shader source. Renamed Surface labels and dimensions to match the new applications, and removed the selected-shader dots from the sidebar and canvas toolbar. Default treatments now expose the material across the new spread, graphic pair and banner; existing portable setups retain their chosen treatments.

Visually reviewed generated and media-processing shader captures for Campaign, Identity and Web at 1745 and 390 pixels, corrected narrow-screen text collisions and an inherited shader-height rule, and reran twelve render/overflow checks. Production build, TypeScript, scoped ESLint, five repository tests, all-shader Campaign/Identity/Web browser checks, setup and editor-transfer checks, reduced motion and no-WebGL fallback passed. This remains a curated set of applications, not a pattern browser or export system. Physical-device performance is still unmeasured. All work remains unstaged and uncommitted on feat/brand-lab.

## 2026-09-20 - SolaceUI defaults and working assets

Made Specimen Index with its native palette, the untouched SolaceUI SVG, and the current mountain media the Brand Lab defaults. The Campaign poster colors the mark white at display time; Identity uses a white signature copy panel with a black mark, one type family, and a material-only Graphic Study B; Web uses one type family and removes the misplaced Editorial Feature image. The SVG bytes remain unchanged in public/brand-lab/solaceui-mark.svg. All three default Scenes were visually checked at desktop and mobile sizes.

Added a reverse path from each native shader editor into Brand Lab. The editor reads its live DialKit state and transfers the curated numeric controls supported by Brand Lab; direct visits open Campaign, while sessions started in Brand Lab return to their Scene with those edits. Custom native-only controls and uploaded media remain outside portable setup links. Selected asset panels now expose per-asset secondary copy, preserving edits in setup links, and download the selected asset as a PNG at its listed preset dimensions. Campaign poster (1080x1350), Identity signature (1600x840), and Web editorial feature (1200x900) exports were captured and visually inspected. The material is a live preview frame, so these are static preview images rather than animation or print-resolution shader re-renders.

Retained the previous canvas bitmap while switching shaders and added a quiet composing state before the first shader frame, avoiding the brief original artwork flash. Production build, TypeScript, scoped lint, core tests, Identity shader sweep, Web interactions, editable-copy roundtrip, PNG export and an actual Specimen native-control return passed. All fourteen native adapter/setup regressions and the full Campaign shader, input, recovery and responsive browser suite passed against the production build. No commit was made; all work remains on feat/brand-lab.
