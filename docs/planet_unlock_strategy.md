# Planet Unlock Strategy - Cosmic Candy Factory

## Core Philosophy: "Three Paths to Discovery"

Rather than arbitrary resource gates, each planet unlock requires mastery demonstration through **player choice**. Each planet requires progress in 2 of 3 tracks, ensuring multiple viable paths while maintaining meaningful choice.

## Three-Track System

### ⚡ Efficiency Track
- Optimization and skill-based challenges
- Tests understanding of game mechanics
- Rewards players who master systems

### 🔍 Explorer Track  
- Achievement hunting and content discovery
- Tests engagement with different game systems
- Rewards thorough exploration

### ⏳ Persistence Track
- Time investment and resource accumulation
- Tests sustained engagement
- Provides fallback for struggling players

## Specific Planet Unlock Requirements

### 🍋 Sour Planet (First Expansion)
**Theme**: Introduction to resource management  
**Expected Time**: 30-60 minutes (casual), 15-30 minutes (active)

**Requirements** (Choose 2 of 3):
- **⚡ Efficiency**: Reach 500 candy/second production rate
- **🔍 Explorer**: Complete "Sweet Tooth" + "Production Pro" + "Click Master" achievements  
- **⏳ Persistence**: Accumulate 100,000 total candy

**Discovery Event**: "Deep space sensors detect unusual energy signatures from the Sour Sector..."

### 🧊 Cold Planet (Preservation Specialist)
**Theme**: Multi-planet coordination  
**Expected Time**: 2-4 hours (casual), 1-2 hours (active)

**Requirements** (Choose 2 of 3):
- **⚡ Efficiency**: Complete "Sweet & Sour Symphony" recipe 3 times successfully
- **🔍 Explorer**: Discover 8 different achievements across both planets
- **⏳ Persistence**: Maintain 2-planet operations for 45 minutes total playtime

**Discovery Event**: "Thermal readings indicate a crystalline world in the outer rim..."

### 🌶️ Spicy Planet (Risk Management)
**Theme**: Precision and mastery

**Requirements** (Choose 2 of 3):
- **⚡ Efficiency**: Perfect pH balance on Sour Planet for 10 consecutive minutes  
- **🔍 Explorer**: Complete 5 different Tier-2 cross-planet recipes
- **⏳ Persistence**: Achieve 1 million total candy AND complete first prestige

**Discovery Event**: "Volatile heat signatures suggest a dangerous but resource-rich planet..."

### 🍫 Bitter Planet (Advanced Coordination)
**Theme**: System mastery

**Requirements** (Choose 2 of 3):
- **⚡ Efficiency**: Maintain 4-planet network synergy (35% bonus) for 30 minutes
- **🔍 Explorer**: Unlock 15 unique achievements + discover 3 rare candy types
- **⏳ Persistence**: Complete 2 prestige cycles with improving efficiency metrics

**Discovery Event**: "Complex chemical signatures detected in the deep sector..."

### 🥤 Fizzy Planet (Master Level)
**Theme**: Ultimate coordination

**Requirements** (Choose 2 of 3):
- **⚡ Efficiency**: Complete ultimate "Cosmic Candy Perfection" recipe
- **🔍 Explorer**: Achieve "Master of Elements" achievement series (all planets mastered)
- **⏳ Persistence**: 20+ hours total playtime with consistent progression

**Discovery Event**: "Effervescent readings indicate the final world in our cosmic sector..."

## Smart Guidance System

### Adaptive Recommendations
```typescript
interface PlayerGuidance {
  recommendNextGoal(playerBehavior: 'clicker' | 'idler' | 'explorer'): UnlockRequirement;
  adaptToProgress(sessionData: PlaySession[]): void;
  highlightOptimalPath(): string;
}
```

### Features
- **Player Type Detection**: Automatically identifies play style and suggests optimal track
- **Progress Radar**: Visual circular progress indicators for each requirement  
- **Estimated Time**: "~15 minutes to complete" based on current progression rate
- **Alternative Paths**: If struggling with one requirement, highlights others
- **Session Goals**: "Play 10 more minutes to unlock next achievement"

### Mobile-Optimized Progress Display
```typescript
interface UnlockProgress {
  planetId: PlanetType;
  requirements: {
    id: string;
    name: string;
    description: string;
    progress: number; // 0.0 to 1.0
    completed: boolean;
    estimatedTimeToComplete: string;
  }[];
  unlockReadiness: number; // "2 of 3 completed"
}
```

## Unlock Celebration Sequence

### Build-Up Phase (30-60 seconds before unlock)
1. "Energy readings are intensifying..."
2. Visual effects building on solar system overview
3. Background music shifts to crescendo
4. Particle effects converge on new planet location

### Discovery Moment
1. Screen-filling cosmic revelation animation
2. Planet emerges from energy/dust cloud with unique visual theme
3. Triumphant sound effect and screen flash
4. Achievement unlock notification with cosmic badge

### Onboarding Flow
1. **Welcome Tour**: "Welcome to the [Planet] Sector!"
2. **Mechanic Tutorial**: Guided introduction to planet-specific systems
3. **Safe Practice**: Tutorial environment to try new mechanics
4. **Next Goals**: Preview of what this planet enables and next unlock targets

## Prestige Integration

### Tiered Persistence System
- **Tier 1** (Sweet, Sour): Permanently unlocked after first prestige
- **Tier 2** (Cold, Spicy): Unlock requirements reduced by 50% each prestige level
- **Tier 3** (Bitter, Fizzy): Full requirements maintained for endgame challenge

### Benefits
- Respects player time investment
- Maintains meaningful prestige progression
- Prevents tedious re-unlocking of basics
- Preserves challenge for advanced content

## A/B Testing Framework

### Experimental Structure
```typescript
interface UnlockExperiment {
  cohortId: string;
  adjustedThresholds: { [requirement: string]: number };
  metrics: {
    averageUnlockTime: number;
    retentionAfterUnlock: number;
    playerSatisfactionScore: number;
    commonFailurePoints: string[];
    crossPlatformParity: { mobile: number; desktop: number };
  };
}
```

### Success Targets
- **90%+ unlock Sour Planet** within first week of play
- **70%+ unlock Cold Planet** within first month  
- **<5% abandonment rate** due to unlock frustration
- **Mobile/desktop unlock parity** within 10% difference
- **Session length increase** of 25%+ after planet unlocks

## Implementation Technical Considerations

### Data Model Extensions
```typescript
interface PlanetUnlockProgress {
  planetId: PlanetType;
  tracksCompleted: ('efficiency' | 'explorer' | 'persistence')[];
  requirementsProgress: {
    [trackId: string]: {
      progress: number;
      completed: boolean;
      completedAt?: number;
    };
  };
  unlocked: boolean;
  unlockedAt?: number;
  celebrationShown: boolean;
}

interface EnhancedGameState extends GameState {
  planetUnlockProgress: { [planetId: string]: PlanetUnlockProgress };
  guidancePreferences: {
    preferredTrack?: 'efficiency' | 'explorer' | 'persistence';
    playerType?: 'clicker' | 'idler' | 'explorer';
    showHints: boolean;
  };
}
```

### Edge Cases and Safeguards
1. **Stuck Players**: Emergency unlock path after 7 days of no progress
2. **Rushed Players**: Soft caps and quality gates prevent skipping learning
3. **Returning Players**: 20% progress acceleration for players returning after 30+ days
4. **Mobile Sessions**: All requirements achievable in short sessions with progress preservation
5. **Offline Progress**: Persistence track requirements count offline time at reduced rate

### Performance Considerations
- Unlock progress calculations run on background thread
- Visual celebrations use GPU-accelerated CSS transforms
- Progress data synced incrementally to prevent large payload spikes
- Smart preloading of planet assets when 75% toward unlock

## Seasonal and Event Modifiers

### Special Events
- **Double Discovery Weekend**: All unlock progress counts 2x
- **Planet Rush Event**: Temporary alternative unlock paths with bonus rewards
- **Community Goals**: Server-wide progress toward collective discoveries

### Dynamic Difficulty Adjustment
- Requirements slightly decrease if global completion rates fall below targets
- Individual player adjustments based on engagement patterns
- Seasonal balancing based on player feedback and retention data

---

## Next Steps for Implementation

1. **Phase 1**: Implement base unlock tracking system and progress UI
2. **Phase 2**: Add Smart Guidance system with player type detection
3. **Phase 3**: Build celebration sequences and onboarding flows
4. **Phase 4**: Integrate with existing achievement and prestige systems
5. **Phase 5**: A/B testing framework and analytics dashboard

**Conservative Starting Thresholds**: All numbers above are conservative starting points that can be adjusted based on player data to find the optimal balance between challenge and accessibility.