# Plan: Add User Registration and Persistent Game State to Cosmic Candy Factory

## Overview
Transform the current client-side-only Cosmic Candy Factory game into a full-stack application with user registration and server-persisted game state.

## Phase 1: Backend - User Management & Authentication

### 1.1 Create User Entity & Database Schema
- Create `user.entity.ts` with fields:
  - id (UUID)
  - email (unique)
  - username (unique)
  - passwordHash
  - createdAt
  - updatedAt
  - isActive

### 1.2 Create Game State Entity
- Create `game-state.entity.ts` with fields matching current GameState interface
- Add userId foreign key to link game state to users
- Include all game progress fields (candy, upgrades, prestige, etc.)

### 1.3 Implement Authentication Module
- Create auth module with JWT-based authentication
- Implement endpoints:
  - POST `/api/auth/register` - User registration
  - POST `/api/auth/login` - User login with JWT token
  - POST `/api/auth/refresh` - Token refresh
  - GET `/api/auth/profile` - Get current user profile

### 1.4 Create Game Module
- Create game module for game state management
- Implement endpoints:
  - GET `/api/game/state` - Get user's game state
  - PUT `/api/game/state` - Update full game state
  - POST `/api/game/click` - Register click action
  - POST `/api/game/purchase/:upgradeId` - Purchase upgrade
  - POST `/api/game/prestige` - Perform prestige
  - POST `/api/game/reset` - Reset game progress

## Phase 2: Frontend - Authentication Integration

### 2.1 Create Registration/Login Components
- Create registration form component with email/username/password
- Update existing login component to work with new backend
- Add proper form validation and error handling

### 2.2 Update Auth Service
- Modify auth service to handle JWT tokens
- Store tokens securely (httpOnly cookies or secure storage)
- Implement automatic token refresh
- Add registration method

### 2.3 Enable Route Guards
- Re-enable AuthGuard on candy-factory route
- Redirect unauthenticated users to login
- Add logout functionality to game UI

## Phase 3: Frontend - Game State Synchronization

### 3.1 Refactor Candy Factory Service
- Replace localStorage with API calls
- Implement:
  - Load game state from server on init
  - Periodic auto-save to server (every 5-10 seconds)
  - Save on significant actions (purchases, prestige)
  - Optimistic UI updates with rollback on failure

### 3.2 Add Sync Status Indicators
- Show save status in UI (saved/saving/error)
- Add connection status indicator
- Implement retry logic for failed saves

### 3.3 Handle Offline Mode
- Cache game state locally as backup
- Queue actions when offline
- Sync when connection restored
- Resolve conflicts (server state wins)

## Phase 4: Database Migrations & Security

### 4.1 Create Database Migrations
- User table creation
- Game state table creation
- Add indexes for performance

### 4.2 Security Measures
- Implement rate limiting on game actions
- Validate all game calculations server-side
- Add anti-cheat measures (reasonable progress limits)
- Encrypt sensitive data

## Phase 5: Testing & Deployment

### 5.1 Testing
- Unit tests for auth endpoints
- Integration tests for game state sync
- E2E tests for registration/login flow

### 5.2 Environment Configuration
- Update docker-compose for new requirements
- Configure environment variables
- Update deployment pipeline

## Technical Considerations

### Data Model Changes
- Keep existing GameState interface structure
- Add userId field for ownership
- Consider adding lastModified for conflict resolution

### Performance Optimizations
- Implement differential updates (send only changed fields)
- Use WebSockets for real-time sync (future enhancement)
- Cache game state in Redis for faster reads

### Backwards Compatibility
- Provide migration path for existing localStorage data
- Allow anonymous play with option to register later
- Preserve game progress during registration

## Implementation Order
1. Backend user authentication (most critical)
2. Game state persistence endpoints
3. Frontend authentication UI
4. Game state synchronization
5. Testing and deployment updates

This plan maintains the existing game mechanics while adding proper user management and server persistence.