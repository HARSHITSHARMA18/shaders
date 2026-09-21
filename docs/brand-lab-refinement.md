# Campaign refinement review

Work remains on `feat/brand-lab`, unstaged and uncommitted. No second Scene, Compare, setup transfer, export infrastructure, or public shader-source changes.

## Visual review

Reviewed actual poster/study captures for all 14 canonical shaders, not thumbnail approximations. Viscous remains the default. Reaction, Chromatic, Thermal and the lattice effects give useful generated material; the photograph stays untouched beside it. Cellular/Magnetic and other busy effects needed stronger ink shading behind the poster hierarchy. This shading sits over the real shader; it does not substitute for it.

Lens, Exposure, Blackhole and Specimen give distinct media compositions. Lens deliberately retains its native optical tint. Fluid's orbit treatment was swallowing the photograph, so the adapter reduces distortion from 0.6 to 0.28, gloss from 0.5 to 0.35, and cursor power to 0.18. Particle's word animation is useful in the poster but less convincing through a single-letter mask; no unsupported universal role is invented. Thermal Etch processes images only. With video, its procedural material now occupies the generated-material strip beside the film still.

## Reliability and interaction changes

- A controlled 13.5-second lazy-module response reproduced the old 12-second timeout before any renderer draw. Module arrival now has a separate 30-second budget; the mounted source gets its own 12-second first-draw budget. The same delayed response subsequently produced a ready source and actual copied material.
- A full sweep caught a paused renderer while current Scene bounds were visible. Visibility decisions now read current layout rather than trusting potentially stale observer entries. Normal visibility changes also stop bumping the renderer key unnecessarily.
- Reselecting the active material retries its private renderer, including after a context-loss fallback. Originals remain available; controls do not disappear.
- Keyboard asset selection enters the placement control after the floating card is visible. Closing returns focus to the asset. Placement opens upward/downward according to available viewport space. Escape inside hex editing cancels editing before dismissing the brand dialog.
- Forwarded pointer movement now sends pointer-leave when the pointer leaves the asset, preventing a thermal brush from remaining active indefinitely.

## Profiling findings

Local headless Chromium on this host, with emulated viewports, is not a physical phone benchmark. Native shader loops follow this host's approximately 144 Hz refresh while the copy bridge targets 30 Hz. The bridge now retains scheduling remainder instead of accumulating drift.

| Source | Desktop CSS size | Mobile CSS size | Mobile RGBA buffer before → after |
| --- | --- | --- | --- |
| Fields / Thermal, DPR cap 2 | 640 × 800 | 400 × 500 | 7.81 → 3.05 MiB |
| Exposure / Fluid, DPR cap 1.75 | 640 × 800 | 400 × 500 | 5.98 → 2.34 MiB |

Tablet uses 512 × 640. These are estimates for one RGBA source buffer; they exclude native textures, framebuffers, video decoding, driver storage, and presentation canvases. Total GPU memory remains unmeasured.

Two-second image profiles usually observed approximately 29–30 copies/sec after refinement. One emulated-mobile Exposure sample fell to about 15 during concurrent checks; no physical-device performance guarantee is made. Image/video GPU-query runs observed roughly 25–29 copies/sec with instrumentation, sampled Exposure draws averaging 0.52–0.82 ms and Fluid draws 0.06–0.09 ms. These are sampled **draws**, not whole frames: Fluid issued approximately 2,700–3,000 draw calls/sec versus Exposure's approximately 144, so its small per-draw time does not make it cheaper. A broader isolated-device benchmark remains appropriate before expansion.

The shared source remains a reasonable first-slice architecture. Its native refresh-rate render loop and multi-pass Fluid simulation are the important remaining cost, rather than the static material rail. Adding simultaneous live candidates should require native quality/frame-rate controls and more profiling. Sharing a 4:5 source also means roles share native geometry; cropping/masking provides variation, but it cannot replace independently art-directed native settings in a mature Scene.

Ignored captures/reports are under `outputs/brand-lab`, including material review sheets, `switch-investigation.json`, `refinement-profile.json`, and `gpu-video-profile.json`. The initial 24-switch investigation observed 95–460 ms with no errors. First copied frame is not a guarantee of media texture readiness or final animation form.

## Review boundary

Validation passed: production build/TypeScript, scoped ESLint, all five existing application tests, real pixels for all 14 shader selections, and final production interaction/resilience checks including uploaded video, keyboard entry/focus return, viewport-bounded placement controls, stale observer delivery, recovery after forced WebGL context loss, reduced motion, mobile/tablet bounds, and unsupported-WebGL fallback. The controlled delayed-module case passed after the readiness-budget correction. Product source and references remain separate; no handoff reference asset ships.

Review the refined Campaign and its material range before proceeding to portable setup state, editor transfer, or Identity. All subsequent changes remain uncommitted until explicitly requested.
