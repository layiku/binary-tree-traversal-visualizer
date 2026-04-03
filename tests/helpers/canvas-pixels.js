/**
 * Canvas paint metrics for E2E. Tree uses large white fills (255,255,255) which strict
 * RGB thresholds miss; we combine "ink" pixels and deviation from blank state.
 * @param {import('@playwright/test').Page} page
 * @param {string} [selector='#tree-canvas']
 */
async function getCanvasPaintMetrics(page, selector = '#tree-canvas') {
  return page.evaluate((sel) => {
    const c = document.querySelector(sel);
    if (!c) return { ink: -1, deviation: -1 };
    const ctx = c.getContext('2d');
    if (!ctx) return { ink: -1, deviation: -1 };
    const w = c.width;
    const h = c.height;
    if (w < 1 || h < 1) return { ink: 0, deviation: 0 };
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    let ink = 0;
    let deviation = 0;
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3];
      if (a < 200) continue;
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const sum = r + g + b;
      // Edges, strokes, text, gray lines — not pure/near-white canvas background
      if (sum < 758) ink++;
      deviation += 765 - Math.min(sum, 765) + (255 - a) * 0.01;
    }
    return { ink: ink, deviation: Math.round(deviation) };
  }, selector);
}

module.exports = { getCanvasPaintMetrics };
