# Brand Lab setup and editor transfer

Implemented on feat/brand-lab; intentionally uncommitted pending review.

## Behavior

Copy setup link now produces a version-2 Campaign setup including curated shader tuning; version-1 links remain supported. See [curated tuning](./brand-lab-tuning.md) for the follow-up. It contains the brand name, campaign line, two brand colors, selected canonical shader, palette choice, each Surface placement and composition strength, and the selected shader's native settings snapshot. Opening the link restores these values. Invalid, unsupported, or tampered setups fall back to the starting Campaign with an explanation.

Explore opens the existing shader editor with the native settings applied. The normal persisted DialKit panel is untouched: transferred sessions have a separate panel ID and persistence disabled. All ordinary editor visits retain the existing panel IDs, persistence, named presets, controls, installation flow, and configured JSX.

The Scene and transfer now share one typed native-settings module. Previously implicit renderer defaults are explicit in this private snapshot. No canonical registry renderer, installation artifact, or package dependency changed.

## Files

- app/brand-lab/native-settings.ts: typed private snapshots for all nine native renderer families and the six Field variants.
- app/brand-lab/setup.ts: small versioned Campaign schema, serialization, validation, Surface defaults, and upload redaction.
- app/brand-lab/BrandLab.tsx and page.tsx: restore setup, copy link, and contextual missing-asset prompt.
- app/brand-lab/ShaderMaterial.tsx: use the shared native snapshot without changing the one-source preview architecture.
- app/components/BrandLabTransfer.tsx: transfer context, restrained session notice, media replacement action, and a DialKit wrapper that populates temporary configuration defaults before registration.
- Nine existing shader Labs: use the wrapper and initialize supported media/Particle word inputs from the setup.
- Fourteen app/shaders/*/page.tsx files: validate the query and supply a matching setup to the existing Lab.
- ThermalEtchBurnLab: transferred image rendering and image replacement; normal procedural editor remains unchanged.
- scripts/brand-lab-transfer-check.mjs: isolated browser integration verification with an optional external Playwright runtime.

## Deliberate limits

Uploads remain browser object URLs and are excluded from portable links, including Explore links. A reopened setup uses the bundled image and initial-based identity until the user replaces the missing files. Brand Lab shows Replace assets; compatible editors offer Replace media. There is no uploaded-asset storage or hosting infrastructure.

Editor adjustments belong to that temporary editor session. Back to Campaign restores the originating Campaign setup; it does not import subsequent editor edits. V1 snapshots describe the current curated Scene adapters, not arbitrary future editor configurations.

Surface strength is composition opacity, distinct from native shader intensity. Crops and masks remain Scene composition rules. Editor previews use their existing geometry and interactions; matching native settings does not promise identical framing or animation phase.

Physical-phone GPU memory and sustained performance still require testing on a real device. Desktop browser viewport emulation is not a physical-device result. Identity, exports, and Compare remain deferred.

## Verification

All fourteen transferred native settings match the current renderer props. Compatible shaders receive the bundled Campaign media; Particle receives the brand word. A non-default saved Field value and named preset survive transfer visits and a real pointer edit in the temporary panel; an ordinary editor visit restores them afterward. No temporary panel is persisted. Setup links round-trip, retain Surface placement/strength and brand copy, exclude upload URLs, report missing files, and clear missing-asset prompts after replacements.

Final production verification also passed the full fourteen-effect real-pixel sweep, image/video handling, keyboard Surface controls, reduced-motion capture, mobile/tablet bounds, no-WebGL fallback, and forced context-loss recovery. Restored missing-asset setups were checked at a 390×844 browser viewport with a full-height brand dialog. Etch replacement reaches the actual renderer and adds its media prop to configured JSX. Visual QA captures and reports are in ignored outputs/brand-lab. Production preview: http://127.0.0.1:3004/brand-lab.
