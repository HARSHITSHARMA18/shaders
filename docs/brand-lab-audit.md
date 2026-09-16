# Brand Lab repository audit — Phase 0

## Baseline and authority

Started on clean `main`, tracking `origin/main`, commit `2604f67`. Created user-requested `feat/brand-lab` before changing files. No unrelated work to preserve. Do not merge.

The supplied package already exists extracted in Downloads; no ZIP was available there. Read 00, then 01–07 in order, and 99 as a future handoff template, not feature scope. Read the “Design shader brand lab” discussion for context: later decisions reject the earlier living wall, onboarding, broad initial scene set, and permanent properties panels. Current user instructions define the stopping point; reference images/video are conceptual evidence, not shipped assets or copied designs.

## Repository map

- Next.js 16 App Router. `app/page.tsx` renders client `ShaderCatalog`; 14 explicit `app/shaders/<slug>/page.tsx` routes render dedicated client labs. Root metadata reads request headers, making the application request-rendered. No routing framework or global editor store to reuse.
- `scripts/build-registry.mjs` owns publication definitions and generates `registry.json`, `public/r/registry.json`, and each installable JSON. The generated root registry is the canonical consumable catalog; it contains names/titles/files, but no capability or default metadata.
- `app/components/*Shader.tsx` and other renderer wrappers re-export installable `registry/default/*` source. Nine implementations supply 14 effects; six field variants share `SolaceFieldShader`.
- All main renderers use WebGL2/GLSL. Auxiliary 2D canvases rasterize text/SVG, generate source images, or analyze image features. No WebGPU, shared render manager, external renderer framework, or native capture API.
- Lab controls use persistent `useDialKitController`, grouped shader-specific settings, `PaletteEditor`, reset buttons, tooltips, and Motion. Renderers keep settings in refs so uniforms update outside React frame state. Brand Lab should consume renderer props directly; mounting full labs would bring permanent control and install panels.
- Design language: `app/globals.css` defines warm `--paper: #efeee8`, dark ink, mono metadata, fine borders, and the Shaders wordmark. Catalog is light; editors are dark. Campaign should extend the paper catalog, with scoped CSS and a quiet header.
- Labs generate configured JSX from their real props; clipboard helpers are local duplicated functions. Install commands use the current browser origin and `/r/<slug>.json`, with canonical origin for SSR. No general JSON setup schema or URL configuration parser exists. Open-editor links can navigate only; transferred values need a later validated integration.
- Media labs use local blob URLs and image/video file inputs; video is muted/looping/inline with explicit `mediaType` necessary for blob URLs. Most do not validate decode/type/size before replacement. CORS-enabled images are used for GPU textures.
- Catalog mounts all 14 live renderers. There is no static thumbnail set or preview quality/paused prop. DPR caps range 1.75–2; full render loops run continuously. Fluid uses multiple float targets and 12 pressure iterations per frame. Sharing output is particularly valuable there.
- Renderers generally cancel RAF, disconnect resize observers, remove pointer listeners, and delete buffers/programs/textures/FBOs on unmount; media implementations stop/unload videos. Shader compilation/no-WebGL handling varies, often logging or returning a blank canvas. A Brand Lab boundary must recover independently.
- No `toBlob`, asset download, composed DOM export, renderer readiness protocol, deterministic capture, or font/media export pipeline. Deferred export must be a dedicated Surface render at preset size, not a canvas screenshot library chosen now.
- `tests/application.test.mjs` checks registry publication, shader routes, retired infrastructure, source links, analytics, and license. Build/lint are existing checks. Ignored directories from old deployments are present on disk but their files are retired; do not resurrect Sites/Cloudflare/database infrastructure.

## Shader capabilities

All rows: WebGL2, typed React props/settings; no serialized URL setup; no native export; no preview scheduler. Cost estimates are relative from code, not measured GPU timings.

| Registry ID | Component / input | Palette and useful control | Relative cost |
| --- | --- | --- | --- |
| thermal-pixel-ink | ThermalPixelShader; generated heat | Six custom colors; heat, ambient, cellSize | Medium; ping-pong heat |
| viscous-cursor-dye | SolaceFieldShader / viscous; generated | Four custom colors; intensity, distortion, scale, speed | Low–medium; fragment field |
| reaction-bloom | SolaceFieldShader / reaction; generated | Same field props | Low–medium |
| cellular-contagion | SolaceFieldShader / cellular; generated | Same field props | Low–medium |
| repulsion-lattice | SolaceFieldShader / repulsion; generated | Same field props | Medium; point field |
| magnetic-pixels | SolaceFieldShader / magnetic; generated | Same field props | Medium; point field |
| chromatic-refraction | SolaceFieldShader / chromatic; generated | Same field props | Medium |
| thermal-etch-burn | ThermalEtchBurn; generated or image | Six partial custom colors; heat, progress, grain, speed | Medium |
| particle-assembly | ParticleMorphShader; word or SVG | Four custom colors; count, scatter, interaction | Medium; target raster + particle buffer |
| refractive-lens | RefractiveLens; generated/image/video + SVG lens silhouette | Glass tint/strength; refraction, size, dispersion | Medium; textures |
| exposure-grid | ExposureGrid; image/video | Five partial colors; intensity, activity, grain | Medium; texture samples |
| fluid-distortion | FluidDistortion; generated/image/video/SVG | Five partial colors; distortion, swirl, gloss | High; fluid multipass |
| blackhole-lensing | BlackholeLensing; generated/image/video | Four partial colors; lens, radius, orbit, mode | Medium–high |
| specimen-index | SpecimenIndex; generated/image/video + image analysis | Five partial colors; probes, geometry, motion | Medium–high; analysis + detail sampling |

Native SVG silhouette is not equivalent to masking final shader output. Brand Lab can clip final material with CSS masks without pretending all renderers accept SVG. Field shaders cannot process uploaded media: retain a photo region alongside contained generated material, and describe that accurately. Refractive tint is not full palette replacement; omit Brand palette for this slice's lens adapter rather than force it.

## Smallest architecture and exact first slice

Route `/brand-lab`, linked from the existing catalog header. One Campaign renderer: fictional cultural studio **FORME**, “A different kind of gathering.” A dominant portrait poster with full-bleed material; contained square study with editorial copy; wide letterform/logo mask; small material accent; untouched invitation typography for visual rest. No other Scene buttons promising nonexistent scenes.

- `app/brand-lab/page.tsx`: server route and page metadata; pass canonical registry entries to client shell.
- `app/brand-lab/BrandLab.tsx`: local durable state for brand, shader ID/null, selected Surface, per-Surface placement/intensity, palette, media. No state library, persistence, compare fields, universal editor, or frame values in React state.
- `app/brand-lab/CampaignScene.tsx`: explicit composed layout and small Surface descriptors (ID, label, dimensions, useful placements). This is curated JSX, not a schema-driven layout engine.
- `app/brand-lab/ShaderMaterial.tsx`: lazy renderer adapters consuming existing typed props. One private renderer canvas, sampled into a few 2D presentation canvases with different crops/clips. Verify draw timing because public canvases do not preserve drawing buffers. Suspend/unmount live source while document hidden/offscreen; retain last frame, use a still capture for reduced motion. Error boundary plus WebGL/context-loss recovery. No public renderer changes unless runtime proves necessary.
- `app/brand-lab/brand-lab.css`: scoped styling using existing paper/ink/mono conventions.
- `public/brand-lab/previews/`: representative real renderer frames captured sequentially, one context at a time. Static rail means no runtime thumbnail renderers.
- `docs/brand-lab-work-log.md`: actual runtime validation, limitations, decisions, and revisiting conditions.

Reuse unchanged: `ShadersLogo`, all nine `app/components` renderer re-exports and their registry source, root `layout.tsx`/analytics, existing local media (`exposure-grid-mountain.jpg` for restrained photographic crop), core shader routes/install flows. Modify only `app/components/ShaderCatalog.tsx` for the entry link. Do not reuse `PaletteEditor`/DialKit panels in the canvas: native small color controls are appropriate to the limited inputs. No package additions or registry refactor.

Brand controls: name, tagline, primary/secondary colors, raster/SVG logo, image/video; validate/decode before swapping, preserve old input on failure, revoke object URLs. A selected Surface reveals relevant placement/strength controls. Native palette/Brand where supported. Plain “Explore shader” navigates to the existing editor with its own settings; it does not claim transfer. No fake export/code/Compare buttons.

## Export and future boundaries

Future portable setup should serialize each adapter's actual public props separately from Scene-only crop, mask, and opacity. Surface metadata can eventually provide output dimensions to a dedicated composition renderer, with explicit font/media readiness. Shared source is for interactive preview only: an export should re-render at output dimensions, and may need native GPU hooks. Add synchronized candidates only after approval; local brand and Surface state are already separate from shader selection.

## Risks to validate in Phase 1

GPU → 2D frame copies can cause synchronization/readback overhead; cap source size and presentation DPR, sample at 30 fps, measure responsiveness. Shared square/portrait material changes aspect-dependent native behavior, and shared pointer interaction needs explicit forwarding. Repeated unmounts delete resources but browsers may retain context slots until collection; verify many switches. Memory/GPU timings are not reliably exposed in the available environment: report canvas counts, source/presentation sizes, CPU-observed frame cadence, console errors, and limits rather than invent GPU metrics. Video texture uploads and software-rendered WebGL may lower cadence. Static thumbnails need recapture if renderer output changes.
