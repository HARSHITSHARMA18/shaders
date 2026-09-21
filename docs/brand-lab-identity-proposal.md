# Identity Scene proposal — review only

Campaign remains the only implemented Scene. This proposal follows the handoff's identity guidance and the existing shader capabilities; it does not authorize or implement expansion.

## Composition

A quiet identity specimen rather than another campaign poster board: one large logo/initial mask, one square mark tile, one restrained material sample, and an untreated typographic lockup. Contrast generous paper space with a small number of expressive applications. Keep copy short; use the existing brand name, uploaded logo, and two colors.

## Shader roles and capability limits

Generated Fields and Thermal can supply identity material inside the uploaded logo or initial mask and as a contained sample. Lens, Exposure, Fluid, Blackhole and Specimen should retain recognizable media in their sample; they cannot promise generated logo behavior. Particle Assembly should show its actual brand-word assembly rather than force an illegible single-letter crop. Etch should keep its image-only treatment, with a clear video fallback.

The current one-source bridge shares native geometry and settings across roles. A logo mask is a CSS composition of actual shader pixels, not native vector-path deformation. Do not imply independent role-specific simulations or guaranteed seamless materials. Establish the composition with representative generated, optical, and particle shaders before extending its full catalog coverage.

## Small implementation plan after review

Reuse BrandLab shell, shader rail, brand dialog/PaletteEditor, curated tuning drawer, adapters and preview lifecycle. Add an explicit IdentityScene component and a restrained Campaign/Identity switcher. Extend Surface definitions and setup validation only for these two Scenes; maintain existing Campaign link compatibility. Avoid a universal layout engine, simultaneous candidate renderers, Compare, or export infrastructure.

Review Campaign and this direction before implementation. All current work remains uncommitted on feat/brand-lab.
