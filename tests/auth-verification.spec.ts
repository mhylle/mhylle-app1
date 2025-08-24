import { test, expect } from '@playwright/test';

test.describe('Authentication Verification', () => {
  test('should verify authentication system is working correctly', async ({ page }) => {
    const networkErrors: string[] = [];
    const authRequests: string[] = [];
    
    // Monitor network requests
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.status()}: ${response.url()}`);
      }
    });
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('auth')) {
        authRequests.push(url);
      }
    });
    
    // Navigate to candy factory
    await page.goto('/candy-factory', { waitUntil: 'networkidle' });
    
    // Verify initial state
    await expect(page.locator('h1')).toContainText('🍭 Cosmic Candy Factory');
    await expect(page.locator('button.login-btn')).toBeVisible();
    await expect(page.locator('button.login-btn')).toContainText('🔑 Login to Save Progress');
    
    // Open login modal
    await page.locator('button.login-btn').click();
    await expect(page.locator('.login-modal')).toBeVisible();
    
    // Verify modal structure
    await expect(page.locator('.login-modal h2')).toContainText('🍭 Cosmic Candy Factory Login');
    await expect(page.locator('.login-modal input[type="email"]')).toHaveValue('admin@mhylle.com');
    await expect(page.locator('.login-modal input[type="password"]')).toHaveValue('Admin123!');
    
    // Submit login (credentials are pre-filled)
    await page.locator('.login-modal button[type="submit"]').click();
    
    // Wait for modal to close and authentication to complete
    await expect(page.locator('.login-modal')).toBeHidden({ timeout: 15000 });
    
    // Verify authenticated state
    await expect(page.locator('.welcome')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.welcome')).toContainText('👋');
    await expect(page.locator('button.sync-btn')).toBeVisible();
    await expect(page.locator('button.logout-btn')).toBeVisible();
    await expect(page.locator('button.login-btn')).not.toBeVisible();
    
    // Wait for any additional network activity
    await page.waitForTimeout(2000);
    
    // Verify no authentication errors
    const authErrors = networkErrors.filter(error => 
      error.includes('auth') || error.includes('login')
    );
    
    console.log('Auth requests made:', authRequests);
    console.log('Network errors:', networkErrors);
    
    // Test logout
    await page.locator('button.logout-btn').click();
    
    // Verify back to unauthenticated state
    await expect(page.locator('button.login-btn')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.welcome')).not.toBeVisible();
    
    // Final verification
    expect(authErrors, `Should not have auth-related errors: ${authErrors.join(', ')}`).toHaveLength(0);
    expect(authRequests.length, 'Should have made auth requests').toBeGreaterThan(0);
    
    console.log('✅ Authentication system verified successfully!');
    console.log(`✅ Made ${authRequests.length} auth requests with no errors`);
    console.log('✅ Login/logout cycle completed successfully');
  });
});