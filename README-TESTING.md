# Authentication Testing with Playwright

This directory contains comprehensive end-to-end tests for the Cosmic Candy Factory authentication system using Playwright.

## Overview

The tests verify the complete authentication flow including:
- Login button visibility and positioning
- Login modal functionality  
- Authentication with demo credentials
- User state changes after login
- Sync functionality
- Logout functionality
- Error handling
- Network request verification
- Session persistence

## Fixed Issues

The authentication system now uses the correct URL configuration:
- **Auth Service URL**: `http://localhost:8081/api/auth/login` (direct connection)
- **Previous Issue**: Requests were going through localhost:4200 proxy causing 404 errors
- **Resolution**: AuthService now makes direct requests to the auth service

## Test Structure

```
tests/
├── auth.spec.ts                 # Comprehensive authentication tests
├── auth-streamlined.spec.ts     # Streamlined test suite with helpers
└── helpers/
    └── auth.helpers.ts          # Reusable test helper functions
```

## Prerequisites

1. **Install Dependencies**:
   ```bash
   npm install
   npm run install:playwright
   ```

2. **Start Required Services**:
   ```bash
   # Terminal 1: Start frontend dev server
   cd frontend
   npm run start
   
   # Terminal 2: Start auth service (if not running)
   # Make sure auth service is available at localhost:8081
   ```

3. **Verify Services**:
   - Frontend: http://localhost:4200/candy-factory
   - Auth Service: http://localhost:8081/api/auth/validate

## Running Tests

### Run All Authentication Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm run test:auth
# or
npx playwright test auth
```

### Run Tests with UI
```bash
npm run test:ui
```

### Run Tests in Headed Mode (See Browser)
```bash
npm run test:headed
```

### Debug Tests
```bash
npm run test:debug
```

### View Test Reports
```bash
npm run test:report
```

## Test Coverage

### 1. Initial State Verification
- Login button visibility and text
- Offline status display
- Absence of authenticated elements

### 2. Login Modal Testing
- Modal opens on button click
- Form fields are pre-filled with demo credentials
- Modal structure and styling
- Demo credentials display

### 3. Authentication Flow
- Successful login with demo credentials
- No 404 errors during authentication
- Proper user state changes
- User name display

### 4. Authenticated State
- Welcome message with user name
- Sync button functionality
- Logout button availability
- Login button hiding

### 5. Sync Functionality
- Sync button behavior
- Loading states
- Success indication

### 6. Logout Testing
- Logout functionality
- Return to unauthenticated state
- UI element visibility changes

### 7. Error Handling
- Invalid credentials handling
- Error message display
- Modal persistence on error

### 8. Network Verification
- No 404 errors during auth flow
- Correct auth service URLs used
- No proxy routing issues

### 9. Session Persistence
- Authentication maintained across refreshes
- Automatic session validation

## Demo Credentials

The tests use the following credentials:
- **Email**: admin@mhylle.com
- **Password**: Admin123!

These are pre-filled in the login form for demo purposes.

## Key Test Points

### Authentication URL Fix
The major fix addressed in these tests:
- **Problem**: Auth requests were going to `localhost:4200/api/auth/login` (404 error)
- **Solution**: Direct requests to `http://localhost:8081/api/auth/login`
- **Verification**: Tests monitor network requests to ensure correct URLs

### UI State Management
Tests verify proper state transitions:
```
Unauthenticated → Login Modal → Authenticated → Logout → Unauthenticated
```

### Network Monitoring
All tests include network monitoring to catch:
- 404 errors
- Failed requests
- Incorrect URL routing
- Authentication-related network issues

## Helper Functions

The `auth.helpers.ts` file provides reusable functions:
- `performLogin()` - Complete login flow
- `verifyAuthenticatedState()` - Check authenticated UI
- `verifyUnauthenticatedState()` - Check unauthenticated UI
- `setupNetworkMonitoring()` - Monitor network requests
- `waitForAuthState()` - Wait for authentication changes

## Debugging

### View Screenshots
Test failures automatically capture screenshots in `test-results/`

### Network Request Logging
Tests log all auth-related network requests for debugging:
```javascript
console.log('Auth requests made:', authRequests);
```

### Manual Debugging
Run tests with `--debug` flag to step through manually:
```bash
npx playwright test --debug auth
```

## Continuous Integration

The tests are configured for CI environments:
- Retry failed tests 2 times
- Run in parallel (configurable)
- Generate HTML, JSON, and JUnit reports
- Capture videos and traces on failure

## Configuration Files

- `playwright.config.ts` - Main Playwright configuration
- `package.json` - Test dependencies and scripts
- `tsconfig.json` - TypeScript configuration for tests

## Expected Results

When all tests pass, you should see:
```
✅ Full authentication flow completed successfully
✅ Authentication persisted across page refresh  
✅ Authentication error handling works correctly
✅ User name displayed correctly: 👋 Admin
✅ Auth service URLs are correctly configured
✅ Complete UI state transitions verified
```

## Troubleshooting

### Common Issues

1. **Auth Service Not Running**:
   - Ensure auth service is available at localhost:8081
   - Check service health: `curl http://localhost:8081/api/auth/validate`

2. **Frontend Not Started**:
   - Start dev server: `cd frontend && npm run start`
   - Verify at: http://localhost:4200/candy-factory

3. **Port Conflicts**:
   - Ensure ports 4200 and 8081 are available
   - Check for other services using these ports

4. **Test Timeouts**:
   - Increase timeouts in `playwright.config.ts`
   - Check network connectivity and service response times

### Debugging Commands

```bash
# Check if services are running
curl http://localhost:4200/candy-factory
curl http://localhost:8081/api/auth/validate

# Run single test with full logging
npx playwright test auth --headed --project=chromium

# Generate and view report
npx playwright test && npm run test:report
```

## Support

If tests fail, check:
1. Service availability (frontend + auth service)
2. Network connectivity
3. Port availability
4. Test logs and screenshots in `test-results/`