const { chromium } = require('playwright');

async function testLogin() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3001/login');
    await page.waitForTimeout(2000);
    
    console.log('2. Taking screenshot of login page...');
    await page.screenshot({ path: 'login-page.png', fullPage: true });
    
    console.log('3. Testing client quick login...');
    // Look for the client login button
    const clientButton = await page.locator('text=Login as Client').first();
    if (await clientButton.isVisible()) {
      await clientButton.click();
      await page.waitForTimeout(3000);
      
      // Check if we're redirected to dashboard
      const currentUrl = page.url();
      console.log('Current URL after client login:', currentUrl);
      
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/client')) {
        console.log('✅ Client login successful!');
        await page.screenshot({ path: 'client-dashboard.png', fullPage: true });
        
        // Try to sign out
        console.log('4. Signing out...');
        const signOutButton = await page.locator('text=Sign out').or(page.locator('text=Logout')).or(page.locator('[data-testid="signout"]')).first();
        if (await signOutButton.isVisible()) {
          await signOutButton.click();
          await page.waitForTimeout(2000);
        } else {
          console.log('Sign out button not found, navigating back to login...');
          await page.goto('http://localhost:3001/login');
          await page.waitForTimeout(2000);
        }
        
        console.log('5. Testing provider quick login...');
        const providerButton = await page.locator('text=Login as Provider').first();
        if (await providerButton.isVisible()) {
          await providerButton.click();
          await page.waitForTimeout(3000);
          
          const providerUrl = page.url();
          console.log('Current URL after provider login:', providerUrl);
          
          if (providerUrl.includes('/dashboard') || providerUrl.includes('/provider')) {
            console.log('✅ Provider login successful!');
            await page.screenshot({ path: 'provider-dashboard.png', fullPage: true });
          } else {
            console.log('❌ Provider login failed - not redirected to dashboard');
          }
        } else {
          console.log('❌ Provider login button not found');
        }
        
      } else {
        console.log('❌ Client login failed - not redirected to dashboard');
        await page.screenshot({ path: 'client-login-failed.png', fullPage: true });
      }
    } else {
      console.log('❌ Client login button not found');
    }
    
  } catch (error) {
    console.error('Error during testing:', error);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testLogin().catch(console.error);