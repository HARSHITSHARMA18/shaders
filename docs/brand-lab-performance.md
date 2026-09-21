# Campaign performance follow-up — 2026-09-18

On feat/brand-lab, uncommitted. Campaign remains the only implemented Scene.

## Change

ShaderMaterial previously copied its one native WebGL source into all four 2D presentation canvases at 30 Hz regardless of viewport position. It now seeds every role on material/settings changes, then skips live copies for roles outside the viewport. Each role retains its last frame and resumes copying as it enters view. Reduced motion still captures all roles before releasing the source. No native shader loops, registry files, dependencies or export infrastructure changed.

## Measurements and limits

Isolated production headless Chrome, desktop 1745 × 828 DPR1 and emulated mobile 390 × 844 DPR2. Viscous, Exposure and Fluid were sampled with both an image and a local video fixture; the reference video is a test input only and is not shipped. Baseline samples copied each of four roles about 60 times over two seconds. In desktop samples where accent and wordmark were outside the viewport, the new bridge copied only poster and study about 60 times each: roughly 50% fewer presentation copies. When all roles were visible it continued copying all four. Visible copies remained roughly 30 Hz in valid samples.

Measured drawImage JavaScript durations are noisy and do not establish a CPU or GPU speedup. The native source still runs at its own refresh rate; Fluid's multi-pass cost is unchanged. One post-change Exposure/video sample lasted 187 seconds rather than two seconds, consistent with a host/browser pause; exclude it from timing/rate conclusions. First-frame timing includes UI scrolling/lazy startup and is not media-texture readiness. Neither faster switching nor a physical-phone performance improvement is claimed.

The optional scripts/brand-lab-performance-check.mjs records copy counts, actual viewport bounds, readiness and one-source behavior, checks offscreen copies after optimization, and verifies that scrolling to the wordmark resumes frames. Raw before/after reports remain ignored in outputs/brand-lab. Real-device responsiveness, thermal behavior and total GPU memory remain unmeasured.

## Next review

Review the Campaign and its tuning controls first. The adjacent brand-lab-identity-proposal.md describes a distinct quiet identity specimen using real shader capabilities and existing components. Identity is not implemented; Compare and exports remain deferred. No commits, staging, pushes or merges were performed.
