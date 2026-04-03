/**
 * Canvas layout and drawing for a binary tree. Highlights a node by id.
 * Layout: default fixed-length edges in a symmetric V; optional drag overrides:
 * non-root: parent→node vector; root: whole-tree translation. Subtrees stay rigid
 * (relative offsets from a dragged node match the default layout).
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

  /** Snapshot canonical layout after placeFixedEdges + separateCoincident. */
  function copyBaseLayout(node) {
    if (!node) return;
    node._baseLx = node._lx;
    node._baseLy = node._ly;
    copyBaseLayout(node.left);
    copyBaseLayout(node.right);
  }

  /**
   * Apply effective positions: root uses base + optional _rootDragDx/_rootDragDy;
   * each child is base-offset from parent, or _dragParentDx/_dragParentDy from parent.
   * @param {import('./binarytree.js').TreeNode | null} node
   * @param {import('./binarytree.js').TreeNode | null} parent
   * @param {{ x: number, y: number } | null} parentEff
   */
  function applyEffectiveLayout(node, parent, parentEff) {
    if (!node) return;
    if (!parent || !parentEff) {
      const hasRootDrag =
        typeof node._rootDragDx === 'number' && typeof node._rootDragDy === 'number';
      if (hasRootDrag) {
        node._lx = node._baseLx + node._rootDragDx;
        node._ly = node._baseLy + node._rootDragDy;
      } else {
        node._lx = node._baseLx;
        node._ly = node._baseLy;
      }
    } else {
      const hasDrag =
        typeof node._dragParentDx === 'number' && typeof node._dragParentDy === 'number';
      if (hasDrag) {
        const dy = Math.max(0, node._dragParentDy);
        node._dragParentDy = dy;
        node._lx = parentEff.x + node._dragParentDx;
        node._ly = parentEff.y + dy;
      } else {
        node._lx = parentEff.x + (node._baseLx - parent._baseLx);
        node._ly = parentEff.y + (node._baseLy - parent._baseLy);
      }
    }
    const eff = { x: node._lx, y: node._ly };
    if (node.left) applyEffectiveLayout(node.left, node, eff);
    if (node.right) applyEffectiveLayout(node.right, node, eff);
  }

  /** Run base placement + effective positions (uses optional drag overrides). */
  function layoutEffectivePositions(root) {
    if (!root) return;
    placeFixedEdges(root, 0, 0);
    separateCoincidentLayoutNodes(root);
    copyBaseLayout(root);
    applyEffectiveLayout(root, null, null);
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
   * Whole-tree translation from root drag: every effective position shares the same delta.
   * Subtract it when computing the bbox for centering so pan is not cancelled by offsetX/Y.
   */
  function getRootAbstractPan(root) {
    if (!root) return { dx: 0, dy: 0 };
    const dx = typeof root._rootDragDx === 'number' ? root._rootDragDx : 0;
    const dy = typeof root._rootDragDy === 'number' ? root._rootDragDy : 0;
    return { dx: dx, dy: dy };
  }

  /** Bounds in "canonical" space for fitting (ignores uniform root translation). */
  function collectBoundsForView(node, acc, pan) {
    if (!node) return;
    const x = node._lx - pan.dx;
    const y = node._ly - pan.dy;
    acc.minX = Math.min(acc.minX, x);
    acc.maxX = Math.max(acc.maxX, x);
    acc.minY = Math.min(acc.minY, y);
    acc.maxY = Math.max(acc.maxY, y);
    collectBoundsForView(node.left, acc, pan);
    collectBoundsForView(node.right, acc, pan);
  }

  /**
   * @param {import('./binarytree.js').TreeNode | null} target
   * @param {import('./binarytree.js').TreeNode | null} parent
   * @returns {import('./binarytree.js').TreeNode | null}
   */
  function findParent(root, target, parent) {
    if (!root) return null;
    if (root === target) return parent;
    const l = findParent(root.left, target, root);
    if (l) return l;
    return findParent(root.right, target, root);
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
   * @param {import('./binarytree.js').TreeNode} root
   */
  function computeViewTransform(canvas, root) {
    const rect = canvas.getBoundingClientRect();
    const cssW = rect.width;
    const cssH = rect.height;
    const pan = getRootAbstractPan(root);
    const b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    collectBoundsForView(root, b, pan);
    const spanX = Math.max(b.maxX - b.minX, 1e-6);
    const spanY = Math.max(b.maxY - b.minY, 1e-6);

    const usableW = Math.max(cssW - 2 * PADDING, 40);
    const usableH = Math.max(cssH - 2 * PADDING, 40);
    let scale = Math.min(usableW / spanX, usableH / spanY);
    const MAX_EDGE_PX = 72;
    scale = Math.min(scale, MAX_EDGE_PX / EDGE_LEN);
    const contentW = spanX * scale;
    const contentH = spanY * scale;
    const offsetX = (cssW - contentW) / 2 - b.minX * scale;
    const offsetY = (cssH - contentH) / 2 - b.minY * scale;
    const edgePx = scale * EDGE_LEN;
    const drawR = Math.max(10, Math.min(NODE_R, edgePx * 0.42));
    return { scale, offsetX, offsetY, drawR, cssW, cssH, b };
  }

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {import('./binarytree.js').TreeNode | null} root
   * @param {number | null} highlightId
   * @param {{ frozenView?: { scale: number, offsetX: number, offsetY: number, drawR: number } | null, dragNodeId?: number | null }} [opts]
   */
  function drawTree(canvas, root, highlightId, opts) {
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
      ctx.textBaseline = 'middle';
      const hint =
        typeof window !== 'undefined' &&
        window.I18n &&
        typeof window.I18n.t === 'function'
          ? window.I18n.t('canvasEmptyHint')
          : 'No tree yet\nClick Generate tree in the sidebar';
      const lines = hint.split('\n');
      const lineHeight = 22;
      const blockH = (lines.length - 1) * lineHeight;
      let y = cssH / 2 - blockH / 2;
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i].trim(), cssW / 2, y);
        y += lineHeight;
      }
      return;
    }

    layoutEffectivePositions(root);

    const frozen = opts && opts.frozenView;
    let scale;
    let offsetX;
    let offsetY;
    let drawR;
    if (frozen) {
      scale = frozen.scale;
      offsetX = frozen.offsetX;
      offsetY = frozen.offsetY;
      drawR = frozen.drawR;
    } else {
      const v = computeViewTransform(canvas, root);
      scale = v.scale;
      offsetX = v.offsetX;
      offsetY = v.offsetY;
      drawR = v.drawR;
    }

    const dragNodeId = opts && opts.dragNodeId != null ? opts.dragNodeId : null;

    function px(n) {
      return n._lx * scale + offsetX;
    }
    function py(n) {
      return n._ly * scale + offsetY;
    }

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
      const isDrag = dragNodeId !== null && node.id === dragNodeId;
      const isHi =
        !isDrag &&
        highlightId !== null &&
        highlightId !== undefined &&
        node.id === highlightId;
      const isRootNode = node === root;
      if (isDrag) {
        ctx.save();
        ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.beginPath();
        ctx.arc(x, y, drawR, 0, Math.PI * 2);
        ctx.fillStyle = '#e0e7ff';
        ctx.fill();
        ctx.restore();
        ctx.beginPath();
        ctx.arc(x, y, drawR, 0, Math.PI * 2);
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (isHi) {
        ctx.beginPath();
        ctx.arc(x, y, drawR, 0, Math.PI * 2);
        ctx.fillStyle = '#fef3c7';
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (isRootNode) {
        ctx.beginPath();
        ctx.arc(x, y, drawR, 0, Math.PI * 2);
        ctx.fillStyle = '#ecfdf5';
        ctx.fill();
        ctx.strokeStyle = '#0d9488';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, drawR, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
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

  /**
   * Deepest node whose circle contains (cssX, cssY) in CSS pixels relative to canvas.
   * @param {HTMLCanvasElement} canvas
   * @param {import('./binarytree.js').TreeNode} root
   * @param {number} cssX
   * @param {number} cssY
   */
  function pickNodeAt(canvas, root, cssX, cssY) {
    layoutEffectivePositions(root);
    const v = computeViewTransform(canvas, root);
    const { scale, offsetX, offsetY, drawR } = v;
    function px(n) {
      return n._lx * scale + offsetX;
    }
    function py(n) {
      return n._ly * scale + offsetY;
    }
    let best = null;
    let bestDepth = -1;
    function walk(n, depth) {
      if (!n) return;
      walk(n.left, depth + 1);
      const dx = cssX - px(n);
      const dy = cssY - py(n);
      if (dx * dx + dy * dy <= drawR * drawR && depth >= bestDepth) {
        best = n;
        bestDepth = depth;
      }
      walk(n.right, depth + 1);
    }
    walk(root, 0);
    return best;
  }

  /**
   * View transform for starting a drag (freeze scale/offset so pointer ↔ abstract stays stable).
   * @param {HTMLCanvasElement} canvas
   * @param {import('./binarytree.js').TreeNode} root
   */
  function getViewForDragFreeze(canvas, root) {
    layoutEffectivePositions(root);
    const v = computeViewTransform(canvas, root);
    return {
      scale: v.scale,
      offsetX: v.offsetX,
      offsetY: v.offsetY,
      drawR: v.drawR,
    };
  }

  /** Remove drag overrides from all nodes (e.g. new random tree). */
  function clearDragState(node) {
    if (!node) return;
    delete node._dragParentDx;
    delete node._dragParentDy;
    delete node._rootDragDx;
    delete node._rootDragDy;
    clearDragState(node.left);
    clearDragState(node.right);
  }

  /** Legacy API: assign fixed-edge positions and return approximate span for tests. */
  function assignLayout(root) {
    if (!root) return 0;
    layoutEffectivePositions(root);
    const b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    collectBounds(root, b);
    return Math.max(b.maxX - b.minX, b.maxY - b.minY, 0) || 1;
  }

  global.TreeVisualizer = {
    drawTree,
    assignLayout,
    pickNodeAt,
    findParent,
    getViewForDragFreeze,
    clearDragState,
    layoutEffectivePositions,
  };
})(typeof window !== 'undefined' ? window : globalThis);
