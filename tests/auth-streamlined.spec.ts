import { test, expect } from '@playwright/test';
import { AuthTestHelpers, DEFAULT_TEST_CREDENTIALS } from './helpers/auth.helpers';

test.describe('Authentication System - Streamlined Tests', () => {
  let authHelpers: AuthTestHelpers;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthTestHelpers(page);
    await authHelpers.navigateToCandyFactory();
  });

  test('should complete full authentication flow without 404 errors', async ({ page }) => {
    // Set up monitoring
    const networkMonitor = authHelpers.setupNetworkMonitoring();
    const authRequestMonitor = authHelpers.setupAuthRequestMonitoring();
    
    // 1. Verify initial unauthenticated state
    await authHelpers.verifyUnauthenticatedState();
    
    // 2. Verify login button positioning with other buttons
    await authHelpers.verifyButtonLayout();
    
    // 3. Open login modal and verify structure
    await authHelpers.openLoginModal();
    await authHelpers.verifyLoginModalStructure();
    
    // 4. Perform login with demo credentials
    await authHelpers.submitLoginForm(); // Credentials are pre-filled
    
    // 5. Verify successful authentication
    await authHelpers.verifyAuthenticatedState();
    
    // 6. Test sync functionality
    await authHelpers.testSyncFunctionality();
    
    // 7. Wait for all network activity to settle
    await authHelpers.waitForNetworkIdle();
    
    // 8. Verify no authentication-related network errors
    await authHelpers.verifyNoAuthErrors(networkMonitor.getErrors());
    
    // 9. Verify auth requests use correct URLs
    await authHelpers.verifyAuthServiceUrls(authRequestMonitor.getAuthRequests());
    
    // 10. Test logout functionality
    await authHelpers.performLogout();
    await authHelpers.verifyUnauthenticatedState();
    
    console.log('✅ Full authentication flow completed successfully');
  });

  test('should maintain authentication across page refreshes', async ({ page }) => {
    // Perform login
    await authHelpers.performLogin();
    await authHelpers.verifyAuthenticatedState();
    
    // Refresh the page
    await page.reload({ waitUntil: 'networkidle' });
    
    // Should automatically validate session and remain authenticated
    await authHelpers.verifyAuthenticatedState();
    
    console.log('✅ Authentication persisted across page refresh');
  });

  test('should handle authentication errors gracefully', async ({ page }) => {
    // Open login modal
    await authHelpers.openLoginModal();
    
    // Enter invalid credentials
    await authHelpers.fillLoginCredentials({
      email: 'invalid@example.com',
      password: 'wrongpassword'
    });
    
    // Submit form
    await authHelpers.submitLoginForm();
    
    // Wait for error message
    const loginModal = page.locator('.login-modal');
    const errorMessage = loginModal.locator('.error');
    await expect(errorMessage).toBeVisible({ timeout: 15000 });
    
    // Modal should still be visible (not closed on error)
    await expect(loginModal).toBeVisible();
    
    // Should still be in unauthenticated state
    await authHelpers.verifyUnauthenticatedState();
    
    console.log('✅ Authentication error handling works correctly');
  });

  test('should verify user name display after login', async ({ page }) => {
    const networkMonitor = authHelpers.setupNetworkMonitoring();
    
    // Perform login
    await authHelpers.performLogin();
    
    // Verify user name is displayed
    const welcomeMessage = page.locator('.welcome');
    await expect(welcomeMessage).toBeVisible();
    
    // The welcome message should contain the user's first name
    // Based on the component, it should show "👋 {firstName}"
    const welcomeText = await welcomeMessage.textContent();
    expect(welcomeText, 'Welcome message should contain user name').toMatch(/👋\s+\w+/);
    
    // Verify no errors during name display
    await authHelpers.verifyNoAuthErrors(networkMonitor.getErrors());
    
    console.log(`✅ User name displayed correctly: ${welcomeText}`);
  });

  test('should verify auth service URL configuration', async ({ page }) => {
    const authRequestMonitor = authHelpers.setupAuthRequestMonitoring();
    
    // Perform login to trigger auth requests
    await authHelpers.performLogin();
    
    // Wait for any additional validation requests
    await authHelpers.waitForNetworkIdle();
    
    // Verify auth service URLs
    const authRequests = authRequestMonitor.getAuthRequests();
    console.log('Auth requests made:', authRequests);
    
    // Verify we have auth requests
    expect(authRequests.length, 'Should have made auth requests').toBeGreaterThan(0);
    
    // Verify no requests went to the problematic localhost:4200 proxy
    const proxyRequests = authRequests.filter(url => 
      url.includes('localhost:4200') && url.includes('auth')
    );
    expect(proxyRequests, 'Should not use localhost:4200 proxy for auth').toHaveLength(0);
    
    // Verify requests go to correct auth service
    const correctAuthRequests = authRequests.filter(url => 
      url.includes('localhost:8081/api/auth')
    );
    expect(correctAuthRequests.length, 'Should use correct auth service URL').toBeGreaterThan(0);
    
    console.log('✅ Auth service URLs are correctly configured');
  });

  test('should verify complete UI state transitions', async ({ page }) => {
    // Take initial screenshot
    await authHelpers.takeDebugScreenshot('01-initial-state');
    
    // 1. Initial state - unauthenticated
    await authHelpers.verifyUnauthenticatedState();
    
    // 2. Open login modal
    await authHelpers.openLoginModal();
    await authHelpers.takeDebugScreenshot('02-login-modal-open');
    
    // 3. Perform login
    await authHelpers.submitLoginForm();
    await authHelpers.takeDebugScreenshot('03-login-submitted');
    
    // 4. Verify authenticated state
    await authHelpers.verifyAuthenticatedState();
    await authHelpers.takeDebugScreenshot('04-authenticated-state');
    
    // 5. Test sync
    await authHelpers.testSyncFunctionality();
    await authHelpers.takeDebugScreenshot('05-after-sync');
    
    // 6. Perform logout
    await authHelpers.performLogout();
    await authHelpers.takeDebugScreenshot('06-after-logout');
    
    // 7. Verify back to unauthenticated
    await authHelpers.verifyUnauthenticatedState();
    
    console.log('✅ Complete UI state transitions verified with screenshots');
  });
});