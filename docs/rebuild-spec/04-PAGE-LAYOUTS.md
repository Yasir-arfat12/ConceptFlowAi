# Page Layouts

## Home Page (`/`)

**File Entry:** `src/App.jsx`

### Structural Breakdown (Z-Index Stacked)

1. **Background Layer (Z: 0)**
   - Absolute positioned div containing the `Wormhole` 3D Canvas.
   - Takes up full width and height of the `min-h-screen` section.
   - Overlayed with two gradient masks to fade the edges into black:
     - Horizontal: `bg-gradient-to-r from-black/70 via-black/30 to-transparent`
     - Vertical: `bg-gradient-to-b from-black/20 via-transparent to-black/60`

2. **Decorative Layer (Z: 51 & 20)**
   - Fixed vertical grid lines (`bg-white/15 mix-blend-difference`) spanning the height of the screen.
   - Crosshair accents positioned absolutely in the corners of the Navigation bar.

3. **Navigation Layer (Z: 50)**
   - Sticky Header fixed to the top (`fixed top-3`).
   - Flexbox container (`justify-between`) with Logo (left), Links (center), and CTA (right).
   - Constrained to `max-w-[1344px]`.

4. **Foreground Content Layer (Z: 10)**
   - Hero text container vertically centered using Flexbox (`flex flex-col justify-center`).
   - Max width constraint `max-w-[1400px]`.
   - **Order:**
     1. Headline (`<h1>`): Large responsive text clamping. Split into two lines, second line is gradient-clipped.
     2. Subtext (`<p>`): Muted grey paragraph.
     3. CTA Group: Flex container holding the Primary (Animated Border) and Secondary (Solid White) buttons.

5. **Footer / Bottom Layer (Z: 10)**
   - `LogoMarquee` component positioned absolutely at the bottom (`absolute bottom-12`).
   - Constrained width and centered, with a left/right gradient mask applied to fade the logos in and out as they scroll.

### Page-Specific Interactions
- **Parallax Background:** As the mouse moves across the viewport, an event listener in `SceneContainer` calculates the normalized position `[-1, 1]` and applies a smooth, inverted rotation to the 3D particle group.
- **Responsive Navigation:** The center navigation links and right-side CTA button hide on mobile viewports (`hidden md:flex`), revealing a mobile hamburger menu icon.
