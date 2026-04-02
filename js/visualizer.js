/**
 * Canvas layout and drawing for a binary tree. Highlights a node by id.
 * Layout: post-order leaf numbering + parent centered above children (compact edges vs inorder-x spread).
 */
(function (global) {
  'use strict';

  const PADDING = 40;
  const NODE_R = 22;
  const MIN_LEVEL_GAP = 56;
  const FONT = '600 14px "JetBrains Mono", monospace';

  /** @param {import('./binarytree.js').TreeNode | null} root */
  function treeDepth(root) {
    if (!root) return 0;
    return 1 + Math.max(treeDepth(root.left), treeDepth(root.right));
  }

  /**
   * Post-order: leaves get consecutive x indices; internal nodes align to child midpoint (or single child).
   * Reduces long horizontal edges compared to inorder x-index layout.
   * @param {import('./binarytree.js').TreeNode | null} root
   * @returns {number} leaf count used for bounds
   */
  function assignLayoutCompact(root) {
    let leafNext = 0;
    function post(node, depth) {
      if (!node) return;
      post(node.left, depth + 1);
      post(node.right, depth + 1);
      node._layoutY = depth;
      const leaf = !node.left && !node.right;
      if (leaf) {
        node._layoutX = leafNext++;
      } else if (node.left && node.right) {
        node._layoutX = (node.left._layoutX + node.right._layoutX) / 2;
      } else if (node.left) {
        node._layoutX = node.left._layoutX;
      } else {
        node._layoutX = node.right._layoutX;
      }
    }
    post(root, 0);
    return leafNext;
  }

  /** @param {import('./binarytree.js').TreeNode | null} node */
  function collectXBounds(node, acc) {
    if (!node) return;
    acc.min = Math.min(acc.min, node._layoutX);
    acc.max = Math.max(acc.max, node._layoutX);
    collectXBounds(node.left, acc);
    collectXBounds(node.right, acc);
  }

  /**
   * Line from circle edge to circle edge (shorter than center-to-center).
   */
  function edgeAnchors(x1, y1, x2, y2, r) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) return { x1, y1, x2, y2 };
    const ux = dx / len;
    const uy = dy / len;
    return {
      x1: x1 + ux * r,
      y1: y1 + uy * r,
      x2: x2 - ux * r,
      y2: y2 - uy * r,
    };
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

    assignLayoutCompact(root);
    const levels = treeDepth(root);
    const bounds = { min: Infinity, max: -Infinity };
    collectXBounds(root, bounds);
    const spanX = Math.max(bounds.max - bounds.min, 1e-6);

    const innerW = Math.max(cssW - 2 * PADDING, 1);
    const innerH = Math.max(cssH - 2 * PADDING, 1);
    const stepY = Math.max(MIN_LEVEL_GAP, levels <= 1 ? innerH / 2 : innerH / Math.max(levels - 1, 1));

    function px(node) {
      return PADDING + ((node._layoutX - bounds.min) / spanX) * innerW;
    }
    function py(node) {
      if (levels <= 1) return PADDING + innerH / 2;
      return PADDING + node._layoutY * stepY;
    }

    function drawEdges(node) {
      if (!node) return;
      const x = px(node);
      const y = py(node);
      if (node.left) {
        const lx = px(node.left);
        const ly = py(node.left);
        const a = edgeAnchors(x, y, lx, ly, NODE_R);
        ctx.beginPath();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.moveTo(a.x1, a.y1);
        ctx.lineTo(a.x2, a.y2);
        ctx.stroke();
        drawEdges(node.left);
      }
      if (node.right) {
        const rx = px(node.right);
        const ry = py(node.right);
        const a = edgeAnchors(x, y, rx, ry, NODE_R);
        ctx.beginPath();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.moveTo(a.x1, a.y1);
        ctx.lineTo(a.x2, a.y2);
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

  /** @deprecated use assignLayoutCompact via drawTree */
  function assignLayout(root) {
    if (!root) return 0;
    return assignLayoutCompact(root);
  }

  global.TreeVisualizer = {
    drawTree,
    assignLayout,
  };
})(typeof window !== 'undefined' ? window : globalThis);
