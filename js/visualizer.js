/**
 * Canvas layout and drawing for a binary tree. Highlights a node by id.
 * Layout: every parent→child edge has the SAME length (abstract units), symmetric V-shape;
 * then uniform scale + center to fit canvas (pixel edge length equal for all edges).
 */
(function (global) {
  'use strict';

  const PADDING = 40;
  const NODE_R = 22;
  const FONT = '600 14px "JetBrains Mono", monospace';

  /** Abstract edge length (one unit; all edges identical before scaling). */
  const EDGE_LEN = 1;
  /** Half-angle from vertical down to each child (radians). Smaller = narrower tree. */
  const WEDGE_HALF = (32 * Math.PI) / 180;

  const dx = EDGE_LEN * Math.sin(WEDGE_HALF);
  const dy = EDGE_LEN * Math.cos(WEDGE_HALF);

  /**
   * Fixed-length edges: left child at (-dx,+dy), right at (+dx,+dy) from parent.
   * @param {import('./binarytree.js').TreeNode | null} node
   * @param {number} x
   * @param {number} y
   */
  function placeFixedEdges(node, x, y) {
    if (!node) return;
    node._lx = x;
    node._ly = y;
    if (node.left) placeFixedEdges(node.left, x - dx, y + dy);
    if (node.right) placeFixedEdges(node.right, x + dx, y + dy);
  }

  /**
   * Fixed-angle layout can map different nodes to the same (x,y) (e.g. LR vs RL paths).
   * Spread coincident positions horizontally so each vertex is distinct for drawing.
   */
  function separateCoincidentLayoutNodes(root) {
    for (let pass = 0; pass < 16; pass++) {
      const nodes = [];
      function inorder(n) {
        if (!n) return;
        inorder(n.left);
        nodes.push(n);
        inorder(n.right);
      }
      inorder(root);
      const groups = new Map();
      for (const n of nodes) {
        const k = n._lx.toFixed(7) + ',' + n._ly.toFixed(7);
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(n);
      }
      let moved = false;
      const SEP = 0.16;
      for (const arr of groups.values()) {
        if (arr.length < 2) continue;
        moved = true;
        arr.sort(function (a, b) {
          return a.id - b.id;
        });
        const mid = (arr.length - 1) / 2;
        for (let i = 0; i < arr.length; i++) {
          arr[i]._lx += (i - mid) * SEP;
        }
      }
      if (!moved) break;
    }
  }

  /** @param {import('./binarytree.js').TreeNode | null} node */
  function collectBounds(node, acc) {
    if (!node) return;
    acc.minX = Math.min(acc.minX, node._lx);
    acc.maxX = Math.max(acc.maxX, node._lx);
    acc.minY = Math.min(acc.minY, node._ly);
    acc.maxY = Math.max(acc.maxY, node._ly);
    collectBounds(node.left, acc);
    collectBounds(node.right, acc);
  }

  /**
   * Line from circle edge to circle edge.
   */
  function edgeAnchors(x1, y1, x2, y2, r) {
    const ddx = x2 - x1;
    const ddy = y2 - y1;
    const len = Math.hypot(ddx, ddy);
    if (len < 1e-6) return { x1, y1, x2, y2 };
    const ux = ddx / len;
    const uy = ddy / len;
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

    placeFixedEdges(root, 0, 0);
    separateCoincidentLayoutNodes(root);
    const b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    collectBounds(root, b);
    const spanX = Math.max(b.maxX - b.minX, 1e-6);
    const spanY = Math.max(b.maxY - b.minY, 1e-6);

    const usableW = Math.max(cssW - 2 * PADDING, 40);
    const usableH = Math.max(cssH - 2 * PADDING, 40);
    /** Uniform scale: all edges get the same pixel length (scale * EDGE_LEN). */
    let scale = Math.min(usableW / spanX, usableH / spanY);
    /** Avoid overly long edges when the tree is small (same length for every edge, capped). */
    const MAX_EDGE_PX = 72;
    scale = Math.min(scale, MAX_EDGE_PX / EDGE_LEN);
    const edgePx = scale * EDGE_LEN;

    const contentW = spanX * scale;
    const contentH = spanY * scale;
    const offsetX = (cssW - contentW) / 2 - b.minX * scale;
    const offsetY = (cssH - contentH) / 2 - b.minY * scale;

    function px(n) {
      return n._lx * scale + offsetX;
    }
    function py(n) {
      return n._ly * scale + offsetY;
    }

    /** Shrink circles when pixel edge is short so nodes do not overlap; cap at NODE_R. */
    const drawR = Math.max(10, Math.min(NODE_R, edgePx * 0.42));

    function drawEdges(node) {
      if (!node) return;
      const x = px(node);
      const y = py(node);
      if (node.left) {
        const lx = px(node.left);
        const ly = py(node.left);
        const a = edgeAnchors(x, y, lx, ly, drawR);
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
        const a = edgeAnchors(x, y, rx, ry, drawR);
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
      ctx.arc(x, y, drawR, 0, Math.PI * 2);
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

  /** Legacy API: assign fixed-edge positions and return approximate span for tests. */
  function assignLayout(root) {
    if (!root) return 0;
    placeFixedEdges(root, 0, 0);
    separateCoincidentLayoutNodes(root);
    const b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    collectBounds(root, b);
    return Math.max(b.maxX - b.minX, b.maxY - b.minY, 0) || 1;
  }

  global.TreeVisualizer = {
    drawTree,
    assignLayout,
  };
})(typeof window !== 'undefined' ? window : globalThis);
