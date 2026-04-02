// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('BinaryTreeVisualizer UI', () => {
  test('loads with expected title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Binary Tree Traversal Visualizer/i);
    await expect(page.locator('#tree-canvas')).toBeVisible();
  });

  test('Start stays disabled until tree is generated', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#btn-start')).toBeDisabled();
    await page.locator('#btn-generate').click();
    await expect(page.locator('#btn-start')).toBeEnabled();
  });

  test('generating tree clamps node count and enables playback controls after Start', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator('#node-count').fill('5');
    await page.locator('#btn-generate').click();
    await page.locator('#btn-start').click();
    await expect(page.locator('#step-counter')).toContainText('1 / 5');
    await expect(page.locator('#log-content .log-item')).toHaveCount(5);
    await expect(page.locator('#btn-play')).toBeEnabled();
    await expect(page.locator('#btn-next')).toBeEnabled();
    await expect(page.locator('#btn-prev')).toBeDisabled();
  });

  test('Next and Prev move step counter', async ({ page }) => {
    await page.goto('/');
    await page.locator('#node-count').fill('4');
    await page.locator('#btn-generate').click();
    await page.locator('#btn-start').click();
    await expect(page.locator('#step-counter')).toContainText('1 / 4');
    await page.locator('#btn-next').click();
    await expect(page.locator('#step-counter')).toContainText('2 / 4');
    await page.locator('#btn-prev').click();
    await expect(page.locator('#step-counter')).toContainText('1 / 4');
  });

  test('each traversal mode produces N log lines for N nodes', async ({ page }) => {
    const modes = ['preorder', 'inorder', 'postorder', 'levelIter', 'levelRecur'];
    for (const mode of modes) {
      await page.goto('/');
      await page.locator('#node-count').fill('6');
      await page.locator('#btn-generate').click();
      await page.locator(`input[name="traversal"][value="${mode}"]`).check();
      await page.locator('#btn-start').click();
      await expect(page.locator('#log-content .log-item')).toHaveCount(6);
    }
  });

  test('language toggle switches sidebar copy', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Binary Tree');
    await page.locator('#lang-btn').click();
    await expect(page.locator('h1')).toContainText('二叉树');
    await page.locator('#lang-btn').click();
    await expect(page.locator('h1')).toContainText('Binary Tree');
  });

  test('changing traversal clears demo until Start is pressed again', async ({ page }) => {
    await page.goto('/');
    await page.locator('#node-count').fill('3');
    await page.locator('#btn-generate').click();
    await page.locator('#btn-start').click();
    await expect(page.locator('#step-counter')).toContainText('1 / 3');
    await page.locator('input[name="traversal"][value="inorder"]').check();
    await expect(page.locator('#step-counter')).toContainText('0 / 0');
  });

  test('speed slider updates the displayed multiplier', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#speed-value')).toContainText('1.0x');
    await page.locator('#speed').fill('1');
    await expect(page.locator('#speed-value')).toContainText('0.1x');
    await page.locator('#speed').fill('20');
    await expect(page.locator('#speed-value')).toContainText('2.0x');
  });

  test('Play auto-advances the current step on a timer', async ({ page }) => {
    await page.goto('/');
    await page.locator('#node-count').fill('5');
    await page.locator('#btn-generate').click();
    await page.locator('#btn-start').click();
    await expect(page.locator('#step-counter')).toContainText('1 / 5');
    await page.locator('#btn-play').click();
    await expect(page.locator('#step-counter')).toContainText('2 / 5', { timeout: 5000 });
  });

  test('Pause stops auto-advance', async ({ page }) => {
    await page.goto('/');
    await page.locator('#node-count').fill('5');
    await page.locator('#btn-generate').click();
    await page.locator('#btn-start').click();
    await page.locator('#btn-play').click();
    await expect(page.locator('#step-counter')).toContainText('2 / 5', { timeout: 5000 });
    await page.locator('#btn-play').click();
    await expect(page.locator('#step-counter')).toContainText('2 / 5');
    await new Promise((r) => setTimeout(r, 2000));
    await expect(page.locator('#step-counter')).toContainText('2 / 5');
    await expect(page.locator('#step-counter')).not.toContainText('5 / 5');
  });

  test('changing speed while playing keeps advancing', async ({ page }) => {
    await page.goto('/');
    await page.locator('#node-count').fill('4');
    await page.locator('#btn-generate').click();
    await page.locator('#btn-start').click();
    await page.locator('#btn-play').click();
    await page.locator('#speed').fill('20');
    await expect(page.locator('#speed-value')).toContainText('2.0x');
    await expect(page.locator('#step-counter')).toContainText('4 / 4', { timeout: 8000 });
  });
});
