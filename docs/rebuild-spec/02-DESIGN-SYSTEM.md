# Design System

## Color Palette
The app uses a strict dark theme. Colors are defined via Tailwind v4 `@theme` block in `index.css` and hardcoded utility classes.

| Token / Purpose | Value / Class | Description |
|----------------|---------------|-------------|
| **Background (Base)** | `#000000` / `bg-black` | Pure black used for the body, main containers, and 3D canvas background. |
| **Foreground (Text)** | `#ffffff` / `text-white` | Pure white for primary headings and active nav links. |
| **Muted Text** | `rgba(255, 255, 255, 0.7)` | Used as a CSS variable for secondary text, though Tailwind arbitrary values are common. |
| **Subtext** | `text-neutral-400` / `text-white/90` | Light grey for paragraph text (e.g. Hero subtext). |
| **Borders** | `border-white/20`, `border-white/30`, `border-slate-200/50` | Subtle, semi-transparent white borders for buttons and navigational elements. |
| **Gradients (Text)** | `from-white via-zinc-300 to-zinc-500` | Used on the second half of the main heading to give a metallic, fading effect. |
| **Gradients (Overlays)** | `from-black/70 via-black/30 to-transparent` (X-axis)<br>`from-black/20 via-transparent to-black/60` (Y-axis) | Edge darkening overlays over the 3D canvas. |

## Typography
- **Primary Font:** Inter (`'Inter', ui-sans-serif, system-ui, sans-serif`)
- **Display Font:** Inter (Same as primary)
- **Font Sizes:**
  - `text-xs`: Navigation links, small button text.
  - `text-sm`: Main CTA buttons.
  - `text-lg` / `text-xl`: Hero subtext.
  - Heading Clamp: `text-[clamp(2rem,9vw,2.5rem)]` on mobile scaling up to `sm:text-[clamp(2rem,4.6vw,4.5rem)]` on desktop.
- **Font Weights:** `font-medium` (nav), `font-semibold` (buttons), `font-bold` (brand/headings).
- **Tracking / Letter Spacing:** `tracking-widest` (logo text), `tracking-wider` (buttons), `tracking-tight` (main headline).
- **Line Height:** `leading-[1.0]` / `leading-[1.05]` for main headlines, `leading-[1.8]` / `leading-relaxed` for paragraphs.

## Spacing & Sizing Scale
Uses standard Tailwind spacing multipliers based on `0.25rem` (4px).
- **Paddings:** `py-28`, `py-32`, `py-40` for massive vertical sections. `px-4`, `px-8`, `px-14` for horizontal constraints.
- **Containers:** Max widths of `max-w-[1400px]`, `max-w-[1344px]`, `max-w-[1100px]`.
- **Gaps:** `gap-4`, `gap-6` (buttons), `gap-10` (nav links), `gap-[42px]` (marquee logos).

## Border Radius
- **Buttons:** `rounded-full` (pill shape).

## Shadows
- **Glowing Elements:**
  - `hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]` (Header CTA)
  - `hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]` (Hero Primary CTA)
  - `shadow-[0_0_15px_rgba(255,255,255,0.2)]` scaling to `30px` on hover (Hero Secondary CTA).

## Breakpoints
- `sm:` (min-width: 640px)
- `md:` (min-width: 768px)
- `lg:` (min-width: 1024px)

## Dark Mode
The app is natively and exclusively dark mode. There is no light mode implementation. Backgrounds are strictly `#000000` and text is inherently white/grey.
