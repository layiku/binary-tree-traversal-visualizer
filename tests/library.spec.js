// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Exercises BinaryTreeLib in the real browser bundle (same as production).
 */
test.describe('BinaryTreeLib in page context', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('every traversal lists each node exactly once for random trees', async ({ page }) => {
    const ok = await page.evaluate(() => {
      const BT = window.BinaryTreeLib;
      const modes = ['preorder', 'inorder', 'postorder', 'levelIter', 'levelRecur'];
      for (let trial = 0; trial < 30; trial++) {
        const n = 1 + Math.floor(Math.random() * 20);
        const tree = BT.buildRandomTree(n);
        if (BT.countNodes(tree) !== n) return false;
        for (const m of modes) {
          const steps = BT.getTraversalSteps(tree, m);
          if (steps.length !== n) return false;
          const vals = steps.map((s) => s.value).sort((a, b) => a - b);
          for (let i = 0; i < n; i++) {
            if (vals[i] !== i + 1) return false;
          }
        }
      }
      return true;
    });
    expect(ok).toBe(true);
  });

  test('level-order iterative and recursive visit order match', async ({ page }) => {
    const ok = await page.evaluate(() => {
      const BT = window.BinaryTreeLib;
      for (let trial = 0; trial < 40; trial++) {
        const n = 1 + Math.floor(Math.random() * 25);
        const tree = BT.buildRandomTree(n);
        const a = BT.getTraversalSteps(tree, 'levelIter').map((s) => s.value);
        const b = BT.getTraversalSteps(tree, 'levelRecur').map((s) => s.value);
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
          if (a[i] !== b[i]) return false;
        }
      }
      return true;
    });
    expect(ok).toBe(true);
  });
});
