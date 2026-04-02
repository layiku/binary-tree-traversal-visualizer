/**
 * Canvas layout and drawing for a binary tree. Highlights a node by id.
 */
(function (global) {
  'use strict';

  const PADDING = 48;
  const NODE_R = 22;
  const FONT = '600 14px "JetBrains Mono", monospace';

  /** @param {import('./binarytree.js').TreeNode | null} root */
  function treeDepth(root) {
    if (!root) return 0;
    return 1 + Math.max(treeDepth(root.left), treeDepth(root.right));
  }

  /**
   * Inorder assigns x index 0..n-1; y is depth.
   * @param {import('./binarytree.js').TreeNode | null} root
   * @returns {number} node count
   */
  function assignLayout(root) {
    let xIndex = 0;
    function walk(node, depth) {
      if (!node) return;
      walk(node.left, depth + 1);
      node._layoutX = xIndex++;
      node._layoutY = depth;
      walk(node.right, depth + 1);
    }
    walk(root, 0);
    return xIndex;
  }

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {import('./binarytree.js').TreeNode | null} root
   * @param {number | null} highlightId
   */
  function drawTree(canvas, root, highlightId) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.scale(dpr, dpr);

    const cssW = rect.width;
    const cssH = rect.height;

    if (!root) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('—', cssW / 2, cssH / 2);
      return;
    }

    const n = assignLayout(root);
    const levels = treeDepth(root);
    const innerW = Math.max(cssW - 2 * PADDING, 1);
    const innerH = Math.max(cssH - 2 * PADDING, 1);
    const stepX = n <= 1 ? innerW / 2 : innerW / Math.max(n - 1, 1);
    const stepY = levels <= 1 ? innerH / 2 : innerH / Math.max(levels - 1, 1);

    function px(node) {
      return PADDING + node._layoutX * stepX;
    }
    function py(node) {
      return PADDING + node._layoutY * stepY;
    }

    function drawEdges(node) {
      if (!node) return;
      const x = px(node);
      const y = py(node);
      if (node.left) {
        ctx.beginPath();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.moveTo(x, y);
        ctx.lineTo(px(node.left), py(node.left));
        ctx.stroke();
        drawEdges(node.left);
      }
      if (node.right) {
        ctx.beginPath();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.moveTo(x, y);
        ctx.lineTo(px(node.right), py(node.right));
        ctx.stroke();
        drawEdges(node.right);
      }
    }

    function drawNodes(node) {
      if (!node) return;
      drawNodes(node.left);
      const x = px(node);
      const y = py(node);
      const isHi = highlightId !== null && highlightId !== undefined && node.id === highlightId;
      ctx.beginPath();
      ctx.arc(x, y, NODE_R, 0, Math.PI * 2);
      ctx.fillStyle = isHi ? '#fef3c7' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = isHi ? '#f59e0b' : '#3b82f6';
      ctx.lineWidth = isHi ? 3 : 2;
      ctx.stroke();
      ctx.fillStyle = '#1e293b';
      ctx.font = FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(node.val), x, y);
      drawNodes(node.right);
    }

    drawEdges(root);
    drawNodes(root);
  }

  global.TreeVisualizer = {
    drawTree,
    assignLayout,
  };
})(typeof window !== 'undefined' ? window : globalThis);
