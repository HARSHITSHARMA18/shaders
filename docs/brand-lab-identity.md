# Identity Scene — 2026-09-18

Implemented on feat/brand-lab; unstaged and uncommitted for review.

## Art direction

Identity is an explicit specimen composition: a large shader-filled signature on paper, a smaller reverse mark tile on dark ink, a restrained palette, untreated brand typography, and a media/material specimen. It uses generous space and contrasting scale rather than repeating Campaign's poster spread. Mobile stacks the composition with an offset tile. All material is actual native shader output; there are no substitute gradients or copied reference assets.

Generated shaders occupy the logo/initial mask and a contained material field beside original photography. Optical/media shaders process real media. Particle Assembly displays its native brand-word animation in the signature, with Background as its only signature placement; it does not claim vector-logo morphing. Etch retains its image-only behavior and generated fallback for video. Brand colors, supplied logo, tuning and Original work across both Scenes. The typographic lockup remains untreated.

## Integration and reuse

Added IdentityScene.tsx and explicit identity Surface definitions/defaults in model.ts/setup.ts. BrandLab's restrained Campaign/Identity switcher clears the selected asset while preserving per-Scene treatment state and shared brand, shader and tuning. The existing SurfaceControls and PlacementPicker handle selected Identity assets; the tuning drawer uses the existing DialKit sliders and PaletteEditor. No universal layout engine was introduced.

Identity setup links use the existing version-2 format with an identity Scene and its validated surfaces. Existing Campaign version-1/version-2 links remain supported. Native editor transfer returns to the originating Scene. ShaderMaterial refreshes its visibility observer and copy loop when the Scene changes, including reduced-motion recapture. One native WebGL source is retained across live Scene switching; uploaded files remain local and excluded from portable links.

Modified BrandLab.tsx, model.ts, setup.ts, ShaderMaterial.tsx, SurfaceControls.tsx, ShaderControlsDrawer.tsx, brand-lab.css, page.tsx and BrandLabTransfer.tsx. Added the explicit IdentityScene and optional browser QA script. No canonical shader sources, registry files, installation assets, dependencies, Compare or exports changed.

## Validation and limits

Production build/TypeScript, scoped lint and five repository tests pass. Identity browser QA covers actual non-flat shader pixels for all fourteen shaders, stable signature width, one native source, keyboard/contextual treatment editing, treatment retention through Scene switching, tuned setup restoration, native editor round-trip, brand-name/logo replacement, mobile bounds and reduced-motion recapture. Desktop/mobile screenshots were visually inspected. Reports and screenshots are ignored under outputs/brand-lab.

Shader roles share the current native geometry/settings and differ through crop, size, mask and composition; this is not independent simulation per Surface. Masks are CSS composition of raster shader pixels, not deforming vector paths. Identity uses the first character if no logo is supplied. Uploaded media must be replaced when a setup link is reopened. Editor edits do not flow back into Brand Lab. Real-device performance and total GPU memory remain unmeasured.

Stop for composition review before implementing another Scene, Compare or export infrastructure.
