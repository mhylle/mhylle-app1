# Implementation Plan: User Registration and Persistent Game State

## Project Overview
Transform the Cosmic Candy Factory from client-side localStorage to full-stack user-based persistence.

**Target Timeline:** 3-4 weeks  
**Priority:** High - Core functionality enhancement  
**Dependencies:** Existing TypeORM setup, PostgreSQL database  

---

## Phase 1: Backend Foundation (Week 1)

### Sprint 1.1: User Authentication Infrastructure (3-4 days)

#### Day 1: User Entity and Database Setup
**Tasks:**
- [ ] Create `src/entities/user.entity.ts`
- [ ] Create `src/dto/auth.dto.ts` (RegisterDto, LoginDto)
- [ ] Update `app.module.ts` to include User entity
- [ ] Install required packages: `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`

**Files to create:**
```
backend/src/entities/user.entity.ts
backend/src/dto/auth.dto.ts
backend/src/dto/user.dto.ts
```

**User Entity Schema:**
```typescript
- id: UUID (primary key)
- email: string (unique)
- username: string (unique, optional)
- passwordHash: string
- createdAt: Date
- updatedAt: Date
- isActive: boolean (default: true)
- lastLoginAt: Date (nullable)
```

#### Day 2: Authentication Module
**Tasks:**
- [ ] Create `src/auth/` module directory
- [ ] Create `auth.module.ts`, `auth.service.ts`, `auth.controller.ts`
- [ ] Implement JWT strategy and guards
- [ ] Create password hashing utilities

**Files to create:**
```
backend/src/auth/auth.module.ts
backend/src/auth/auth.service.ts
backend/src/auth/auth.controller.ts
backend/src/auth/jwt.strategy.ts
backend/src/auth/jwt-auth.guard.ts
```

#### Day 3: Authentication Endpoints
**Tasks:**
- [ ] Implement POST `/api/auth/register`
- [ ] Implement POST `/api/auth/login`
- [ ] Implement GET `/api/auth/profile`
- [ ] Add input validation and error handling
- [ ] Test endpoints with Postman/curl

**API Endpoints:**
```
POST /api/auth/register
  Body: { email, password, username? }
  Response: { user, token }

POST /api/auth/login
  Body: { email, password }
  Response: { user, token }

GET /api/auth/profile
  Headers: { Authorization: "Bearer <token>" }
  Response: { user }
```

#### Day 4: Testing and Security
**Tasks:**
- [ ] Add rate limiting to auth endpoints
- [ ] Implement password strength validation
- [ ] Write unit tests for auth service
- [ ] Add request logging for security audit

### Sprint 1.2: Game State Infrastructure (2-3 days)

#### Day 5: Game State Entity
**Tasks:**
- [ ] Create `src/entities/game-state.entity.ts`
- [ ] Create `src/dto/game-state.dto.ts`
- [ ] Update database to include game state table

**Game State Entity Schema:**
```typescript
- id: UUID (primary key)
- userId: UUID (foreign key to User)
- candy: number
- totalCandyEarned: number
- clickPower: number
- productionPerSecond: number
- upgrades: JSON (key-value pairs)
- unlockedUpgrades: string[] (JSON array)
- prestigeLevel: number
- prestigePoints: number
- prestigeMultiplier: number
- totalPrestigePoints: number
- lastSaved: Date
- createdAt: Date
- updatedAt: Date
```

#### Day 6: Game Module Setup
**Tasks:**
- [ ] Create `src/game/` module directory
- [ ] Create `game.module.ts`, `game.service.ts`, `game.controller.ts`
- [ ] Implement basic CRUD operations for game state
- [ ] Add JWT guard protection to all game endpoints

#### Day 7: Game State API Endpoints
**Tasks:**
- [ ] Implement GET `/api/game/state` - Fetch user's game state
- [ ] Implement PUT `/api/game/state` - Update full game state
- [ ] Implement POST `/api/game/sync` - Optimistic sync with conflict resolution
- [ ] Add server-side validation for game state values

---

## Phase 2: Frontend Authentication Integration (Week 2)

### Sprint 2.1: Registration and Login UI (3 days)

#### Day 8: Registration Component
**Tasks:**
- [ ] Create `src/app/components/register/register.component.ts`
- [ ] Add form validation (email format, password strength)
- [ ] Implement registration form UI with Angular Reactive Forms
- [ ] Add loading states and error handling

#### Day 9: Login Component Enhancement
**Tasks:**
- [ ] Update existing `login.component.ts` to work with new API
- [ ] Add "Remember Me" functionality
- [ ] Implement proper error messages for failed login
- [ ] Add "Register" link and navigation

#### Day 10: Auth Service Integration
**Tasks:**
- [ ] Update `auth.service.ts` to handle JWT tokens
- [ ] Implement token storage (consider httpOnly cookies vs localStorage)
- [ ] Add automatic token refresh mechanism
- [ ] Implement logout functionality

### Sprint 2.2: Route Protection and Navigation (2 days)

#### Day 11: Route Guards Implementation
**Tasks:**
- [ ] Re-enable `AuthGuard` on candy-factory route
- [ ] Update routing to redirect to login when unauthenticated
- [ ] Add user menu/profile dropdown to game header
- [ ] Implement logout functionality in game UI

#### Day 12: User Experience Flow
**Tasks:**
- [ ] Create welcome/onboarding flow for new users
- [ ] Add profile management page (basic)
- [ ] Implement "forgot password" placeholder
- [ ] Test complete authentication flow

---

## Phase 3: Game State Synchronization (Week 2-3)

### Sprint 3.1: Service Layer Refactoring (3 days)

#### Day 13: Candy Factory Service Overhaul
**Tasks:**
- [ ] Refactor `candy-factory.service.ts` to use API instead of localStorage
- [ ] Implement `loadGameStateFromServer()` method
- [ ] Add optimistic UI updates with rollback capability
- [ ] Create `GameStateSyncService` for managing server communication

#### Day 14: Auto-save Implementation
**Tasks:**
- [ ] Implement periodic auto-save (every 10 seconds)
- [ ] Add save on critical actions (purchases, prestige)
- [ ] Implement differential updates (only send changed fields)
- [ ] Add retry logic for failed saves

#### Day 15: Offline Mode Support
**Tasks:**
- [ ] Implement local caching as backup
- [ ] Queue actions when offline
- [ ] Add sync conflict resolution (server wins)
- [ ] Test offline/online scenarios

### Sprint 3.2: UI Sync Indicators (2 days)

#### Day 16: Save Status UI
**Tasks:**
- [ ] Add save status indicator to game header
- [ ] Implement connection status indicator  
- [ ] Show saving/saved/error states
- [ ] Add manual save button

#### Day 17: Error Handling and Recovery
**Tasks:**
- [ ] Add error messages for sync failures
- [ ] Implement retry mechanisms with exponential backoff
- [ ] Add "Force Sync" option for conflict resolution
- [ ] Test error scenarios and recovery

---

## Phase 4: Security and Validation (Week 3-4)

### Sprint 4.1: Server-Side Security (2 days)

#### Day 18: Anti-Cheat Measures
**Tasks:**
- [ ] Add server-side validation for game progression
- [ ] Implement reasonable limits for candy generation
- [ ] Add rate limiting for game actions
- [ ] Log suspicious activity

#### Day 19: Data Security
**Tasks:**
- [ ] Encrypt sensitive game data
- [ ] Add input sanitization
- [ ] Implement proper error handling without data leakage
- [ ] Add audit logging for game state changes

### Sprint 4.2: Migration and Compatibility (2 days)

#### Day 20: LocalStorage Migration
**Tasks:**
- [ ] Create migration utility for existing localStorage data
- [ ] Add "Import Existing Game" feature during registration
- [ ] Test migration with various localStorage states
- [ ] Add fallback for migration failures

#### Day 21: Anonymous Play Option
**Tasks:**
- [ ] Allow anonymous play with localStorage
- [ ] Add "Register to Save Progress" prompts
- [ ] Implement "Continue as Guest" option
- [ ] Create account linking for guests

---

## Phase 5: Testing and Deployment (Week 4)

### Sprint 5.1: Testing (2 days)

#### Day 22: Backend Testing
**Tasks:**
- [ ] Write unit tests for auth service
- [ ] Write integration tests for game state sync
- [ ] Add API endpoint tests
- [ ] Test database migrations

#### Day 23: Frontend Testing  
**Tasks:**
- [ ] Write component tests for auth components
- [ ] Add E2E tests for login/register flow
- [ ] Test game state synchronization scenarios
- [ ] Performance testing for sync operations

### Sprint 5.2: Deployment (2 days)

#### Day 24: Environment Configuration
**Tasks:**
- [ ] Update docker-compose with new environment variables
- [ ] Configure production database settings
- [ ] Update deployment pipeline for new dependencies
- [ ] Set up monitoring for auth and game endpoints

#### Day 25: Go-Live Preparation
**Tasks:**
- [ ] Final testing on staging environment
- [ ] Backup existing data
- [ ] Deploy to production
- [ ] Monitor for issues and user feedback

---

## Technical Specifications

### Database Schema Updates
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game states table  
CREATE TABLE game_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  candy DECIMAL(20,2) DEFAULT 0,
  total_candy_earned DECIMAL(20,2) DEFAULT 0,
  click_power INTEGER DEFAULT 1,
  production_per_second DECIMAL(10,2) DEFAULT 0,
  upgrades JSONB DEFAULT '{}',
  unlocked_upgrades JSONB DEFAULT '[]',
  prestige_level INTEGER DEFAULT 0,
  prestige_points INTEGER DEFAULT 0,
  prestige_multiplier DECIMAL(10,2) DEFAULT 1,
  total_prestige_points INTEGER DEFAULT 0,
  last_saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX idx_game_states_user_id ON game_states(user_id);
CREATE INDEX idx_game_states_last_saved ON game_states(last_saved);
CREATE INDEX idx_users_email ON users(email);
```

### API Specification

#### Authentication Endpoints
```
POST /api/auth/register
POST /api/auth/login  
GET /api/auth/profile
POST /api/auth/refresh
POST /api/auth/logout
```

#### Game State Endpoints
```
GET /api/game/state
PUT /api/game/state
POST /api/game/sync
POST /api/game/reset
```

### Frontend State Management
- Maintain optimistic UI updates
- Implement proper loading states
- Add conflict resolution UI
- Cache game state locally as backup

### Security Measures
- JWT tokens with 1-hour expiration
- Rate limiting: 100 req/min per IP for game endpoints
- Server-side validation of all game state changes
- Encrypted password storage with bcrypt
- Input sanitization and validation

---

## Risk Mitigation

### High Risk Items
1. **Data Loss During Migration** 
   - Mitigation: Comprehensive backup strategy, gradual rollout
2. **Performance Impact of Frequent Saves**
   - Mitigation: Differential updates, database optimization
3. **User Authentication Complexity**
   - Mitigation: Thorough testing, fallback to guest mode

### Success Criteria
- [ ] Users can register and login successfully
- [ ] Game state persists across sessions
- [ ] No data loss during normal operation  
- [ ] Performance remains acceptable (< 200ms for saves)
- [ ] Existing users can migrate their progress

### Monitoring and Metrics
- Track registration/login success rates
- Monitor game state sync performance
- Alert on authentication failures
- Track user retention after migration

---

## Dependencies and Prerequisites

### Required Packages (Backend)
```json
{
  "@nestjs/jwt": "^10.0.0",
  "@nestjs/passport": "^10.0.0", 
  "passport-jwt": "^4.0.1",
  "bcrypt": "^5.1.0",
  "@types/bcrypt": "^5.0.0"
}
```

### Required Packages (Frontend)
```json
{
  "@angular/forms": "^17.0.0"
}
```

### Environment Variables
```
JWT_SECRET=<generate-secure-secret>
JWT_EXPIRES_IN=1h
DB_HOST=localhost
DB_PORT=5432
DB_NAME=app1_db
DB_USER=app1_user
DB_PASSWORD=<secure-password>
```

This implementation plan provides a structured approach to transforming the Cosmic Candy Factory into a full-stack application with user management and persistent game state, while maintaining the existing gameplay experience.