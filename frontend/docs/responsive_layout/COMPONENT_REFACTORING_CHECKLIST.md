# Component Refactoring Checklist
## Systematic Guide for Responsive Layout Implementation

This checklist provides a step-by-step guide for refactoring each component in the Sour Planet game to achieve full responsiveness across all device sizes.

---

## Pre-Refactoring Setup

### Environment Preparation
- [ ] Create feature branch: `feature/responsive-layout-refactoring`
- [ ] Set up device testing environment (BrowserStack/real devices)
- [ ] Install browser DevTools extensions for responsive testing
- [ ] Configure VS Code with CSS/SCSS linting
- [ ] Back up current production CSS files

### Documentation Review
- [ ] Read IMPLEMENTATION_PLAN.md thoroughly
- [ ] Review CSS_VARIABLES_REFERENCE.md
- [ ] Understand current component structure
- [ ] Document any additional hardcoded values found

---

## Phase 1: Foundation Setup ✅

### 1.1 CSS Variables System
**File**: `_sour-planet-variables.scss`

- [ ] Create backup of current variables file
- [ ] Add responsive spacing scale (`--spacing-xs` through `--spacing-2xl`)
- [ ] Add fluid typography scale (`--text-xs` through `--text-3xl`)
- [ ] Add component dimension variables
- [ ] Add breakpoint variables
- [ ] Add touch target size variables
- [ ] Test variable compilation in development build
- [ ] Verify variables cascade correctly
- [ ] Document any custom variables needed

### 1.2 Global Reset & Base Styles
**File**: `sour-planet.component.scss`

- [ ] Remove any global `margin` on body/html
- [ ] Set `box-sizing: border-box` globally
- [ ] Configure viewport meta tag correctly
- [ ] Add safe-area-inset support
- [ ] Set base font-size for rem calculations
- [ ] Configure smooth scrolling behavior
- [ ] Add focus-visible styles for accessibility

---

## Phase 2: Header Component 🎯

### 2.1 Planet Header Component
**File**: `planet-header.component.scss`

#### Remove Fixed Values
- [ ] Replace `padding: 20px 24px` with `var(--header-padding-mobile)`
- [ ] Remove `margin: 16px` (set to 0 for mobile)
- [ ] Replace `height: 70px` logo with `var(--logo-height-mobile)`
- [ ] Replace `width: 60px` icons with fluid sizing
- [ ] Replace `gap: 20px` with `var(--gap-md)`
- [ ] Remove `margin-bottom: 16px` fixed spacing

#### Add Responsive Features
- [ ] Implement `clamp()` for header height
- [ ] Add safe-area-inset padding for notched devices
- [ ] Configure responsive logo scaling
- [ ] Hide non-critical elements on mobile (`display: none`)
- [ ] Add compact mobile layout styles
- [ ] Test touch targets meet 44px minimum

#### Template Updates
**File**: `planet-header.component.ts`

- [ ] Add semantic HTML5 elements (`<header>`, `<nav>`)
- [ ] Add proper ARIA labels
- [ ] Implement collapsible navigation for mobile
- [ ] Add keyboard navigation support
- [ ] Test screen reader compatibility

#### Validation
- [ ] Header height ≤ 80px on mobile
- [ ] Logo scales proportionally
- [ ] Navigation is accessible on all devices
- [ ] No horizontal overflow
- [ ] Safe area insets work on iPhone

---

## Phase 3: Main Layout Container 📐

### 3.1 Sour Planet Layout
**File**: `sour-planet.component.scss`

#### Convert to CSS Grid
- [ ] Replace flexbox with CSS Grid for main layout
- [ ] Implement `grid-template-rows: auto 1fr`
- [ ] Use `height: 100dvh` (with `100vh` fallback)
- [ ] Remove `overflow: hidden` that causes cutoff
- [ ] Add proper `overflow` management per section

#### Mobile Layout (< 768px)
- [ ] Configure vertical stack: `grid-template-rows: 1fr auto`
- [ ] Main content scrollable with `-webkit-overflow-scrolling: touch`
- [ ] Upgrades panel as bottom sheet (max-height: 40vh)
- [ ] Add visual handle indicator for upgrades panel
- [ ] Ensure game content always visible above fold

#### Tablet/Desktop Layout (≥ 768px)
- [ ] Configure horizontal layout: `grid-template-columns: 1fr var(--upgrades-width)`
- [ ] Remove fixed `400px` sidebar width
- [ ] Use fluid `--upgrades-width` variable
- [ ] Ensure proper overflow handling
- [ ] Test at various tablet widths

#### Remove Hardcoded Values
- [ ] Replace `padding: 30px` with `var(--content-padding)`
- [ ] Replace `max-width: 700px` with relative units
- [ ] Remove `height: calc(100vh - 140px)` calculations
- [ ] Replace `gap: 20px` with `var(--gap-md)`
- [ ] Remove all fixed margins

---

## Phase 4: Game Components 🎮

### 4.1 Lemon Clicker Component
**File**: `lemon-clicker.component.scss`

#### Current Issues to Fix
- [ ] Replace `width: 250px; height: 250px` with `var(--lemon-size)`
- [ ] Replace `padding: 40px 20px 20px` with responsive padding
- [ ] Remove `margin-bottom: 20px` fixed spacing
- [ ] Replace `font-size: 4rem` with proportional sizing

#### Responsive Implementation
- [ ] Use `clamp()` for lemon size scaling
- [ ] Ensure minimum 44px touch target
- [ ] Add `touch-action: manipulation` for better mobile response
- [ ] Implement proportional emoji sizing: `calc(var(--lemon-size) * 0.3)`
- [ ] Add active state transform for feedback
- [ ] Test on various screen sizes

#### Accessibility
- [ ] Add proper `role="button"` attribute
- [ ] Include descriptive `aria-label`
- [ ] Ensure keyboard activation works
- [ ] Add focus indicators
- [ ] Test with screen readers

### 4.2 pH Balance System Component
**File**: `ph-balance-system.component.scss`

#### Remove Fixed Dimensions
- [ ] Replace all fixed padding values (10px, 15px, 8px, 6px)
- [ ] Replace fixed font sizes (1.4rem, 0.85rem)
- [ ] Remove hardcoded margins and gaps
- [ ] Convert fixed button sizes to fluid units

#### Responsive Layout
- [ ] Use CSS Grid or Flexbox for controls
- [ ] Implement `flex-wrap` for mobile button layout
- [ ] Scale pH meter height responsively
- [ ] Ensure controls fit mobile width
- [ ] Add proper spacing with CSS variables

#### Mobile Optimizations
- [ ] Reduce visual complexity on small screens
- [ ] Ensure all controls are touch-friendly
- [ ] Test landscape orientation
- [ ] Verify text remains readable
- [ ] Check overflow handling

### 4.3 Upgrades Panel Component
**File**: `upgrades-panel.component.scss`

#### Current Good Practices to Keep
- [ ] Maintain CSS variable usage where present
- [ ] Keep custom scrollbar styling
- [ ] Preserve backdrop-filter effects

#### Fix Remaining Issues
- [ ] Remove `min-width: 300px` hardcoded value
- [ ] Replace default pixel fallbacks in CSS variables
- [ ] Implement proper mobile bottom sheet
- [ ] Add swipe-to-close gesture support (optional)

#### Mobile Bottom Sheet Implementation
- [ ] Set `max-height: 40vh` on mobile
- [ ] Add `min-height: 150px` to ensure visibility
- [ ] Implement visual handle indicator
- [ ] Add `border-radius: 1rem 1rem 0 0` for sheet appearance
- [ ] Ensure smooth scrolling with momentum
- [ ] Test pull-to-refresh doesn't interfere

#### Desktop Sidebar
- [ ] Use fluid width with `var(--upgrades-width-desktop)`
- [ ] Ensure scrollbar doesn't cause layout shift
- [ ] Maintain full height scrollable area
- [ ] Test with long upgrade lists
- [ ] Verify hover states work

---

## Phase 5: Testing & Validation ✔️

### 5.1 Device Testing Matrix

#### iPhone SE (375×667) - Minimum Width
- [ ] No horizontal scrollbars
- [ ] All content fits within viewport
- [ ] Touch targets ≥ 44px
- [ ] Text remains readable
- [ ] Landscape orientation works

#### iPhone 14 Pro (390×844) - Notched Device
- [ ] Safe area insets apply correctly
- [ ] Header doesn't overlap with notch
- [ ] Bottom navigation clears home indicator
- [ ] Dynamic Island doesn't interfere

#### iPad Mini (768×1024) - Small Tablet
- [ ] Side-by-side layout activates
- [ ] Content proportions look good
- [ ] Both orientations work properly
- [ ] No cramped spacing

#### iPad Pro 12.9" (1024×1366) - Large Tablet
- [ ] Layout maximizes screen space
- [ ] Text doesn't become too large
- [ ] Proper use of available width
- [ ] Landscape mode optimized

#### Desktop (1920×1080) - Standard Monitor
- [ ] Full layout displays correctly
- [ ] Hover states functional
- [ ] Keyboard navigation works
- [ ] Content doesn't stretch too wide

### 5.2 Browser Testing

#### Chrome (Latest)
- [ ] CSS Grid works correctly
- [ ] clamp() functions properly
- [ ] Custom properties cascade
- [ ] Touch events work on mobile

#### Safari (Latest)
- [ ] -webkit prefixes work
- [ ] Safe area insets apply
- [ ] Smooth scrolling works
- [ ] No rendering issues

#### Firefox (Latest)
- [ ] Layout matches other browsers
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Scrolling smooth

#### Edge (Latest)
- [ ] Compatibility with Chromium features
- [ ] No specific Edge issues
- [ ] Touch/mouse events work
- [ ] Print styles (if applicable)

### 5.3 Accessibility Testing

#### Keyboard Navigation
- [ ] All interactive elements reachable
- [ ] Logical tab order
- [ ] Skip links functional
- [ ] Focus indicators visible
- [ ] Escape key closes modals

#### Screen Readers
- [ ] ARIA labels present and descriptive
- [ ] Semantic HTML structure
- [ ] Dynamic content announced
- [ ] Form labels associated
- [ ] Error messages accessible

#### Visual Accessibility
- [ ] Color contrast ≥ 4.5:1 (WCAG AA)
- [ ] Text resizable to 200%
- [ ] No information by color alone
- [ ] Focus indicators high contrast
- [ ] Motion respects prefers-reduced-motion

### 5.4 Performance Testing

#### Mobile Performance
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] No layout shifts (CLS < 0.1)
- [ ] Touch response < 100ms
- [ ] Smooth 60fps scrolling

#### Network Performance
- [ ] Works on 3G connection
- [ ] Images optimized for mobile
- [ ] CSS file size reasonable
- [ ] No render-blocking resources
- [ ] Efficient font loading

---

## Post-Refactoring Tasks 🏁

### Code Quality
- [ ] Run CSS linter and fix warnings
- [ ] Remove unused CSS rules
- [ ] Consolidate duplicate styles
- [ ] Organize CSS logically
- [ ] Add helpful comments

### Documentation
- [ ] Update component documentation
- [ ] Document new CSS variables
- [ ] Create migration guide
- [ ] Update README with responsive notes
- [ ] Document browser support

### Version Control
- [ ] Commit changes with clear messages
- [ ] Create pull request with description
- [ ] Request code review
- [ ] Address review feedback
- [ ] Merge when approved

### Deployment
- [ ] Test in staging environment
- [ ] Monitor error logs
- [ ] Check analytics for issues
- [ ] Gather user feedback
- [ ] Plan any necessary hotfixes

---

## Sign-off Checklist

### Technical Requirements
- [ ] No horizontal scrollbars at any viewport
- [ ] Header ≤ 15% of mobile viewport
- [ ] Touch targets ≥ 44px throughout
- [ ] All text readable on small screens
- [ ] Smooth performance on all devices

### Business Requirements
- [ ] Game playable on target devices
- [ ] User experience improved
- [ ] No regression in desktop experience
- [ ] Accessibility standards met
- [ ] Performance metrics achieved

### Final Approval
- [ ] Developer testing complete
- [ ] QA testing passed
- [ ] Design review approved
- [ ] Product owner sign-off
- [ ] Ready for production

---

## Rollback Plan

If issues arise post-deployment:

1. **Immediate** (< 5 min)
   - [ ] Revert to previous version
   - [ ] Notify team of rollback
   - [ ] Document issue encountered

2. **Short-term** (< 1 hour)
   - [ ] Deploy hotfix if possible
   - [ ] Update status page
   - [ ] Communicate with users

3. **Long-term** (< 1 day)
   - [ ] Fix issues in development
   - [ ] Thorough testing
   - [ ] Scheduled re-deployment

---

## Notes Section

Use this space to document:
- Unexpected issues encountered
- Workarounds implemented
- Future improvements identified
- Device-specific quirks
- Performance observations

---

*Checklist Version: 1.0*  
*Created: December 2024*  
*Total Items: 200+ checkpoints*