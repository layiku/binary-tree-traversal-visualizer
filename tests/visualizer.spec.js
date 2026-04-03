// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Layout + draw in real bundle (catches NaN, off-screen, assignLayout regressions).
 */
test.describe('TreeVisualizer in page context', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('effective layout coordinates are finite for random trees', async ({ page }) => {
    const ok = await page.evaluate(() => {
      const BT = window.BinaryTreeLib;
      const V = window.TreeVisualizer;
      function walk(n) {
        if (!n) return true;
        if (!Number.isFinite(n._lx) || !Number.isFinite(n._ly)) return false;
        if (!Number.isFinite(n._baseLx) || !Number.isFinite(n._baseLy)) return false;
        return walk(n.left) && walk(n.right);
      }
      for (let t = 0; t < 50; t++) {
        const n = 1 + Math.floor(Math.random() * 18);
        const root = BT.buildRandomTree(n);
        if (!root) return false;
        V.layoutEffectivePositions(root);
        if (!walk(root)) return false;
      }
      return true;
    });
    expect(ok).toBe(true);
  });

  test('root translation keeps finite coords for all nodes', async ({ page }) => {
    const ok = await page.evaluate(() => {
      const BT = window.BinaryTreeLib;
      const V = window.TreeVisualizer;
      function walk(n) {
        if (!n) return true;
        if (!Number.isFinite(n._lx) || !Number.isFinite(n._ly)) return false;
        return walk(n.left) && walk(n.right);
      }
      const root = BT.buildRandomTree(10);
      root._rootDragDx = 1.25;
      root._rootDragDy = -0.75;
      V.layoutEffectivePositions(root);
      return walk(root);
    });
    expect(ok).toBe(true);
  });

  test('child drag clamp keeps finite coords', async ({ page }) => {
    const ok = await page.evaluate(() => {
      const BT = window.BinaryTreeLib;
      const V = window.TreeVisualizer;
      function walk(n) {
        if (!n) return true;
        if (!Number.isFinite(n._lx) || !Number.isFinite(n._ly)) return false;
        return walk(n.left) && walk(n.right);
      }
      const root = BT.buildRandomTree(8);
      V.layoutEffectivePositions(root);
      const node = root.left || root.right;
      if (!node) return true;
      node._dragParentDx = 0.3;
      node._dragParentDy = -99;
      V.layoutEffectivePositions(root);
      return walk(root);
    });
    expect(ok).toBe(true);
  });

  test('assignLayout returns positive finite span', async ({ page }) => {
    const ok = await page.evaluate(() => {
      const BT = window.BinaryTreeLib;
      const V = window.TreeVisualizer;
      for (let t = 0; t < 20; t++) {
        const root = BT.buildRandomTree(3 + Math.floor(Math.random() * 15));
        const span = V.assignLayout(root);
        if (!Number.isFinite(span) || span <= 0) return false;
      }
      return true;
    });
    expect(ok).toBe(true);
  });

  test('drawTree paints measurable ink on a sized canvas', async ({ page }) => {
    const ink = await page.evaluate(() => {
      const BT = window.BinaryTreeLib;
      const V = window.TreeVisualizer;
      const root = BT.buildRandomTree(9);
      const c = document.createElement('canvas');
      c.width = 640;
      c.height = 480;
      c.style.cssText = 'position:fixed;left:-9999px;top:0;';
      document.body.appendChild(c);
      V.drawTree(c, root, null);
      const ctx = c.getContext('2d');
      const img = ctx.getImageData(0, 0, c.width, c.height);
      const d = img.data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 200) continue;
        const sum = d[i] + d[i + 1] + d[i + 2];
        if (sum < 758) n++;
      }
      c.remove();
      return n;
    });
    expect(ink).toBeGreaterThan(3500);
  });
});
