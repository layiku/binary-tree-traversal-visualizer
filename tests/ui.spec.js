// @ts-check
const { test, expect } = require('@playwright/test');
const { getCanvasPaintMetrics } = require('./helpers/canvas-pixels');

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

  test('each traversal mode shows N steps for N nodes', async ({ page }) => {
    const modes = ['preorder', 'inorder', 'postorder', 'levelIter', 'levelRecur'];
    for (const mode of modes) {
      await page.goto('/');
      await page.locator('#node-count').fill('6');
      await page.locator('#btn-generate').click();
      await page.locator(`input[name="traversal"][value="${mode}"]`).check();
      await page.locator('#btn-start').click();
      await expect(page.locator('#step-counter')).toContainText('1 / 6');
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
    const pausedAt = (await page.locator('#step-counter').innerText()).trim();
    await new Promise((r) => setTimeout(r, 2500));
    await expect(page.locator('#step-counter')).toHaveText(pausedAt);
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

  test('empty canvas shows less ink than after Generate', async ({ page }) => {
    await page.goto('/');
    const empty = await getCanvasPaintMetrics(page);
    await page.locator('#node-count').fill('8');
    await page.locator('#btn-generate').click();
    await expect(page.locator('#btn-start')).toBeEnabled();
    await page.waitForTimeout(150);
    const filled = await getCanvasPaintMetrics(page);
    expect(filled.ink, 'tree should use more edge/stroke pixels than lone em dash').toBeGreaterThan(
      Math.max(2500, empty.ink * 2),
    );
    expect(filled.deviation).toBeGreaterThan(empty.deviation + 8000);
  });

  test('second Generate still paints a full tree (stale drag must not blank canvas)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator('#node-count').fill('7');
    await page.locator('#btn-generate').click();
    await page.waitForTimeout(150);
    const first = await getCanvasPaintMetrics(page);
    expect(first.ink).toBeGreaterThan(2000);
    await page.locator('#node-count').fill('9');
    await page.locator('#btn-generate').click();
    await page.waitForTimeout(150);
    const second = await getCanvasPaintMetrics(page);
    expect(second.ink).toBeGreaterThan(2000);
    expect(second.deviation).toBeGreaterThan(first.deviation * 0.35);
  });

  test('after pointer drag ends, regenerate still paints tree', async ({ page }) => {
    await page.goto('/');
    await page.locator('#node-count').fill('6');
    await page.locator('#btn-generate').click();
    await page.waitForTimeout(150);
    const box = await page.locator('#tree-canvas').boundingBox();
    expect(box).toBeTruthy();
    const cx = box.x + box.width * 0.52;
    const cy = box.y + box.height * 0.38;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 70, cy + 55);
    await page.mouse.up();
    await page.locator('#node-count').fill('5');
    await page.locator('#btn-generate').click();
    await page.waitForTimeout(200);
    const m = await getCanvasPaintMetrics(page);
    expect(m.ink).toBeGreaterThan(2000);
    expect(m.deviation).toBeGreaterThan(12000);
  });
});
