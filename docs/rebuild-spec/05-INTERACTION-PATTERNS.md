# Interaction Patterns

## 1. 3D Background Parallax
- **Behavior:** The entire 3D dust particle scene rotates slightly on the X and Y axes in response to mouse movement.
- **Direction:** Inverted (Natural). Moving the mouse down rotates the scene down; moving the mouse left rotates the scene left.
- **Easing:** Mouse coordinates are normalized to `-1` to `1`. The target rotation is calculated as `coord * 0.15`. The actual rotation smoothly approaches the target using a delta-time multiplier (`(target - current) * delta * 3`).

## 2. Navigation Links
- **Hover Effect:** The text brightens from a muted state (`text-white/50`) to full white (`text-white`) with a `duration-300` transition.
- **Underline Reveal:** An absolute-positioned white 1px high `<span>` sits at the bottom of the link with `w-0`. On parent hover (`group-hover`), it expands to `w-full`, creating a smooth left-to-right underline slide-in.

## 3. Button Micro-interactions
- **Primary CTA ("GET STARTED"):**
  - **Static Animation:** An infinite `star-btn` / `animate-star-beam` animation moves a linear gradient along a defined offset path (or transform) to simulate a "shooting star" or glowing light traveling around the border of the pill shape.
  - **Hover:** Triggers an intense white drop shadow (`hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]`).
- **Secondary CTA ("REQUEST A DEMO"):**
  - **Static:** Standard solid white button with a soft shadow (`shadow-[0_0_15px_rgba(255,255,255,0.2)]`).
  - **Hover:** Background shifts slightly to `hover:bg-gray-100` and the shadow intensifies/expands (`hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]`).

## 4. Marquee Animation
- **Behavior:** The `LogoMarquee` utilizes two duplicated flex containers side-by-side.
- **Animation:** The `animate-marquee` keyframe translates the container from `translateX(0)` to `translateX(-100%)` continuously over 30 seconds (`30s linear infinite`).
- **Edge Fading:** The parent container uses a CSS `mask-image: linear-gradient` to create a smooth fade-in/fade-out on the far left and right edges, preventing a harsh pop-in of the logos.

## 5. Particle Shader Animations
- **Drift:** Inside the GLSL vertex shader for the particles, vertex positions `y` and `x` are continuously modified using `sin` and `cos` functions tied to a `uTime` uniform.
- **Result:** This creates a slow, organic, undulating drift effect across the entire particle field rather than static points.
