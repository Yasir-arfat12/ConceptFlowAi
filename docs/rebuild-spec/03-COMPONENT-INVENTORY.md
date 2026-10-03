# Component Inventory

## 1. Layout Components

### `App` (`src/App.jsx`)
- **Purpose:** The root layout shell integrating the Header, Hero, and global decorative grid overlays.
- **Props:** None
- **State/Variants:** N/A

## 2. Navigation Components

### `Header` (`src/Header.jsx`)
- **Purpose:** Fixed top navigation bar.
- **Props:** None
- **Variants:** None (Static structure, responsive hiding of links on mobile).
- **Interactions:** Links feature a hover effect where text brightens (`text-white/50` -> `text-white`) and a bottom border line slides in. CTA button features a subtle blur and glow on hover.
- **Note:** `App.jsx` also contains a duplicate/inline version of the Header (lines 16-64).

## 3. Data Display / Content

### `Hero` (`src/Hero.jsx`)
- **Purpose:** Central textual content for the landing page (headline, subtext, CTA buttons).
- **Props:** None
- **Note:** `App.jsx` actually renders its own inline Hero content block directly rather than importing `Hero.jsx`. Both exist in the codebase.

### `LogoMarquee` (`src/LogoMarquee.jsx`)
- **Purpose:** Infinite scrolling banner of partner/integration logos.
- **Props:** None
- **Visuals:** Uses a CSS animation (`animate-marquee` over 30s) to slide a flex container horizontally.
- **State:** Static infinite loop. Uses a CSS mask `[mask-image:linear-gradient(to_right,transparent,black_25%,black_75%,transparent)]` in its parent (`App.jsx`) to fade edges.

## 4. 3D / Background Components

### `Wormhole` (`src/Wormhole.jsx`)
- **Purpose:** Contains the React Three Fiber `<Canvas>` and sets up the 3D environment (Camera, Fog).
- **Props:** None

### `SceneContainer` (Internal to `Wormhole.jsx`)
- **Purpose:** Manages mouse tracking (`mousemove` event listener) and applies inverted parallax rotation (`rotation.x` and `rotation.y`) to the group containing the particles.
- **Interactions:** Moves inversely to mouse position (moving mouse down rotates the scene down; moving mouse left rotates the scene left). Includes easing using `delta`.

### `DustParticles` (Internal to `Wormhole.jsx`)
- **Purpose:** Generates 15,000 scattered dust particles spread across a massive `200x200x100` volume.
- **Visuals:** 
  - Custom `ShaderMaterial` with vertex and fragment shaders.
  - Particles slowly drift based on a sine/cosine wave driven by `uTime`.
  - Particles fade near the camera (`smoothstep(120.0, 20.0, length(pos.xy))`).
  - Colors are randomized between pure white `#ffffff` and a subtle blue `#88ccff`.

## 5. UI Elements (Inline in `App.jsx`)

### Animated "Star Beam" Button
- **Path:** Inline in `App.jsx` (Lines 101-128)
- **Purpose:** Primary "GET STARTED" CTA.
- **Visuals:** A pill-shaped button with a dark background. It utilizes an absolute-positioned div with a linear gradient and a CSS animation (`animate-star-beam` / `star-btn`) to create a light beam traveling around the button's border. 

### Solid White Button
- **Path:** Inline in `App.jsx` (Lines 131-136)
- **Purpose:** Secondary "REQUEST A DEMO" CTA.
- **Visuals:** Solid white pill button, black text, glowing drop shadow on hover (`shadow-[0_0_15px_rgba(255,255,255,0.2)]`).
