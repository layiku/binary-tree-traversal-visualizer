/**
 * Binary tree: random generation and traversal step sequences.
 * Steps use stable node ids assigned at construction time.
 */

(function (global) {
  'use strict';

  let nextId = 1;

  function resetIdCounter() {
    nextId = 1;
  }

  /** @param {number} val */
  function TreeNode(val, left, right) {
    this.id = nextId++;
    this.val = val;
    this.left = left || null;
    this.right = right || null;
  }

  /** Fisher–Yates shuffle in place */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  /**
   * Random binary tree with exactly n nodes (uniform split of sizes).
   * Values are shuffled 1..n assigned in preorder as nodes are created.
   * @param {number} n
   * @returns {TreeNode | null}
   */
  function buildRandomTree(n) {
    resetIdCounter();
    if (n <= 0) return null;
    const values = shuffle(Array.from({ length: n }, (_, i) => i + 1));
    let vi = 0;

    function build(k) {
      if (k === 0) return null;
      const leftSize = Math.floor(Math.random() * k);
      const node = new TreeNode(values[vi++]);
      node.left = build(leftSize);
      node.right = build(k - 1 - leftSize);
      return node;
    }

    return build(n);
  }

  /** @typedef {{ nodeId: number, value: number }} TraversalStep */

  /** @param {TreeNode | null} root */
  function traversePreorder(root) {
    /** @type {TraversalStep[]} */
    const steps = [];
    function visit(node) {
      if (!node) return;
      steps.push({ nodeId: node.id, value: node.val });
      visit(node.left);
      visit(node.right);
    }
    visit(root);
    return steps;
  }

  /** @param {TreeNode | null} root */
  function traverseInorder(root) {
    /** @type {TraversalStep[]} */
    const steps = [];
    function visit(node) {
      if (!node) return;
      visit(node.left);
      steps.push({ nodeId: node.id, value: node.val });
      visit(node.right);
    }
    visit(root);
    return steps;
  }

  /** @param {TreeNode | null} root */
  function traversePostorder(root) {
    /** @type {TraversalStep[]} */
    const steps = [];
    function visit(node) {
      if (!node) return;
      visit(node.left);
      visit(node.right);
      steps.push({ nodeId: node.id, value: node.val });
    }
    visit(root);
    return steps;
  }

  /** Level-order using a queue (non-recursive BFS). */
  function traverseLevelIterative(root) {
    /** @type {TraversalStep[]} */
    const steps = [];
    if (!root) return steps;
    const q = [root];
    while (q.length) {
      const node = q.shift();
      if (!node) continue;
      steps.push({ nodeId: node.id, value: node.val });
      if (node.left) q.push(node.left);
      if (node.right) q.push(node.right);
    }
    return steps;
  }

  /** @param {TreeNode | null} node */
  function height(node) {
    if (!node) return 0;
    return 1 + Math.max(height(node.left), height(node.right));
  }

  /**
   * Level-order by depth: for each level, visit each node at that level left-to-right.
   * Same visit order as BFS queue.
   */
  function traverseLevelRecursive(root) {
    /** @type {TraversalStep[]} */
    const steps = [];
    if (!root) return steps;

    const h = height(root);

    function visitAtLevel(node, level) {
      if (!node) return;
      if (level === 1) {
        steps.push({ nodeId: node.id, value: node.val });
        return;
      }
      visitAtLevel(node.left, level - 1);
      visitAtLevel(node.right, level - 1);
    }

    for (let d = 1; d <= h; d++) {
      visitAtLevel(root, d);
    }
    return steps;
  }

  /** @param {TreeNode | null} root */
  function countNodes(root) {
    if (!root) return 0;
    return 1 + countNodes(root.left) + countNodes(root.right);
  }

  /**
   * @param {TreeNode | null} root
   * @param {'preorder'|'inorder'|'postorder'|'levelIter'|'levelRecur'} mode
   * @returns {TraversalStep[]}
   */
  function getTraversalSteps(root, mode) {
    switch (mode) {
      case 'preorder':
        return traversePreorder(root);
      case 'inorder':
        return traverseInorder(root);
      case 'postorder':
        return traversePostorder(root);
      case 'levelIter':
        return traverseLevelIterative(root);
      case 'levelRecur':
        return traverseLevelRecursive(root);
      default:
        return [];
    }
  }

  global.BinaryTreeLib = {
    TreeNode,
    buildRandomTree,
    getTraversalSteps,
    traversePreorder,
    traverseInorder,
    traversePostorder,
    traverseLevelIterative,
    traverseLevelRecursive,
    height,
    countNodes,
  };
})(typeof window !== 'undefined' ? window : globalThis);
