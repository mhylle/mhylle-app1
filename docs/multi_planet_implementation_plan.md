# Multi-Planet System Implementation Plan

## Overview
Complete implementation strategy for transforming Cosmic Candy Factory from single-planet clicker into strategic cosmic empire management experience with 6 specialized planets.

## Architecture Approach

### Core Design Decision: Separate Planet Components with Shared Service
```typescript
// Core service managing all planets
PlanetSystemService {
  - Multi-planet state management
  - Cross-planet resource trading
  - Recipe discovery system
  - Network synergy calculations
}

// Individual planet components extending base
SweetPlanetComponent extends PlanetBaseComponent
SourPlanetComponent extends PlanetBaseComponent
ColdPlanetComponent extends PlanetBaseComponent
SpicyPlanetComponent extends PlanetBaseComponent
BitterPlanetComponent extends PlanetBaseComponent
FizzyPlanetComponent extends PlanetBaseComponent

// Navigation and overview
SolarSystemOverviewComponent {
  - Responsive layout detection
  - Planet selection handling
  - Mobile swipe support
}
```

## Enhanced Data Model

### Core Interfaces
```typescript
interface PlanetState {
  id: PlanetType; // 'sweet', 'sour', 'cold', 'spicy', 'bitter', 'fizzy'
  unlocked: boolean;
  candy: number; // Planet-specific candy
  clickPower: number;
  productionPerSecond: number;
  upgrades: { [upgradeId: string]: number };
  specialMechanics: {
    // Planet-specific data
    sweetness?: number; // For Sweet planet accumulation
    phLevel?: number; // For Sour planet (optimal ~5.5)
    temperature?: number; // For Cold planet (-50°C to 0°C)
    heat?: number; // For Spicy planet (0-100, overheat at 100)
    complexity?: number; // For Bitter planet
    pressure?: number; // For Fizzy planet
  };
  resources: {
    exports: { [resourceType: string]: number };
    imports: { [resourceType: string]: number };
  };
}

interface EnhancedGameState extends GameState {
  planets: { [planetId: string]: PlanetState };
  currentPlanet: PlanetType;
  solarSystemLevel: number; // Overall progression
  crossPlanetRecipes: CompletedRecipe[];
  tradeRoutes: TradeRoute[];
  networkSynergy: number; // Bonus from multiple active planets
  planetUnlockProgress: { [planetId: string]: PlanetUnlockProgress };
}

interface CrossPlanetRecipe {
  id: string;
  name: string;
  tier: 1 | 2 | 3; // Complexity level
  ingredients: {
    planet: PlanetType;
    resource: string;
    amount: number;
  }[];
  result: {
    type: 'multiplier' | 'unlock' | 'permanent_bonus';
    value: number;
    description: string;
  };
  discovered: boolean;
}

interface TradeRoute {
  fromPlanet: PlanetType;
  toPlanet: PlanetType;
  resourceType: ResourceType;
  rate: number; // per second
  efficiency: number; // 0.5 to 1.0 based on tech
  automatic: boolean;
}
```

## Mobile-First Responsive Design

### Layout Strategy
- **Mobile (<768px)**: Horizontal swipeable cards with bottom navigation
- **Tablet (768px-1024px)**: 2x3 grid layout with tap-to-expand
- **Desktop (>1024px)**: Full solar system orbital view with zoom animations

### Navigation Components
```typescript
// Mobile card-based navigation
@Component({
  selector: 'planet-cards-view',
  template: `
    <div class="planet-cards" 
         cdkScrollable
         (swipeleft)="nextPlanet()"
         (swiperight)="prevPlanet()">
      <div *ngFor="let planet of planets" 
           class="planet-card"
           [class.active]="planet.id === currentPlanet">
        <!-- Planet preview with key stats -->
      </div>
    </div>
    <nav class="bottom-nav">
      <button *ngFor="let planet of unlockedPlanets"
              [class.active]="planet.id === currentPlanet"
              (click)="selectPlanet(planet.id)">
        {{planet.icon}}
      </button>
    </nav>
  `
})
```

### Touch Optimizations
- Minimum 44x44px touch targets
- Swipe gestures for navigation
- Long-press for detailed info
- Pinch-to-zoom for solar system overview on tablets

## Planet-Specific Mechanics

### Sweet Planet (Tutorial/Foundation)
```typescript
class SweetPlanetMechanics {
  sweetnessLevel: number = 0; // 0-100
  
  accumulateSweetness(deltaTime: number): void {
    this.sweetnessLevel += (deltaTime / 1000) * this.sweetnessRate;
    if (this.sweetnessLevel >= 100) {
      this.triggerSugarRush();
    }
  }
  
  triggerSugarRush(): void {
    // 2x production for 30 seconds
    this.productionMultiplier = 2.0;
    this.sugarRushEndTime = Date.now() + 30000;
    this.sweetnessLevel = 0;
  }
}
```

### Sour Planet (Resource Management)
```typescript
class SourPlanetMechanics {
  phLevel: number = 7.0; // Neutral start
  
  getProductionModifier(): number {
    // Production peaks at pH 5-6, drops outside range
    const optimal = Math.abs(this.phLevel - 5.5);
    return Math.max(0.2, 1 - (optimal * 0.3));
  }
  
  importSweetness(amount: number): void {
    // Sweetness raises pH toward neutral
    this.phLevel = Math.min(7, this.phLevel + (amount * 0.001));
  }
  
  naturalAcidification(deltaTime: number): void {
    // pH naturally drifts toward acidic over time
    this.phLevel = Math.max(3, this.phLevel - (deltaTime / 60000) * 0.1);
  }
}
```

### Cold Planet (Preservation)
```typescript
class ColdPlanetMechanics {
  temperature: number = -10; // °C
  
  getProductionRate(): number {
    // Colder = slower production
    const tempModifier = Math.max(0.1, 1 + (this.temperature / 50));
    return this.baseProduction * tempModifier;
  }
  
  getCandyValue(): number {
    // Colder = higher value per candy
    const valueModifier = Math.max(1, 1 + Math.abs(this.temperature) / 10);
    return this.baseCandyValue * valueModifier;
  }
  
  crystallizeCandy(): void {
    if (this.temperature <= -30) {
      // Convert regular candy to crystallized (10x value)
      this.crystallizedCandy += this.regularCandy * 10;
      this.regularCandy = 0;
    }
  }
}
```

### Spicy Planet (High Risk/Reward)
```typescript
class SpicyPlanetMechanics {
  heatLevel: number = 20; // 0-100
  
  getProductionMultiplier(): number {
    // Exponential scaling with heat
    return Math.pow(1.05, this.heatLevel);
  }
  
  increaseHeat(deltaTime: number): void {
    if (this.isProducing) {
      this.heatLevel += (deltaTime / 1000) * this.heatBuildup;
    }
  }
  
  checkOverheat(): void {
    if (this.heatLevel >= 100) {
      // Overheat penalty
      this.candy *= 0.5; // Lose 50% candy
      this.heatLevel = 0;
      this.overheatCooldown = Date.now() + 60000; // 1 minute cooldown
    }
  }
  
  exportHeat(amount: number, targetPlanet: PlanetType): void {
    this.heatLevel = Math.max(0, this.heatLevel - amount);
    // Heat helps Cold planet crystallization
  }
}
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal**: Establish core multi-planet infrastructure

**Tasks**:
1. Create `PlanetSystemService` for multi-planet state management
2. Build responsive `SolarSystemOverviewComponent` with mobile navigation
3. Update backend `GameState` entity for multi-planet data
4. Implement planet switching with smooth animations
5. Create base `PlanetBaseComponent` interface

**Deliverables**:
- Working solar system navigation (mobile + desktop)
- Planet switching without game logic
- Enhanced data persistence
- Mobile swipe support

### Phase 2: Sweet & Sour (Week 2)
**Goal**: Prove multi-planet concept with two working planets

**Tasks**:
1. Refactor existing `CandyFactoryComponent` into `SweetPlanetComponent`
2. Create `SourPlanetComponent` with pH balance mechanics
3. Implement basic resource trading between planets
4. Add first cross-planet recipe ("Sweet & Sour Symphony")
5. Build planet unlock system with progress tracking

**Deliverables**:
- Two fully functional planets
- Working resource import/export
- First cross-planet recipe
- Unlock system proof of concept

### Phase 3: Temperature Planets (Week 3)
**Goal**: Add strategic depth with temperature mechanics

**Tasks**:
1. Create `ColdPlanetComponent` with crystallization mechanics
2. Create `SpicyPlanetComponent` with heat engine system
3. Implement heat/cold resource trading
4. Add Tier 2 cross-planet recipes
5. Build network synergy bonus system

**Deliverables**:
- Four planets with unique mechanics
- Advanced resource trading
- Multi-planet recipe system
- Network bonuses

### Phase 4: Advanced Planets (Week 4)
**Goal**: Complete the 6-planet system with full integration

**Tasks**:
1. Create `BitterPlanetComponent` with complexity scaling
2. Create `FizzyPlanetComponent` with pressure systems
3. Implement Tier 3 recipes requiring 4+ planets
4. Complete achievement integration
5. Polish animations and performance optimization

**Deliverables**:
- All 6 planets functional
- Complete recipe system
- Full achievement integration
- Performance optimized

## Performance Optimization Strategy

### Lazy Loading & Code Splitting
```typescript
const routes: Routes = [
  {
    path: 'planet/:type',
    loadChildren: () => import(`./planets/${type}/${type}.module`)
      .then(m => m.PlanetModule)
  }
];
```

### State Management Optimization
```typescript
class PlanetSystemService {
  // Only calculate active planet every frame
  private updateActivePlanet(): void {
    if (this.currentPlanet) {
      this.updatePlanetProduction(this.currentPlanet);
      this.updateSpecialMechanics(this.currentPlanet);
    }
  }
  
  // Batch updates for inactive planets (once per second)
  private updateInactivePlanets(): void {
    if (Date.now() - this.lastBatchUpdate > 1000) {
      this.inactivePlanets.forEach(planet => {
        this.calculateOfflineProgress(planet);
      });
      this.lastBatchUpdate = Date.now();
    }
  }
}
```

### Rendering Optimization
- Use CSS transforms for animations (GPU acceleration)
- Implement virtual scrolling for upgrade lists
- Throttle particle effects based on device performance
- Use OnPush change detection strategy
- RequestAnimationFrame for smooth animations

## Migration Strategy for Existing Players

### Seamless Transition Plan
1. **Data Migration**: Current game state becomes Sweet Planet state
2. **Preserve Progress**: All candy, upgrades, achievements transfer exactly
3. **Introduction**: Welcome message explaining cosmic expansion
4. **Guided Tour**: Tutorial showing solar system navigation
5. **Natural Progression**: Must unlock additional planets through normal gameplay

### Backward Compatibility
```typescript
class GameStateMigration {
  migrateToMultiPlanet(oldGameState: GameState): EnhancedGameState {
    return {
      ...oldGameState,
      planets: {
        sweet: {
          id: 'sweet',
          unlocked: true,
          candy: oldGameState.candy,
          clickPower: oldGameState.clickPower,
          productionPerSecond: oldGameState.productionPerSecond,
          upgrades: oldGameState.upgrades,
          // ... other sweet planet defaults
        }
      },
      currentPlanet: 'sweet',
      // ... other new fields with defaults
    };
  }
}
```

## Quality Assurance Strategy

### Testing Framework
- Unit tests for each planet's mechanics
- Integration tests for cross-planet interactions
- Mobile device testing (iOS/Android)
- Performance testing with all planets active
- User acceptance testing for unlock progression

### Success Metrics
- 90% comprehension rate for planet switching within 5 minutes
- 80% retention rate for players who unlock second planet
- Mobile/desktop parity in performance and usability
- Session length increase of 40%+ after multi-planet unlock

## Risk Mitigation

### Potential Issues and Solutions
1. **Performance Degradation**: Implement lazy loading and efficient state management
2. **Mobile UX Problems**: Extensive mobile testing and responsive design
3. **Player Confusion**: Clear onboarding and progress indicators
4. **Progression Pacing**: A/B testing of unlock thresholds
5. **Data Migration Issues**: Thorough backward compatibility testing

---

## Ready for Implementation

This plan provides a comprehensive roadmap for implementing the multi-planet system while maintaining the game's core appeal and ensuring excellent user experience across all devices. Each phase builds incrementally, allowing for testing and refinement throughout development.