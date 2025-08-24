import { Page, expect } from '@playwright/test';

export interface AuthCredentials {
  email: string;
  password: string;
}

export const DEFAULT_TEST_CREDENTIALS: AuthCredentials = {
  email: 'admin@mhylle.com',
  password: 'Admin123!'
};

export const TIMEOUTS = {
  NAVIGATION: 30000,
  LOGIN_MODAL: 10000,
  AUTH_RESPONSE: 15000,
  UI_UPDATE: 5000,
  NETWORK_IDLE: 3000
};

/**
 * Helper class for authentication-related test operations
 */
export class AuthTestHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to the candy factory page and wait for it to load
   */
  async navigateToCandyFactory(): Promise<void> {
    await this.page.goto('/candy-factory', { 
      waitUntil: 'networkidle', 
      timeout: TIMEOUTS.NAVIGATION 
    });
    
    // Ensure page is loaded
    await expect(this.page.locator('h1')).toContainText('🍭 Cosmic Candy Factory');
  }

  /**
   * Wait for authentication state changes
   */
  async waitForAuthState(expectedState: 'authenticated' | 'unauthenticated', timeout = TIMEOUTS.AUTH_RESPONSE): Promise<void> {
    await this.page.waitForFunction(
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

  /**
   * Monitor network requests and capture errors
   */
  setupNetworkMonitoring(): { getErrors: () => string[] } {
    const networkErrors: string[] = [];
    
    this.page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.status()}: ${response.url()}`);
      }
    });
    
    this.page.on('requestfailed', request => {
      networkErrors.push(`Failed: ${request.url()} - ${request.failure()?.errorText}`);
    });
    
    return {
      getErrors: () => networkErrors
    };
  }

  /**
   * Monitor auth-related requests
   */
  setupAuthRequestMonitoring(): { getAuthRequests: () => string[] } {
    const authRequests: string[] = [];
    
    this.page.on('request', request => {
      const url = request.url();
      if (url.includes('auth') || url.includes('login') || url.includes('validate') || url.includes('logout')) {
        authRequests.push(url);
      }
    });
    
    return {
      getAuthRequests: () => authRequests
    };
  }

  /**
   * Open the login modal
   */
  async openLoginModal(): Promise<void> {
    const loginButton = this.page.locator('button.login-btn');
    await expect(loginButton).toBeVisible();
    await loginButton.click();
    
    const loginModal = this.page.locator('.login-modal');
    await expect(loginModal).toBeVisible({ timeout: TIMEOUTS.LOGIN_MODAL });
  }

  /**
   * Fill login credentials in the modal
   */
  async fillLoginCredentials(credentials: AuthCredentials = DEFAULT_TEST_CREDENTIALS): Promise<void> {
    const loginModal = this.page.locator('.login-modal');
    await expect(loginModal).toBeVisible();
    
    const emailInput = loginModal.locator('input[type="email"]');
    const passwordInput = loginModal.locator('input[type="password"]');
    
    await emailInput.clear();
    await emailInput.fill(credentials.email);
    await passwordInput.clear();
    await passwordInput.fill(credentials.password);
  }

  /**
   * Submit the login form
   */
  async submitLoginForm(): Promise<void> {
    const loginModal = this.page.locator('.login-modal');
    const submitButton = loginModal.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
  }

  /**
   * Perform complete login flow
   */
  async performLogin(credentials: AuthCredentials = DEFAULT_TEST_CREDENTIALS): Promise<void> {
    await this.openLoginModal();
    
    // Check if credentials are pre-filled (they should be for demo)
    const emailInput = this.page.locator('.login-modal input[type="email"]');
    const emailValue = await emailInput.inputValue();
    
    if (emailValue !== credentials.email) {
      await this.fillLoginCredentials(credentials);
    }
    
    await this.submitLoginForm();
    await expect(this.page.locator('.login-modal')).toBeHidden({ timeout: TIMEOUTS.AUTH_RESPONSE });
    await this.waitForAuthState('authenticated');
  }

  /**
   * Perform logout
   */
  async performLogout(): Promise<void> {
    const logoutButton = this.page.locator('button.logout-btn');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();
    
    await this.waitForAuthState('unauthenticated');
  }

  /**
   * Verify authenticated state
   */
  async verifyAuthenticatedState(): Promise<void> {
    // Check for welcome message
    const welcomeMessage = this.page.locator('.welcome');
    await expect(welcomeMessage).toBeVisible();
    await expect(welcomeMessage).toContainText('👋');
    
    // Check for sync and logout buttons
    await expect(this.page.locator('button.sync-btn')).toBeVisible();
    await expect(this.page.locator('button.logout-btn')).toBeVisible();
    
    // Verify login button is not visible
    await expect(this.page.locator('button.login-btn')).not.toBeVisible();
    await expect(this.page.locator('.offline-status')).not.toBeVisible();
  }

  /**
   * Verify unauthenticated state
   */
  async verifyUnauthenticatedState(): Promise<void> {
    // Check for login button
    await expect(this.page.locator('button.login-btn')).toBeVisible();
    await expect(this.page.locator('button.login-btn')).toContainText('🔑 Login to Save Progress');
    
    // Check for offline status
    await expect(this.page.locator('.offline-status')).toBeVisible();
    await expect(this.page.locator('.offline-status')).toContainText('Playing offline - progress saved locally');
    
    // Verify authenticated elements are not visible
    await expect(this.page.locator('.welcome')).not.toBeVisible();
    await expect(this.page.locator('button.sync-btn')).not.toBeVisible();
    await expect(this.page.locator('button.logout-btn')).not.toBeVisible();
  }

  /**
   * Verify login modal structure and content
   */
  async verifyLoginModalStructure(): Promise<void> {
    const loginModal = this.page.locator('.login-modal');
    await expect(loginModal).toBeVisible();
    
    // Verify header
    await expect(loginModal.locator('h2')).toContainText('🍭 Cosmic Candy Factory Login');
    
    // Verify form fields
    const emailInput = loginModal.locator('input[type="email"]');
    const passwordInput = loginModal.locator('input[type="password"]');
    const submitButton = loginModal.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('placeholder', 'admin@mhylle.com');
    
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('placeholder', 'Admin123!');
    
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText('Login');
    
    // Verify demo credentials display
    const demoCredentials = loginModal.locator('.demo-credentials');
    await expect(demoCredentials).toBeVisible();
    await expect(demoCredentials).toContainText('admin@mhylle.com');
    await expect(demoCredentials).toContainText('Admin123!');
  }

  /**
   * Test sync functionality
   */
  async testSyncFunctionality(): Promise<void> {
    const syncButton = this.page.locator('button.sync-btn');
    await expect(syncButton).toBeVisible();
    await expect(syncButton).toContainText('🔄 Sync');
    
    // Click sync
    await syncButton.click();
    
    // Verify loading state
    await expect(syncButton).toContainText('⏳ Syncing...');
    await expect(syncButton).toBeDisabled();
    
    // Wait for completion
    await expect(syncButton).toContainText('🔄 Sync', { timeout: TIMEOUTS.AUTH_RESPONSE });
    await expect(syncButton).toBeEnabled();
  }

  /**
   * Verify button positioning and layout
   */
  async verifyButtonLayout(): Promise<void> {
    const gameActions = this.page.locator('.game-actions');
    await expect(gameActions).toBeVisible();
    
    // Verify all expected buttons are present and enabled
    const buttons = {
      login: gameActions.locator('button.login-btn'),
      achievement: gameActions.locator('button.achievement-btn'),
      reset: gameActions.locator('button.reset-btn')
    };
    
    for (const [name, button] of Object.entries(buttons)) {
      if (name === 'login') {
        // Login button may not be visible if authenticated
        continue;
      }
      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();
    }
  }

  /**
   * Verify no authentication-related network errors
   */
  async verifyNoAuthErrors(networkErrors: string[]): Promise<void> {
    const authErrors = networkErrors.filter(error => 
      (error.includes('404') || error.includes('Failed')) && 
      (error.includes('auth') || error.includes('login') || error.includes('validate'))
    );
    
    expect(authErrors, `Authentication should not produce errors: ${authErrors.join(', ')}`).toHaveLength(0);
  }

  /**
   * Verify auth service integration uses correct URLs
   */
  async verifyAuthServiceUrls(authRequests: string[]): Promise<void> {
    const loginRequests = authRequests.filter(url => url.includes('login'));
    const validateRequests = authRequests.filter(url => url.includes('validate'));
    
    // Should have auth requests
    expect(authRequests.length, 'Should have auth-related requests').toBeGreaterThan(0);
    
    // Verify URLs point to correct auth service
    loginRequests.forEach(url => {
      expect(url, 'Login requests should use correct auth service URL').toContain('localhost:8081/api/auth/login');
    });
    
    validateRequests.forEach(url => {
      expect(url, 'Validate requests should use correct auth service URL').toContain('localhost:8081/api/auth/validate');
    });
  }

  /**
   * Wait for network activity to settle
   */
  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForTimeout(TIMEOUTS.NETWORK_IDLE);
  }

  /**
   * Take screenshot for debugging
   */
  async takeDebugScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ 
      path: `test-results/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }
}