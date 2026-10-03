Build a single-page landing page using React (Vite), Tailwind CSS v4, and React Three Fiber. The app must be fully responsive, strictly dark-mode (black background, white text), and visually complex with a high-fidelity 3D background.

## Tech Stack
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`). Use CSS variables in `index.css` for custom keyframes.
- **3D Rendering:** `three`, `@react-three/fiber`

## Design Tokens (Tailwind)
- **Backgrounds:** `#000000` (Pure Black)
- **Text:** `#ffffff` (White), `text-neutral-400` (Subtext), `rgba(255, 255, 255, 0.7)` (Muted).
- **Fonts:** "Inter" for all text.
- **CTAs:** Pill shapes (`rounded-full`).

## 1. 3D Background Component (`Wormhole.jsx`)
Create a React Three Fiber `<Canvas>` containing a custom particle system.
- **Particles:** Render 15,000 points spread randomly and uniformly across a massive volume (e.g. `X/Y: -100 to 100`, `Z: -20 to -120`).
- **Shaders:** Use a `shaderMaterial`. 
  - *Vertex Shader:* Add a slow organic drift using `sin(uTime)` and `cos(uTime)` applied to the X and Y positions. Fade points based on depth/distance.
  - *Fragment Shader:* Make the points circular (discarding edges outside `distance(gl_PointCoord, 0.5)`).
- **Colors:** Interpolate randomly between pure white `#ffffff` and a subtle blue `#88ccff`.
- **Interaction:** Wrap the points in a `<group>`. Add a `mousemove` listener to the window. As the mouse moves, apply a smooth, inverted rotation to the group's X and Y axes using `useFrame` and delta time easing (Moving mouse down rotates the scene down, mouse left rotates scene left).

## 2. Global Layout & Overlays (`App.jsx`)
- The main container should be `min-h-screen relative bg-black overflow-hidden`.
- **Grid Lines:** Place fixed, 1px wide vertical lines running down the screen (`bg-white/15 mix-blend-difference`) at the center and edges to create a sci-fi HUD feel.
- **3D Canvas Placement:** Place the 3D Canvas in an absolute container covering the screen (`z-0`). Add two absolute pointer-events-none divs over it with gradient masks to fade the edges: `bg-gradient-to-r from-black/70 via-black/30 to-transparent` and `bg-gradient-to-b from-black/20 via-transparent to-black/60`.

## 3. Navigation (Header)
- Fixed at the top, `z-50`, with a transparent background and slight `backdrop-blur`.
- Contains a Logo (left), 5 Links (center, hidden on mobile), and a "GET STARTED" button (right).
- **Link Hover Effect:** Links are `text-white/50` text. On hover, they become `text-white` and a 1px white underline slides in from width 0 to 100% left-to-right.

## 4. Hero Content
- Centered vertically and horizontally over the background (`z-10`, `flex flex-col items-center`).
- **Headline:** Two lines. Line 1: "The schedule management", Line 2: "system for autonomous agents". The second line must use a text gradient: `bg-gradient-to-b from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent`. Use clamp for responsive sizing.
- **Subtext:** A short, muted paragraph below the headline.
- **CTA Buttons:** A flex row of two buttons:
  1. **Primary ("GET STARTED"):** Black pill button. It must have an infinite CSS animation creating a glowing white beam of light traveling along its border perimeter. On hover, it gets a strong white drop shadow `[0_0_20px_rgba(255,255,255,0.4)]`.
  2. **Secondary ("REQUEST A DEMO"):** Solid white button with black text. On hover, background shifts to `gray-100` and its shadow expands `[0_0_30px_rgba(255,255,255,0.2)]`.

## 5. Logo Marquee
- Placed absolutely at the bottom of the Hero section.
- An infinite CSS scrolling marquee (`translateX(0)` to `translateX(-100%)` over 30s) containing 10 partner logos.
- Apply a CSS mask-image `linear-gradient(to right, transparent, black 25%, black 75%, transparent)` to the parent container so the logos fade in smoothly on the edges rather than clipping abruptly.
- Logos should be greyscale and slightly opaque.
