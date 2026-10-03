# Project Overview

## Purpose
A modern, dark-themed landing page designed for an AI agent schedule management system (Qronos). Its core use case is to visually engage users with a 3D particle background (a "wormhole/dust" effect) while presenting the main value proposition and calls-to-action (CTAs).

## Target User
Developers, project managers, and enterprises utilizing autonomous agents and needing a durable, robust orchestration/scheduling tool.

## Main Screens / Routes
- **Single Page Application (SPA):** Currently consists of a single landing page (`/`).
  - Hero Section (Headline, Subtext, CTAs, 3D Background)
  - Logo Marquee (Social proof / integration logos)
- *Note:* Navigation links exist for `#about`, `#features`, `#insights`, `#pricing`, and `#customers`, but they anchor to the same page or are placeholders for future sections.

## App Shell Structure
- **Fixed Topbar (Header):** Transparent, backdrop-blurred navigation bar with logo, links, and a CTA button.
- **Main Content Area (Hero):** Full-viewport height (`min-h-screen`) container housing the 3D canvas background and centered hero text content.
- **Floating Overlays:** A fixed vertical grid lines overlay (`bg-white/15` mix-blend-difference) and corner crosshair accents to add a technical, sci-fi aesthetic.

## Tech Stack
- **Framework:** React 19 (v19.2.8) built with Vite (v8.3.0)
- **Language:** JavaScript (JSX)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite` v4.3.3) utilizing CSS variable theming in `index.css`.
- **UI Libraries:** None (Custom HTML/Tailwind)
- **State Management:** React local state/refs (`useRef`, `useEffect`, `useMemo`)
- **Icons:** Inline SVG paths for minimal overhead; `lucide-react` is in `package.json` but inline SVGs are primarily used in the current components.
- **3D Rendering & Animation:** 
  - `three` (v0.186.1)
  - `@react-three/fiber` (v9.8.1)
  - `@react-three/drei` (v10.7.9)
  - Custom WebGL Shaders (GLSL) for particle rendering.

## Key Third-Party Packages
| Package | Usage |
|---------|-------|
| `three` | Core 3D engine for rendering the scattered dust particle system. |
| `@react-three/fiber` | React wrapper for Three.js, managing the canvas, scene state, and animation loop (`useFrame`). |
| `@react-three/drei` | Useful helpers for R3F, though primarily the base Fiber package is heavily utilized. |
| `tailwindcss` | Utility-first CSS framework for layout, typography, and visual styling. |
