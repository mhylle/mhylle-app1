import { test, expect, Page } from '@playwright/test';

// Test credentials
const TEST_CREDENTIALS = {
  email: 'admin@mhylle.com',
  password: 'Admin123!'
};

// Test configuration
const TIMEOUTS = {
  NAVIGATION: 30000,
  LOGIN_MODAL: 10000,
  AUTH_RESPONSE: 15000,
  UI_UPDATE: 5000
};

// Helper function to wait for authentication state changes
async function waitForAuthStateChange(page: Page, expectedState: 'authenticated' | 'unauthenticated', timeout = TIMEOUTS.AUTH_RESPONSE) {
  await page.waitForFunction(
    (state) => {
      const userWelcome = document.querySelector('.welcome');
      const loginBtn = document.querySelector('.login-btn');
      
      if (state === 'authenticated') {
        return userWelcome && userWelcome.textContent?.includes('👋');
      } else {
        return loginBtn && !userWelcome;
      }
    },
    expectedState,
    { timeout }
  );
}

// Helper function to check for network errors
async function checkForNetworkErrors(page: Page) {
  const networkErrors: string[] = [];
  
  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push(`${response.status()} ${response.url()}`);
    }
  });
  
  page.on('requestfailed', request => {
    networkErrors.push(`Failed: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  return networkErrors;
}

test.describe('Authentication System', () => {
  test.beforeEach(async ({ page }) => {
    // Set up network monitoring
    await checkForNetworkErrors(page);
    
    // Navigate to the candy factory page
    await page.goto('/candy-factory', { waitUntil: 'networkidle', timeout: TIMEOUTS.NAVIGATION });
    
    // Ensure page is loaded
    await expect(page.locator('h1')).toContainText('🍭 Cosmic Candy Factory');
  });

  test('should display login button when not authenticated', async ({ page }) => {
    // Verify login button is visible and properly positioned
    const loginButton = page.locator('button.login-btn');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toContainText('🔑 Login to Save Progress');
    
    // Check that user controls show offline status
    const offlineStatus = page.locator('.offline-status');
    await expect(offlineStatus).toBeVisible();
    await expect(offlineStatus).toContainText('Playing offline - progress saved locally');
    
    // Verify sync/logout buttons are not visible
    await expect(page.locator('.sync-btn')).not.toBeVisible();
    await expect(page.locator('.logout-btn')).not.toBeVisible();
    await expect(page.locator('.welcome')).not.toBeVisible();
  });

  test('should position login button correctly with other game buttons', async ({ page }) => {
    // Check that login button is positioned alongside other game action buttons
    const gameActions = page.locator('.game-actions');
    await expect(gameActions).toBeVisible();
    
    // Verify all expected buttons are present in game actions
    await expect(gameActions.locator('button.login-btn')).toBeVisible();
    await expect(gameActions.locator('button.achievement-btn')).toBeVisible();
    await expect(gameActions.locator('button.reset-btn')).toBeVisible();
    
    // Verify buttons are clickable and not overlapping
    const loginBtn = gameActions.locator('button.login-btn');
    const achievementBtn = gameActions.locator('button.achievement-btn');
    const resetBtn = gameActions.locator('button.reset-btn');
    
    await expect(loginBtn).toBeEnabled();
    await expect(achievementBtn).toBeEnabled();
    await expect(resetBtn).toBeEnabled();
  });

  test('should open login modal when login button is clicked', async ({ page }) => {
    // Click the login button
    const loginButton = page.locator('button.login-btn');
    await loginButton.click();
    
    // Wait for login modal to appear
    const loginModal = page.locator('.login-modal');
    await expect(loginModal).toBeVisible({ timeout: TIMEOUTS.LOGIN_MODAL });
    
    // Verify modal content
    await expect(loginModal.locator('h2')).toContainText('🍭 Cosmic Candy Factory Login');
    
    // Check form fields are present and have correct placeholders/values
    const emailInput = loginModal.locator('input[type="email"]');
    const passwordInput = loginModal.locator('input[type="password"]');
    const submitButton = loginModal.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('placeholder', 'admin@mhylle.com');
    await expect(emailInput).toHaveValue('admin@mhylle.com'); // Pre-filled
    
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('placeholder', 'Admin123!');
    await expect(passwordInput).toHaveValue('Admin123!'); // Pre-filled
    
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText('Login');
    
    // Verify demo credentials are displayed
    const demoCredentials = loginModal.locator('.demo-credentials');
    await expect(demoCredentials).toBeVisible();
    await expect(demoCredentials).toContainText('admin@mhylle.com');
    await expect(demoCredentials).toContainText('Admin123!');
  });

  test('should successfully authenticate with demo credentials', async ({ page }) => {
    const networkErrors = await checkForNetworkErrors(page);
    
    // Click login button to open modal
    await page.locator('button.login-btn').click();
    
    // Wait for modal to be visible
    const loginModal = page.locator('.login-modal');
    await expect(loginModal).toBeVisible({ timeout: TIMEOUTS.LOGIN_MODAL });
    
    // Verify credentials are pre-filled (they should be based on the component)
    const emailInput = loginModal.locator('input[type="email"]');
    const passwordInput = loginModal.locator('input[type="password"]');
    
    await expect(emailInput).toHaveValue(TEST_CREDENTIALS.email);
    await expect(passwordInput).toHaveValue(TEST_CREDENTIALS.password);
    
    // Submit the login form
    const submitButton = loginModal.locator('button[type="submit"]');
    await submitButton.click();
    
    // Wait for authentication to complete (modal should close)
    await expect(loginModal).toBeHidden({ timeout: TIMEOUTS.AUTH_RESPONSE });
    
    // Verify no 404 errors occurred during authentication
    if (networkErrors.length > 0) {
      const authErrors = networkErrors.filter(error => error.includes('404') && error.includes('auth'));
      expect(authErrors, `Authentication should not produce 404 errors: ${authErrors.join(', ')}`).toHaveLength(0);
    }
    
    // Wait for authentication state to update
    await waitForAuthStateChange(page, 'authenticated');
    
    // Verify user is now authenticated - check for welcome message
    const welcomeMessage = page.locator('.welcome');
    await expect(welcomeMessage).toBeVisible();
    await expect(welcomeMessage).toContainText('👋');
    
    // The user's first name should be displayed (assuming "admin" user has a firstName)
    // This will depend on the actual user data returned by the auth service
    await expect(welcomeMessage).toContainText(/👋\s+\w+/); // 👋 followed by a name
  });

  test('should display sync and logout buttons after successful login', async ({ page }) => {
    // Perform login first
    await page.locator('button.login-btn').click();
    await expect(page.locator('.login-modal')).toBeVisible();
    await page.locator('.login-modal button[type="submit"]').click();
    await expect(page.locator('.login-modal')).toBeHidden({ timeout: TIMEOUTS.AUTH_RESPONSE });
    
    // Wait for authentication state to update
    await waitForAuthStateChange(page, 'authenticated');
    
    // Verify sync button is visible and functional
    const syncButton = page.locator('button.sync-btn');
    await expect(syncButton).toBeVisible();
    await expect(syncButton).toContainText('🔄 Sync');
    await expect(syncButton).toBeEnabled();
    
    // Verify logout button is visible and functional
    const logoutButton = page.locator('button.logout-btn');
    await expect(logoutButton).toBeVisible();
    await expect(logoutButton).toContainText('Logout');
    await expect(logoutButton).toBeEnabled();
    
    // Verify login button is no longer visible
    await expect(page.locator('button.login-btn')).not.toBeVisible();
    
    // Verify offline status is no longer visible
    await expect(page.locator('.offline-status')).not.toBeVisible();
  });

  test('should test sync functionality when authenticated', async ({ page }) => {
    // Perform login first
    await page.locator('button.login-btn').click();
    await expect(page.locator('.login-modal')).toBeVisible();
    await page.locator('.login-modal button[type="submit"]').click();
    await expect(page.locator('.login-modal')).toBeHidden({ timeout: TIMEOUTS.AUTH_RESPONSE });
    
    // Wait for authentication
    await waitForAuthStateChange(page, 'authenticated');
    
    // Test sync functionality
    const syncButton = page.locator('button.sync-btn');
    await expect(syncButton).toBeVisible();
    
    // Click sync button
    await syncButton.click();
    
    // Verify loading state
    await expect(syncButton).toContainText('⏳ Syncing...');
    await expect(syncButton).toBeDisabled();
    
    // Wait for sync to complete (should return to normal state)
    await expect(syncButton).toContainText('🔄 Sync', { timeout: TIMEOUTS.AUTH_RESPONSE });
    await expect(syncButton).toBeEnabled();
  });

  test('should successfully logout and return to unauthenticated state', async ({ page }) => {
    // Perform login first
    await page.locator('button.login-btn').click();
    await expect(page.locator('.login-modal')).toBeVisible();
    await page.locator('.login-modal button[type="submit"]').click();
    await expect(page.locator('.login-modal')).toBeHidden({ timeout: TIMEOUTS.AUTH_RESPONSE });
    
    // Wait for authentication
    await waitForAuthStateChange(page, 'authenticated');
    
    // Click logout button
    const logoutButton = page.locator('button.logout-btn');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();
    
    // Wait for logout to complete
    await waitForAuthStateChange(page, 'unauthenticated');
    
    // Verify we're back to unauthenticated state
    await expect(page.locator('button.login-btn')).toBeVisible();
    await expect(page.locator('.offline-status')).toBeVisible();
    await expect(page.locator('.welcome')).not.toBeVisible();
    await expect(page.locator('button.sync-btn')).not.toBeVisible();
    await expect(page.locator('button.logout-btn')).not.toBeVisible();
  });

  test('should handle authentication errors gracefully', async ({ page }) => {
    // Click login button to open modal
    await page.locator('button.login-btn').click();
    await expect(page.locator('.login-modal')).toBeVisible();
    
    // Enter invalid credentials
    const loginModal = page.locator('.login-modal');
    const emailInput = loginModal.locator('input[type="email"]');
    const passwordInput = loginModal.locator('input[type="password"]');
    
    await emailInput.clear();
    await emailInput.fill('invalid@example.com');
    await passwordInput.clear();
    await passwordInput.fill('wrongpassword');
    
    // Submit form
    await loginModal.locator('button[type="submit"]').click();
    
    // Wait for error message to appear
    const errorMessage = loginModal.locator('.error');
    await expect(errorMessage).toBeVisible({ timeout: TIMEOUTS.AUTH_RESPONSE });
    
    // Modal should still be visible (not closed on error)
    await expect(loginModal).toBeVisible();
    
    // Should still be in unauthenticated state
    await expect(page.locator('.offline-status')).toBeVisible();
  });

  test('should verify no 404 errors during authentication flow', async ({ page }) => {
    const networkErrors: string[] = [];
    
    // Monitor network requests
    page.on('response', response => {
      if (response.status() === 404) {
        networkErrors.push(`404: ${response.url()}`);
      }
    });
    
    page.on('requestfailed', request => {
      networkErrors.push(`Failed: ${request.url()} - ${request.failure()?.errorText}`);
    });
    
    // Perform complete authentication flow
    await page.locator('button.login-btn').click();
    await expect(page.locator('.login-modal')).toBeVisible();
    await page.locator('.login-modal button[type="submit"]').click();
    await expect(page.locator('.login-modal')).toBeHidden({ timeout: TIMEOUTS.AUTH_RESPONSE });
    
    // Wait a bit for any delayed requests
    await page.waitForTimeout(2000);
    
    // Verify no 404 errors occurred
    const authRelatedErrors = networkErrors.filter(error => 
      error.includes('auth') || error.includes('login') || error.includes('validate')
    );
    
    expect(authRelatedErrors, `Authentication should not produce network errors: ${authRelatedErrors.join(', ')}`).toHaveLength(0);
  });

  test('should maintain authentication across page refreshes', async ({ page }) => {
    // Perform login first
    await page.locator('button.login-btn').click();
    await expect(page.locator('.login-modal')).toBeVisible();
    await page.locator('.login-modal button[type="submit"]').click();
    await expect(page.locator('.login-modal')).toBeHidden({ timeout: TIMEOUTS.AUTH_RESPONSE });
    
    // Wait for authentication
    await waitForAuthStateChange(page, 'authenticated');
    
    // Refresh the page
    await page.reload({ waitUntil: 'networkidle' });
    
    // Should automatically validate session and remain authenticated
    await expect(page.locator('.welcome')).toBeVisible({ timeout: TIMEOUTS.AUTH_RESPONSE });
    await expect(page.locator('button.sync-btn')).toBeVisible();
    await expect(page.locator('button.logout-btn')).toBeVisible();
    await expect(page.locator('button.login-btn')).not.toBeVisible();
  });

  test('should validate auth service integration with proper URLs', async ({ page }) => {
    const requestUrls: string[] = [];
    
    // Monitor auth-related requests
    page.on('request', request => {
      const url = request.url();
      if (url.includes('auth') || url.includes('login') || url.includes('validate')) {
        requestUrls.push(url);
      }
    });
    
    // Perform login
    await page.locator('button.login-btn').click();
    await expect(page.locator('.login-modal')).toBeVisible();
    await page.locator('.login-modal button[type="submit"]').click();
    await expect(page.locator('.login-modal')).toBeHidden({ timeout: TIMEOUTS.AUTH_RESPONSE });
    
    // Wait for requests to complete
    await page.waitForTimeout(2000);
    
    // Verify auth requests are using correct URLs (not localhost:4200 proxy)
    const loginRequests = requestUrls.filter(url => url.includes('login'));
    const validateRequests = requestUrls.filter(url => url.includes('validate'));
    
    expect(loginRequests.length, 'Should have login requests').toBeGreaterThan(0);
    
    // Verify requests are going to correct auth service endpoint
    loginRequests.forEach(url => {
      expect(url, 'Login requests should go to auth service').toContain('localhost:8081/api/auth/login');
    });
    
    if (validateRequests.length > 0) {
      validateRequests.forEach(url => {
        expect(url, 'Validate requests should go to auth service').toContain('localhost:8081/api/auth/validate');
      });
    }
  });
});