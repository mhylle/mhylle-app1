# CSS Variables Reference Guide
## Responsive Design System for Cosmic Candy Factory

### Overview
This document provides a complete reference for the CSS custom properties (variables) system used in the responsive layout refactoring. All values use fluid, responsive units to ensure proper scaling across device sizes.

---

## Core Design Tokens

### Spacing System
Based on a fluid spacing scale that adapts to viewport size.

```scss
/* Base Spacing Scale */
--spacing-xs: clamp(0.25rem, 0.5vw, 0.5rem);    // 4px → 8px
--spacing-sm: clamp(0.5rem, 1vw, 0.75rem);      // 8px → 12px
--spacing-md: clamp(0.75rem, 1.5vw, 1rem);      // 12px → 16px
--spacing-lg: clamp(1rem, 2vw, 1.5rem);         // 16px → 24px
--spacing-xl: clamp(1.5rem, 3vw, 2rem);         // 24px → 32px
--spacing-2xl: clamp(2rem, 4vw, 3rem);          // 32px → 48px
```

#### Usage Guidelines:
- **xs**: Icon padding, small gaps
- **sm**: Component internal spacing
- **md**: Default spacing between elements
- **lg**: Section spacing
- **xl**: Major section breaks
- **2xl**: Page-level spacing

### Typography Scale
Fluid typography that scales with viewport width.

```scss
/* Typography Scale */
--text-xs: clamp(0.625rem, 1.2vw, 0.75rem);     // 10px → 12px
--text-sm: clamp(0.75rem, 1.5vw, 0.875rem);     // 12px → 14px
--text-base: clamp(0.875rem, 2vw, 1rem);        // 14px → 16px
--text-lg: clamp(1rem, 2.5vw, 1.25rem);         // 16px → 20px
--text-xl: clamp(1.25rem, 3vw, 1.5rem);         // 20px → 24px
--text-2xl: clamp(1.5rem, 4vw, 2rem);           // 24px → 32px
--text-3xl: clamp(2rem, 5vw, 3rem);             // 32px → 48px
```

#### Font Weight Variables:
```scss
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

#### Line Height Variables:
```scss
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

---

## Component-Specific Variables

### Header Component
```scss
/* Header Heights by Breakpoint */
--header-height-mobile: clamp(60px, 10vh, 80px);
--header-height-tablet: clamp(80px, 12vh, 100px);
--header-height-desktop: 100px;

/* Logo Sizing */
--logo-height-mobile: clamp(40px, 8vh, 50px);
--logo-height-tablet: clamp(50px, 8vh, 60px);
--logo-height-desktop: 70px;

/* Header Padding */
--header-padding-mobile: var(--spacing-sm) var(--spacing-md);
--header-padding-desktop: var(--spacing-md) var(--spacing-lg);
```

### Lemon Clicker Component
```scss
/* Lemon Button Sizing */
--lemon-size-mobile: clamp(100px, 25vmin, 150px);
--lemon-size-tablet: clamp(150px, 30vmin, 200px);
--lemon-size-desktop: clamp(200px, 25vmin, 250px);

/* Click Feedback */
--lemon-scale-active: 0.95;
--lemon-transition-duration: 100ms;
```

### pH Balance System
```scss
/* pH Meter Dimensions */
--ph-meter-height-mobile: 60px;
--ph-meter-height-tablet: 80px;
--ph-meter-height-desktop: 100px;

/* pH Controls */
--ph-button-min-size: 44px; /* Touch target minimum */
--ph-button-padding: var(--spacing-sm) var(--spacing-md);
```

### Upgrades Panel
```scss
/* Panel Widths */
--upgrades-width-mobile: 100%;
--upgrades-width-tablet: clamp(300px, 40vw, 400px);
--upgrades-width-desktop: clamp(350px, 35vw, 450px);

/* Panel Heights (Mobile Bottom Sheet) */
--upgrades-height-mobile-min: 150px;
--upgrades-height-mobile-max: 40vh;

/* Upgrade Card Sizing */
--upgrade-card-padding: var(--spacing-md);
--upgrade-card-gap: var(--spacing-sm);
```

---

## Breakpoint System

### Standard Breakpoints
```scss
/* Breakpoint Variables */
--breakpoint-xs: 320px;   // Small phones
--breakpoint-sm: 480px;   // Large phones
--breakpoint-md: 768px;   // Tablets
--breakpoint-lg: 1024px;  // Desktop
--breakpoint-xl: 1280px;  // Large desktop
--breakpoint-2xl: 1536px; // Extra large screens
```

### Media Query Mixins
```scss
/* Mobile First Approach */
@mixin mobile-only {
  @media (max-width: 767px) { @content; }
}

@mixin tablet-up {
  @media (min-width: 768px) { @content; }
}

@mixin desktop-up {
  @media (min-width: 1024px) { @content; }
}

@mixin large-desktop-up {
  @media (min-width: 1280px) { @content; }
}

/* Orientation Queries */
@mixin landscape {
  @media (orientation: landscape) { @content; }
}

@mixin portrait {
  @media (orientation: portrait) { @content; }
}
```

---

## Interactive Elements

### Touch Targets
Following accessibility guidelines for minimum touch target sizes.

```scss
/* Touch Target Sizes */
--touch-target-min: 44px;        // iOS minimum
--touch-target-comfortable: 48px; // Material Design
--touch-target-large: 56px;      // Enhanced accessibility

/* Button Heights */
--button-height-mobile: clamp(44px, 10vw, 56px);
--button-height-tablet: 48px;
--button-height-desktop: 44px;

/* Interactive Element Padding */
--button-padding-x: var(--spacing-md);
--button-padding-y: var(--spacing-sm);
```

### Focus States
```scss
/* Focus Indicators */
--focus-ring-width: 2px;
--focus-ring-offset: 2px;
--focus-ring-color: var(--sour-accent, #FFD700);
```

---

## Layout Grid System

### Container Widths
```scss
/* Max Container Widths */
--container-xs: 100%;
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;

/* Content Padding */
--container-padding-mobile: var(--spacing-md);
--container-padding-tablet: var(--spacing-lg);
--container-padding-desktop: var(--spacing-xl);
```

### Grid Gaps
```scss
/* Grid and Flex Gaps */
--gap-xs: var(--spacing-xs);
--gap-sm: var(--spacing-sm);
--gap-md: var(--spacing-md);
--gap-lg: var(--spacing-lg);
--gap-xl: var(--spacing-xl);
```

---

## Animation & Transition

### Duration Variables
```scss
/* Transition Durations */
--duration-instant: 0ms;
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
--duration-slower: 1000ms;

/* Animation Timing Functions */
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Reduced Motion Support
```scss
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast: 0ms;
    --duration-normal: 0ms;
    --duration-slow: 0ms;
    --duration-slower: 0ms;
  }
}
```

---

## Z-Index Layers

### Layer System
```scss
/* Z-Index Scale */
--z-negative: -1;
--z-0: 0;
--z-10: 10;      // Background elements
--z-20: 20;      // Base content
--z-30: 30;      // Floating elements
--z-40: 40;      // Dropdowns
--z-50: 50;      // Modals
--z-60: 60;      // Notifications
--z-70: 70;      // Tooltips
--z-max: 9999;   // Critical overlays
```

---

## Safe Area Support

### iOS Safe Area Variables
```scss
/* Safe Area Insets (for notched devices) */
--safe-area-top: env(safe-area-inset-top);
--safe-area-right: env(safe-area-inset-right);
--safe-area-bottom: env(safe-area-inset-bottom);
--safe-area-left: env(safe-area-inset-left);

/* Usage Example */
.header {
  padding-top: max(var(--spacing-md), var(--safe-area-top));
  padding-left: max(var(--spacing-md), var(--safe-area-left));
  padding-right: max(var(--spacing-md), var(--safe-area-right));
}
```

---

## Dynamic Viewport Units

### Modern Viewport Units
```scss
/* Dynamic Viewport Height (accounts for mobile browser chrome) */
.full-height {
  height: 100vh;  /* Fallback */
  height: 100dvh; /* Dynamic viewport height */
}

/* Small/Large/Dynamic Viewport Units */
--vh-small: 100svh;   /* Smallest possible viewport */
--vh-large: 100lvh;   /* Largest possible viewport */
--vh-dynamic: 100dvh; /* Current viewport */
```

---

## Usage Examples

### Example 1: Responsive Component
```scss
.component {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  font-size: var(--text-base);
  
  @media (min-width: 768px) {
    padding: var(--spacing-lg);
    font-size: var(--text-lg);
  }
}
```

### Example 2: Touch-Friendly Button
```scss
.button {
  min-height: var(--touch-target-min);
  padding: var(--button-padding-y) var(--button-padding-x);
  font-size: var(--text-base);
  transition: transform var(--duration-fast) var(--ease-out);
  
  &:active {
    transform: scale(0.98);
  }
}
```

### Example 3: Responsive Grid Layout
```scss
.grid-container {
  display: grid;
  gap: var(--gap-md);
  padding: var(--container-padding-mobile);
  
  @media (min-width: 768px) {
    grid-template-columns: 1fr var(--upgrades-width-tablet);
    padding: var(--container-padding-tablet);
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: 1fr var(--upgrades-width-desktop);
    padding: var(--container-padding-desktop);
  }
}
```

---

## Migration Guide

### Step 1: Replace Fixed Values
```scss
/* Before */
padding: 20px;
margin-bottom: 16px;
font-size: 14px;

/* After */
padding: var(--spacing-lg);
margin-bottom: var(--spacing-md);
font-size: var(--text-sm);
```

### Step 2: Use Fluid Typography
```scss
/* Before */
h1 { font-size: 32px; }
h2 { font-size: 24px; }

/* After */
h1 { font-size: var(--text-3xl); }
h2 { font-size: var(--text-2xl); }
```

### Step 3: Implement Touch Targets
```scss
/* Before */
button { height: 36px; }

/* After */
button { 
  min-height: var(--touch-target-min);
  height: var(--button-height-mobile);
}
```

---

## Testing Checklist

- [ ] All hardcoded pixel values replaced
- [ ] CSS variables cascade correctly
- [ ] Fallback values work when needed
- [ ] clamp() functions scale properly
- [ ] Safe area insets apply on notched devices
- [ ] Touch targets meet minimum sizes
- [ ] Typography scales smoothly
- [ ] Animations respect reduced motion
- [ ] Z-index layers stack correctly
- [ ] Breakpoints trigger at correct widths

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| CSS Variables | ✅ 49+ | ✅ 31+ | ✅ 9.1+ | ✅ 15+ |
| clamp() | ✅ 79+ | ✅ 75+ | ✅ 13.1+ | ✅ 79+ |
| dvh units | ✅ 108+ | ✅ 101+ | ✅ 15.4+ | ✅ 108+ |
| env() | ✅ 69+ | ✅ 65+ | ✅ 11.1+ | ✅ 79+ |
| gap (flexbox) | ✅ 84+ | ✅ 63+ | ✅ 14.1+ | ✅ 84+ |

### Fallback Strategy
For older browsers, provide fallback values:
```scss
.element {
  padding: 16px; /* Fallback */
  padding: var(--spacing-md);
  
  height: 100vh; /* Fallback */
  height: 100dvh; /* Modern */
}
```

---

*Reference Version: 1.0*  
*Last Updated: December 2024*