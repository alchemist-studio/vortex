# Vortex Studio

A dependency-free, dark isometric vortex editor built from the two reference sketches in [the brief](https://gist.github.com/eonist/6cc957d88e074faa62c5ceed6d7ffa6e).

## Website

A static website containing the geometry studio, brand guide, purple landing page, and twelve landing-page sketches.

- [Geometry studio](https://alchemist-studio.github.io/vortex-studio/)
- [Brand guide](https://alchemist-studio.github.io/vortex-studio/brand/)
- [Minimal landing page](https://alchemist-studio.github.io/vortex-studio/landing/)
- [Landing sketches](https://alchemist-studio.github.io/vortex-studio/sketches/)

## GitHub Pages

The workflow in `.github/workflows/pages.yml` verifies the geometry and deploys only `dist/` whenever `main` changes. In **Settings → Pages**, the publishing source is **GitHub Actions**. No build dependencies, API keys, or external services are required.

All website links and assets use relative paths, so the same files work at an organization domain, a repository subpath, or on a local static server. Fonts and images are included in the repository. Hosting configuration from the original provider is intentionally excluded.

## Asset attribution

The supplied Vortex logos and visual references originate in the linked Gist. Their inclusion does not grant additional rights. Font licenses are included alongside the self-hosted fonts in `dist/assets/brand/`. No blanket license is asserted over the original brand artwork.

## Run

Serve `dist/` with any static web server. For example: `python3 -m http.server 4173 --directory dist`.

## Geometry

Choose 2–16 arms, with quick choices for 4, 5, 6, and 8. Every arm is a rotated copy of the same curve, spaced by `360 / armCount` degrees in the unprojected plane. All tips share radius 298, forming one ellipse after projection.

The earlier version incorrectly used the sketch’s inner diamond to shorten alternate arms to roughly 71% radius. Their tips therefore landed partway along neighboring curves. The corrected construction preserves the four cardinal curves, extends the intermediate arms to the same outer radius, and removes the diamond endpoint option. Equal radial functions and constant angular separation prevent centerline intersections away from the shared center; very thick ribbons can still overlap. This correction works in both curve modes and does not depend on the golden ratio.

For radius parameter `t` from 0 to 1, a swept arm has `r = R*t` and `theta = a - (curvature/90)*acos(t) + endpoint*t*t` (angles converted to radians as appropriate). At 90 degrees and zero endpoint rotation this is exactly a semicircle joining the center and endpoint. Curvature deforms that arc continuously. Endpoint rotation independently twists the outer portion, preserving the shared central join.

Outer width supports 0–200 px. Six taper profiles blend the chosen endpoint widths using `w(u) = innerWidth + (outerWidth-innerWidth)*f(u)`. Except for the retained original profile, `u` is normalized arc length in the unprojected plane, estimated from chord lengths; it is not radial distance or the SVG point index.

| Profile | Function | Behavior |
| --- | --- | --- |
| Linear | `u` | Even width change along the curve. |
| Smoothstep | `3u² − 2u³` | Zero first derivative at both endpoints. |
| Smootherstep | `6u⁵ − 15u⁴ + 10u³` | Zero first and second derivatives at both endpoints. |
| Late flare | `u²` | Holds the inner width longer; widens toward the tip. Default for a lighter vortex core. |
| Early flare | `1 − (1−u)²` | Changes width early, then eases toward the outer width. |
| Linear (original) | `r/R` | Preserves the previous radius-based taper. |

All profiles are monotonic and preserve the exact endpoint widths, including zero, equal, and reversed widths. Their relative suitability is a design choice; no taper is uniquely dictated by the golden spiral. Late flare is a useful starting point when broad outer arms should retain a slender center. Smoothstep-style profiles are useful when soft transitions into the endpoint widths matter.

The preview shows the selected width profile laid out along the arm's length. The ribbon boundaries are constructed using local tangent normals in the original plane, then projected using `(x, y/sqrt(3))`. This produces the 30-degree isometric appearance. Normal, round, and radial outer cuts are supported. Fill colors the ribbon interior; stroke outlines its boundaries. Both have independent 0–100% opacity.

Golden mode uses `theta = a + ln(t) / (2*ln(phi)/pi)` with `phi=(1+sqrt(5))/2`, plus a rigid phase rotation. Its radius grows by phi per quarter-turn. Near the center it is sampled to a finite join. The gold guide follows arm 1’s centerline exactly in golden mode, using the construct’s current endpoint rotation, projection, reference scale and zoom. Its markers lie on the curve at phi-scaled radii, one quarter-turn apart. In circular-sweep mode it remains a true golden comparison aligned to arm 1’s outer tip; it does not falsely label circular curves as golden. The guide and labels render above the artwork. There is no claim that the hand-drawn sketch is a Fibonacci construction. See [Wolfram MathWorld](https://mathworld.wolfram.com/GoldenSpiral.html).

## Taper research

- [Blender Map Range documentation](https://docs.blender.org/manual/en/5.0/render/shader_nodes/utilities/math/map_range.html) describes linear, smooth Hermite, and smoother Hermite interpolation options.
- [Physically Based Rendering: Mathematical Infrastructure](https://pbr-book.org/4ed/Utilities/Mathematical_Infrastructure) defines the cubic smoothstep and explains its smooth transition at the ends.
- [W3C SVG working-group variable-width proposal](https://www.w3.org/Graphics/SVG/WG/wiki/Proposals/Variable_width_stroke) distinguishes distance along a path from curve parameter values and discusses smooth width interpolation. This is a design reference, not an implemented browser feature: exported widths remain ordinary closed SVG paths.

## Reference alignment

Both original PNGs are bundled unchanged. The wide reference origin is `(503,334)` with radius 298; the small reference origin is `(512,352)` with radius 130. Grid direction is exactly ±30 degrees, with basis step 43.4 pixels horizontally and `43.4/sqrt(3)` vertically. Grid phase was measured from the light pixels in the sketches; per-image translations align the regular grid to the drawn lattice. The image and all drawing layers share one zoom transform. Reference selection also selects its construct scale, and SVG export preserves that scale.

The source is a rough hand drawing: individual grid lines and curves are uneven. The app reconstructs a regular mathematical interpretation, rather than claiming pixel-identical tracing of every pencil stroke.

## Export

SVG export contains exactly the selected number of closed vector ribbon paths with the selected fill, stroke, opacity, and end cuts, on a transparent background. Construction guides, the grid, and raster reference images are excluded. The viewBox includes cap and outline padding. No network service is needed to generate the export.

## Verification

`node tests/geometry.mjs` verifies equal-radius endpoints, preserved main circular curves, constant arm spacing and nonintersecting centerlines for both models, the golden-ratio growth law, curve/end-cut extremes, rejection of invalid arm counts, grid intersections, and export path counts/scaling. Browser checks covered numeric edits, keyboard slider operation, toggles, reference selection, golden mode, export, no console errors, and a 390px viewport without horizontal overflow. The three optional WebMCP tools were checked with valid and invalid inputs and SVG read-back.

`node tests/taper.mjs` verifies profile monotonicity, endpoint widths (including zero and reverse taper), analytic semicircle length, sampling convergence, 200px boundary geometry, and export bounds for all six profiles and all three cap treatments in both curve modes.

## Brand guide

The new `/brand/` route presents four interactive brand directions, both supplied SVG variants, the variation-1 golden spiral construction, clear-space and size recommendations, color palettes with computed contrast ratios, type studies, phi-grid composition and twelve application specimens. The original editor remains at `/`.

Both Gist SVG assets are preserved byte-for-byte in `dist/assets/brand/*-original.svg`. Solid brand treatments only change fill/color opacity; path geometry is unchanged. Fonts are self-hosted with their SIL licenses. The brand kit includes sources and explicitly labels usage limits as design proposals.

## Minimal landing page

The `/landing/` route is a single-screen Ultraviolet composition using the original first logo, the self-hosted Space Grotesk and Inter fonts, and phi-grid lines at 38.2% / 61.8%. On desktop the headline block begins at the 38.2% horizontal guide and ends at the 38.2% vertical guide; the symbol center sits at the 61.8% intersection. Phone layouts reflow the same elements within the viewport. A grid toggle reveals the clean composition, and the footer links to the brand guide.

## Landing sketches

The `/sketches/` route presents twelve distinct one-screen landing compositions in the purple brand family: centered, golden split, oversized typography, search-first, poster, light card, side rail, product canvas, wordmark horizon, orbital, editorial and pure identity. Each miniature opens in a native dialog for larger comparison. Previous/next controls and arrow keys cycle through the studies; Escape closes the viewer. A shared toggle shows phi-grid overlays. The preview actions are illustrative design content, while gallery navigation and viewer controls are functional. Original SVG paths are reused unchanged.

Sketch 09 uses the requested Instrument Sans (400 and 600) + JetBrains Mono (400) pairing. Fonts are self-hosted and scoped to Wordmark horizon; both SIL Open Font Licenses are included alongside the assets.
