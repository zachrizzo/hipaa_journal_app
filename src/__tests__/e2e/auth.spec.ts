import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should redirect to login page when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/.*login/)
    await expect(page.locator('h2')).toContainText('HIPAA Journal')
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/auth/login')
    
    const submitButton = page.getByRole('button', { name: /sign in/i })
    await submitButton.click()
    
    // HTML5 validation should prevent submission
    const emailInput = page.getByPlaceholder('Email address')
    const isInvalid = await emailInput.evaluate((input: HTMLInputElement) => !input.checkValidity())
    expect(isInvalid).toBe(true)
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login')
    
    await page.fill('[placeholder="Email address"]', 'invalid@example.com')
    await page.fill('[placeholder="Password"]', 'wrongpassword')
    
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Invalid email or password')).toBeVisible()
  })

  test('should handle loading state during login', async ({ page }) => {
    await page.goto('/auth/login')
    
    await page.fill('[placeholder="Email address"]', 'test@example.com')
    await page.fill('[placeholder="Password"]', 'password123')
    
    // Mock slow response
    await page.route('**/api/auth/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      route.continue()
    })
    
    const submitButton = page.getByRole('button', { name: /sign in/i })
    await submitButton.click()
    
    await expect(page.locator('text=Signing in...')).toBeVisible()
  })

  test('should disable form inputs during submission', async ({ page }) => {
    await page.goto('/auth/login')
    
    await page.fill('[placeholder="Email address"]', 'test@example.com')
    await page.fill('[placeholder="Password"]', 'password123')
    
    // Mock slow response
    await page.route('**/api/auth/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      route.continue()
    })
    
    const submitButton = page.getByRole('button', { name: /sign in/i })
    await submitButton.click()
    
    const emailInput = page.getByPlaceholder('Email address')
    const passwordInput = page.getByPlaceholder('Password')
    
    await expect(emailInput).toBeDisabled()
    await expect(passwordInput).toBeDisabled()
    await expect(submitButton).toBeDisabled()
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth/login')
    
    await page.fill('[placeholder="Email address"]', 'invalid-email')
    await page.fill('[placeholder="Password"]', 'password123')
    
    const submitButton = page.getByRole('button', { name: /sign in/i })
    await submitButton.click()
    
    const emailInput = page.getByPlaceholder('Email address')
    const isInvalid = await emailInput.evaluate((input: HTMLInputElement) => !input.checkValidity())
    expect(isInvalid).toBe(true)
  })

  test('should have secure form attributes', async ({ page }) => {
    await page.goto('/auth/login')
    
    const passwordInput = page.getByPlaceholder('Password')
    const type = await passwordInput.getAttribute('type')
    const autocomplete = await passwordInput.getAttribute('autocomplete')
    
    expect(type).toBe('password')
    expect(autocomplete).toBe('current-password')
  })

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/auth/login')
    
    const emailInput = page.getByPlaceholder('Email address')
    const passwordInput = page.getByPlaceholder('Password')
    
    // Check for proper labels
    const emailLabel = await emailInput.getAttribute('aria-label') || await emailInput.evaluate(() => {
      const label = document.querySelector('label[for="email"]')
      return label?.textContent
    })
    
    const passwordLabel = await passwordInput.getAttribute('aria-label') || await passwordInput.evaluate(() => {
      const label = document.querySelector('label[for="password"]')  
      return label?.textContent
    })
    
    expect(emailLabel).toBeTruthy()
    expect(passwordLabel).toBeTruthy()
  })
})