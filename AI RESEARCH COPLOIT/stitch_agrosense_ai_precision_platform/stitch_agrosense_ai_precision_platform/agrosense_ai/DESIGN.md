---
name: AgroSense AI
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#42493e'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#72796e'
  outline-variant: '#c2c9bb'
  surface-tint: '#3b6934'
  primary: '#154212'
  on-primary: '#ffffff'
  primary-container: '#2d5a27'
  on-primary-container: '#9dd090'
  inverse-primary: '#a1d494'
  secondary: '#6f5a53'
  on-secondary: '#ffffff'
  secondary-container: '#fadcd3'
  on-secondary-container: '#765f59'
  tertiary: '#5e2b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#803e00'
  on-tertiary-container: '#ffb17d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bcf0ae'
  primary-fixed-dim: '#a1d494'
  on-primary-fixed: '#002201'
  on-primary-fixed-variant: '#23501e'
  secondary-fixed: '#fadcd3'
  secondary-fixed-dim: '#ddc0b8'
  on-secondary-fixed: '#271813'
  on-secondary-fixed-variant: '#56423c'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311300'
  on-tertiary-fixed-variant: '#723600'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  data-numeral:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system is rooted in the intersection of traditional agriculture and cutting-edge artificial intelligence. The aesthetic is **Corporate Modern** with a lean towards **Tactile Data Visualization**. It prioritizes high legibility and functional clarity to ensure usability in varied field conditions—from direct sunlight on a tablet to low-light office environments. 

The visual language communicates reliability and precision. It avoids unnecessary decorative elements, opting instead for a systematic approach where every visual cue serves a data-driven purpose. The mood is professional and authoritative, yet approachable for the modern farm operator.

## Colors
This design system utilizes a palette derived from natural agricultural elements but refined for digital precision.
- **Primary (Deep Agricultural Green):** Used for primary actions, branding, and representing "healthy" or "optimal" data states.
- **Secondary (Earthy Brown):** Reserved for grounded structural elements, navigation headers, or secondary text to provide a sophisticated contrast to the green.
- **Tertiary (Alert Orange):** A high-visibility accent color used exclusively for notifications, warnings, and highlighting critical data points that require immediate attention.
- **Neutral (Light Grey/White):** The foundation of the UI, ensuring a clean, breathable space that allows data visualizations to stand out without visual noise.

## Typography
Inter is selected for its exceptional legibility and systematic weight distribution. 
- **Headlines:** Use Semi-Bold (600) to Bold (700) weights to create a strong information hierarchy.
- **Body Text:** Standardized at 16px for desktop and mobile to ensure readability in outdoor environments.
- **Data Numerals:** Specific styling for metrics and sensor readings, utilizing a slightly heavier weight and tighter letter spacing to emphasize quantitative values.
- **Labels:** Uppercase styles are reserved for small category labels to provide distinction from body copy.

## Layout & Spacing
The layout follows a **Fluid Grid** system based on an 8px spacing rhythm. 
- **Desktop:** 12-column grid with 24px gutters. Content is housed in structured containers to prevent excessive line lengths.
- **Mobile:** 4-column grid with 16px margins. Touch targets are strictly maintained at a minimum of 44x44px.
- **Data Spacing:** Information-dense dashboards use the 8px 'md' unit for related data groups and the 24px 'lg' unit to separate distinct modules or cards.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Low-Contrast Outlines**. 
- Surfaces use a subtle border (`1px solid #E0E0E0`) instead of heavy shadows to maintain a clean, "rugged-digital" look.
- **Cards:** Use a white background with a very soft, diffused shadow (Y: 2px, Blur: 4px, 5% opacity) to lift them slightly from the light grey background.
- **Active States:** Elements being interacted with use a 2px Primary Green border to signify focus without relying solely on color shifts.
- **Overlays:** Modals and dropdowns use a medium elevation shadow to ensure clear separation from the primary data layer.

## Shapes
This design system employs **Soft (0.25rem)** roundedness to strike a balance between industrial hardware aesthetics and modern software friendliness. 
- **Buttons and Inputs:** Use the base `rounded` (4px) setting for a crisp, professional appearance.
- **Cards:** Use `rounded-lg` (8px) to frame large blocks of data.
- **Status Indicators:** Chips and badges use `rounded-xl` (12px) to create a "pill" shape that distinguishes them from actionable buttons.

## Components
- **Buttons:** Rugged and substantial. Primary buttons use the Primary Green background with white text. They feature a subtle 1px inner top border (lighter green) to give a slight 3D "tactile" feel without being skeuomorphic.
- **Data Cards:** High-contrast containers. Headers should have a subtle background tint (#F1F3F1) to separate the title from the data content.
- **Gauges:** Circular or semi-circular "realistic" gauges for soil moisture, temperature, and pH. Use the Primary Green for healthy ranges and Alert Orange for critical thresholds.
- **Input Fields:** Heavy 2px borders when focused. Labels are always persistent (not floating) to ensure the user never loses context in the field.
- **Chips:** Small, low-saturation backgrounds with high-saturation text for status indicators (e.g., "Active", "Irrigating", "Offline").
- **Lists:** Clean rows with 1px dividers. Use "Chevron-right" icons for navigable items to provide clear affordance.
- **Data Visualization:** Use a custom palette for charts that prioritizes the Primary Green and its shades, using Secondary Brown for baseline or historical data.