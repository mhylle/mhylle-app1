# Unified Planet Header Component

A comprehensive, reusable header component for all planet interfaces in the candy factory game. This component consolidates navigation, branding, and resource display into a cohesive unit.

## Features

✅ **Unified Navigation** - Back button with lab-themed styling  
✅ **Planet Branding** - Planet name and scientific subtitle with emojis  
✅ **Resource Display** - Candy, crystals, and production rate with special resources  
✅ **Cross-Planet Themes** - Supports Sour, Sweet, Cold, and Spicy planet themes  
✅ **Responsive Design** - Adapts to mobile and desktop screens  
✅ **Laboratory Aesthetic** - Scientific equipment icons and animated elements  
✅ **Accessibility** - Proper ARIA labels and keyboard navigation  

## Usage

### Basic Example

```typescript
import { PlanetHeaderComponent, PlanetTheme, ResourceData } from '../shared/planet-header/planet-header.component';

@Component({
  imports: [PlanetHeaderComponent],
  template: `
    <app-planet-header
      [theme]="planetTheme"
      [resources]="resources"
      [isLoading]="false"
      (backClicked)="navigateBack()">
    </app-planet-header>
  `
})
export class MyPlanetComponent {
  planetTheme: PlanetTheme = PlanetHeaderComponent.createTheme('sour');
  
  resources: ResourceData = {
    candy: 1234,
    crystals: 56,
    productionPerSecond: 12.5,
    specialResources: {
      ph: 5.2
    }
  };
  
  navigateBack() {
    this.router.navigate(['/solar-system']);
  }
}
```

### Theme Configuration

```typescript
// Use preset themes
const sourTheme = PlanetHeaderComponent.createTheme('sour');
const sweetTheme = PlanetHeaderComponent.createTheme('sweet');
const coldTheme = PlanetHeaderComponent.createTheme('cold');
const spicyTheme = PlanetHeaderComponent.createTheme('spicy');

// Customize theme
const customTheme = PlanetHeaderComponent.createTheme('sour', {
  name: 'Acidic Laboratory',
  subtitle: 'Advanced pH Research Facility',
  backgroundIcon: '/custom-beaker.png'
});
```

### Advanced Features

```typescript
// With breadcrumb navigation
<app-planet-header
  [theme]="theme"
  [resources]="resources"
  [showBreadcrumb]="true"
  backButtonText="← Return to Command Center">
</app-planet-header>

// With primary actions slot
<app-planet-header [theme]="theme" [showPrimaryActions]="true">
  <div slot="primary-actions">
    <button class="emergency-button">Emergency Stop</button>
    <button class="settings-button">Settings</button>
  </div>
</app-planet-header>

// With quick actions bar
<app-planet-header [theme]="theme" [showQuickActions]="true">
  <div slot="quick-actions">
    <button>Save Progress</button>
    <button>Auto-Collect</button>
    <button>Research</button>
  </div>
</app-planet-header>
```

## Input Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `theme` | `PlanetTheme` | Sour theme | Planet theme configuration |
| `resources` | `ResourceData \| null` | `null` | Resource data for display |
| `backButtonText` | `string` | 'Back to Solar System' | Text for back button |
| `showBreadcrumb` | `boolean` | `false` | Show breadcrumb navigation |
| `showPrimaryActions` | `boolean` | `false` | Enable primary actions slot |
| `showQuickActions` | `boolean` | `false` | Enable quick actions bar |
| `isLoading` | `boolean` | `false` | Show loading state |

## Output Events

| Event | Type | Description |
|-------|------|-------------|
| `backClicked` | `void` | Emitted when back button is clicked |
| `resourceClicked` | `string` | Emitted when a resource is clicked (resource type) |

## Theme Interface

```typescript
interface PlanetTheme {
  id: 'sour' | 'sweet' | 'cold' | 'spicy';
  name: string;              // Display name
  subtitle: string;          // Scientific subtitle
  emoji: string;             // Planet emoji
  primaryColor: string;      // Primary theme color
  secondaryColor: string;    // Secondary theme color
  accentColor: string;       // Accent color
  backgroundIcon: string;    // Lab equipment icon
  labEquipment: string[];    // Lab equipment emojis [before, after]
}
```

## Resource Data Interface

```typescript
interface ResourceData {
  candy: number;                           // Main currency
  crystals?: number;                       // Secondary currency (optional)
  productionPerSecond: number;             // Production rate
  specialResources?: { [key: string]: number }; // Planet-specific resources
}
```

## Theming

The component supports CSS custom properties for theming:

```css
app-planet-header[data-theme="sour"] {
  --theme-primary: #32CD32;
  --theme-secondary: #9ACD32;
  --theme-accent: #FFD700;
}

app-planet-header[data-theme="sweet"] {
  --theme-primary: #FF69B4;
  --theme-secondary: #FFB6C1;
  --theme-accent: #FFC0CB;
}
```

## Responsive Behavior

- **Desktop (> 900px)**: Full horizontal layout with all elements visible
- **Tablet (≤ 900px)**: Stacked layout, simplified breadcrumb
- **Mobile (≤ 480px)**: Compact layout, icon-only buttons

## Accessibility Features

- Proper ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader friendly text alternatives
- High contrast support
- Reduced motion support for animations

## Integration Notes

### Replacing Legacy Headers

When migrating from individual header components:

1. **Remove old header markup** from planet templates
2. **Import PlanetHeaderComponent** in your component
3. **Configure theme and resources** as component properties
4. **Update CSS** to remove old header styles
5. **Test responsive behavior** across different screen sizes

### Performance Considerations

- The component uses CSS-only animations for better performance
- Resource data is reactive via getter methods for optimal change detection
- Theme configurations are static for efficient memory usage

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Migration Guide

### From Individual Components

Before:
```html
<div class="planet-header">
  <button (click)="goBack()">Back</button>
  <h1>Planet Name</h1>
  <div class="resources">{{candy}} candy</div>
</div>
```

After:
```html
<app-planet-header
  [theme]="planetTheme"
  [resources]="resourceData"
  (backClicked)="goBack()">
</app-planet-header>
```

### CSS Migration

Remove old header styles:
```scss
// Remove these styles
.planet-header { /* ... */ }
.back-button { /* ... */ }
.currency-display { /* ... */ }
```

Add new integration styles:
```scss
// Add minimal integration
app-planet-header {
  position: relative;
  z-index: 10;
  width: 100%;
}
```

## Examples by Planet Type

### Sour Planet (pH Laboratory)
- Theme: Green colors, beaker icons, pH indicators
- Special resources: pH level, fermentation status
- Lab equipment: ⚗️ 🧪

### Sweet Planet (Crystal Formation)  
- Theme: Pink colors, crystal icons, sweetness meters
- Special resources: Sugar concentration, crystal purity
- Lab equipment: 🍯 🧊

### Cold Planet (Cryogenic Processing)
- Theme: Blue colors, molecular icons, temperature gauges
- Special resources: Temperature, freeze rate
- Lab equipment: 🧊 🌡️

### Spicy Planet (Heat Catalysis)
- Theme: Red/orange colors, flame icons, heat indicators  
- Special resources: Heat level, spice intensity
- Lab equipment: 🔥 🌡️