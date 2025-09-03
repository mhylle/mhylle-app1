# Sour Planet UI Implementation Context

## Current Status - Layout Fixed ✅

The side-by-side layout has been successfully implemented! The upgrades panel now appears beside the main content instead of below it.

### What Was Fixed:
- **Template Structure Issue**: The `.upgrades-panel` was nested inside `.main-content` instead of being a sibling
- **Fixed in**: `/home/mhylle/projects/mhylle.com/example-app1/frontend/src/app/components/sour-planet/sour-planet.component.ts`
- **Change**: Moved closing `</div>` tag from line 240 to line 241 to properly close `.main-content` before `.upgrades-panel`

### Current Working Structure:
```html
<div class="game-area"> <!-- display: flex, flex-direction: row -->
  <div class="main-content"><!-- flex: 1 -->
    <div class="planet-container">
      <!-- pH Balance System, Lemon Clicker, etc. -->
    </div>
  </div>
  <div class="upgrades-panel"><!-- Now correctly positioned as sibling -->
    <!-- Sour Planet Upgrades -->
  </div>
</div>
```

## Remaining Critical Issues 🚨

Based on the current screenshot analysis (`sour-planet-current-issues.png`):

### 1. **Oversized Header/Top Section**
- **Issue**: The top portion (header + currency display) takes up excessive vertical space
- **Impact**: Reduces available space for the main game content
- **Location**: Lines 56-98 in the template (`.planet-header` and `.top-bar`)

### 2. **Misaligned Clickable Area**
- **Issue**: The clickable lemon button is not aligned with the visual lemon image
- **Current Problem**: Users click on the lemon image but the button is positioned below it
- **Location**: Lines 190-205 (`.central-lemon-section` and `.candy-clicker`)
- **Expected Fix**: Position the button directly over the lemon image

### 3. **Missing Planet Visual**
- **Issue**: No planet background/visual underneath the lemon
- **Current**: Just cosmic space background
- **User Request**: Create a "planet" visual with the lemon positioned on top of it
- **Expected**: Planet sphere/circle with lemon as an interactive element on the surface

### 4. **pH Balance Panel Proportions**
- **Issue**: The pH Balance System panel may be too large proportionally
- **Current**: Takes up significant vertical space in the main content area
- **Optimization Needed**: Better balance between pH controls, lemon clicker, and available space

## Technical Implementation Details

### Key Files:
- **Template**: `/home/mhylle/projects/mhylle.com/example-app1/frontend/src/app/components/sour-planet/sour-planet.component.ts` (lines 54-311)
- **Styles**: `/home/mhylle/projects/mhylle.com/example-app1/frontend/src/app/components/sour-planet/sour-planet.component.css`
- **Global Styles**: `/home/mhylle/projects/mhylle.com/example-app1/frontend/src/styles.css` (contains CSS custom properties)

### Current CSS Structure:
```css
.game-area {
  display: flex;
  flex-direction: row;
  height: calc(100vh - 160px);
  position: relative;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upgrades-panel {
  width: 400px;
  background: var(--secondary-bg);
  border-left: 2px solid #32CD32;
  padding: 20px;
  overflow-y: auto;
  /* ... more styles ... */
}
```

### CSS Custom Properties (in styles.css):
```css
:root {
  --primary-bg: #0F1D2B;        /* Main canvas background, deep space feel */
  --secondary-bg: #1C2E3F;      /* Panel backgrounds */
  --interactive-green: #4CAF50;  /* Primary interactive elements */
  --alert-orange: #FF9800;       /* Warning indicators */
  --alert-red: #F44336;         /* Danger indicators */
  --optimal-green: #8BC34A;     /* Optimal pH indicators */
  --text-light: #E0E0E0;        /* General text, inactive icons */
  --accent-purple: #8040A0;     /* Crystals currency */
  --accent-green: #66BB6A;      /* Sour candy currency */
  --lemon-yellow: #FFEB3B;      /* Lemon illustration, pH indicator */
}
```

## Responsive Design Status:
- **Media Query**: Fixed at `@media (max-width: 480px)` for mobile-only column layout
- **Current**: Side-by-side layout works correctly on desktop and tablet viewports

## Development Environment:
- **Dev Server**: `npm start` in `/home/mhylle/projects/mhylle.com/example-app1/frontend/`
- **URL**: `http://localhost:4200/planet/sour`
- **Framework**: Angular 20 with standalone components

## Images/Assets:
- Lemon image: `/lemon.png`
- pH OK indicator: `/ph_ok.png`
- Sour candy icon: `/sour_candy.png`
- Various upgrade icons: `/gears.png`, `/beaker.png`, `/collect_all.png`, etc.

## Testing Approach:
Use Playwright MCP for visual testing and DOM inspection:
```javascript
// Check layout structure
const gameArea = document.querySelector('.game-area');
const children = Array.from(gameArea.children);
// Verify: ["main-content", "upgrades-panel"] as direct children

// Test clickable areas
const lemonButton = document.querySelector('.candy-button');
const lemonImage = document.querySelector('.central-lemon-illustration');
// Verify: button position overlaps with image position
```

## Next Priority Actions:
1. **Reduce Header Height**: Optimize `.planet-header` and `.top-bar` CSS for more compact layout
2. **Fix Lemon Button Position**: Align `.candy-button` directly over `.central-lemon-illustration`
3. **Add Planet Visual**: Create planet sphere background in `.central-lemon-section`
4. **Optimize pH Panel**: Reduce vertical space usage of `.ph-balance-panel`
5. **Test Click Accuracy**: Ensure clickable area matches visual lemon position

## Reference Comparisons:
- **Sweet Planet Layout**: Working reference at `http://localhost:4200/planet/sweet`
- **Screenshots**: Multiple screenshots saved in `.playwright-mcp/` showing layout progression

## Code Quality Notes:
- Layout structure is now correct (flex parent with proper siblings)
- CSS custom properties properly scoped in global styles
- Responsive design implemented
- All major layout issues resolved except visual refinements