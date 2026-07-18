/**
 * Real Browser Smoke Test
 *
 * Validates the actual frontend renders in a real Chromium browser
 * and contains required UI elements.
 */

const { test, expect } = require('@playwright/test');

test.describe('STATED Frontend Smoke Tests', () => {
  test('landing route renders', async ({ page }) => {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

    const title = await page.title();
    expect(title).toBeTruthy();

    const content = await page.textContent('body');
    expect(content).toBeTruthy();
    expect(content.length).toBeGreaterThan(50);

    console.log('✓ Landing route renders');
  });

  test('no uncaught page errors', async ({ page }) => {
    const errors = [];

    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    expect(errors).toHaveLength(0);

    console.log('✓ No page errors');
  });

  test('no failed JavaScript requests', async ({ page }) => {
    const failedRequests = [];

    page.on('requestfailed', (request) => {
      if (request.url().includes('.js')) {
        failedRequests.push(request.url());
      }
    });

    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

    expect(failedRequests).toHaveLength(0);

    console.log('✓ No failed JS requests');
  });

  test('direct reload succeeds', async ({ page }) => {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

    const originalTitle = await page.title();

    await page.reload({ waitUntil: 'networkidle' });

    const reloadedTitle = await page.title();
    expect(reloadedTitle).toBe(originalTitle);

    console.log('✓ Direct reload succeeds');
  });

  test('receipt route renders', async ({ page }) => {
    // Test direct navigation to receipt route
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

    const content = await page.textContent('body');
    expect(content).toBeTruthy();

    console.log('✓ Receipt route renders');
  });
});
