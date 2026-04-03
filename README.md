# Binary Tree Traversal Visualizer

A lightweight, static web app that builds a **random binary tree** from a chosen node count and **animates five traversal modes** step by step. The layout and controls (sidebar, canvas, floating playback bar, English/Chinese toggle) follow the same interaction pattern as [AVLTreeVisualizer](https://github.com/layiku/AVLTreeVisualizer).

## Features

- **Random tree**: Enter a node count \(N\) from 1–31, then **Generate tree**. The tree is built by randomly splitting subtree sizes; node values are a shuffled `1..N`.
- **Traversals** (pick one, then **Start demo**):
  1. **Preorder** — root, left, right  
  2. **Inorder** — left, root, right  
  3. **Postorder** — left, right, root  
  4. **Level-order (queue)** — breadth-first with a queue (non-recursive)  
  5. **Level-order (recursive)** — same visit order as BFS, implemented by depth and “visit this level” recursion  
- **Playback**: Previous / Next, Play/Pause (auto-advance), speed slider.  
- **Visualization**: Canvas drawing with the current visit highlighted.  
- **i18n**: Switch between English and Chinese without reloading.

## Algorithm overview (with examples)

Below, each idea is stated briefly and illustrated on the **same** small tree so you can compare orders side by side.

**Example tree** (values are labels; edges are left / right children):

```text
        1
       / \
      2   3
     / \
    4   5
```

- **Node 1** — root; **2** — left child of 1; **3** — right child of 1; **4** — left child of 2; **5** — right child of 2.

### Binary tree (二叉树)

A **binary tree** is a rooted tree where each node has **at most two** children, usually called **left** and **right**. The empty tree has no nodes. This app builds a **random** binary tree with exactly \(N\) nodes by randomly splitting subtree sizes; shape and which side is empty (if any) vary each time.

*Example:* The diagram above is a binary tree with 5 nodes; node 2 has children 4 and 5, node 1 has children 2 and 3.

### Preorder traversal (前序遍历) — root → left → right

Visit the **current node first**, then the left subtree in preorder, then the right subtree in preorder. Useful for copying a tree or prefix-style encodings.

*Visit order on the example tree:* **1, 2, 4, 5, 3**

### Inorder traversal (中序遍历) — left → root → right

Visit the **left subtree** in inorder, then the **current node**, then the **right subtree** in inorder. On a **binary search tree**, this yields values in sorted order (this demo’s trees are not necessarily BSTs).

*Visit order on the example tree:* **4, 2, 5, 1, 3**

### Postorder traversal (后序遍历) — left → right → root

Visit the **left** subtree in postorder, then the **right** subtree in postorder, then the **current node**. Useful for deleting or evaluating expression trees bottom-up.

*Visit order on the example tree:* **4, 5, 2, 3, 1**

### Level-order traversal, non-recursive (层序遍历 · 非递归 / queue BFS)

Visit nodes **level by level**, from top to bottom and left to right within a level. A standard implementation uses a **queue**: dequeue the front node, visit it, enqueue its left child (if any), then its right child (if any), and repeat until the queue is empty.

*Visit order on the example tree:* **1, 2, 3, 4, 5**

### Level-order traversal, recursive (层序遍历 · 递归)

The **same visit order** as BFS above, but implemented recursively—e.g. by passing the current **depth** and, for each depth, scanning nodes that exist at that level (often with a helper that walks from the root and visits nodes at distance \(d\)). The app’s “Level-order (recursive)” mode produces the **same step sequence** as the queue version; only the implementation style differs.

*Visit order on the example tree (same as non-recursive):* **1, 2, 3, 4, 5**

## How to run

1. Clone or copy this folder.  
2. Open `index.html` in a modern browser (Chrome, Firefox, Edge, Safari).  
3. No build step or package install is required **to use the app**.

## Automated tests (Playwright)

End-to-end tests live in [`tests/`](tests/). They start a local static server (`serve`), open the app in Chromium, and check UI behavior plus in-page `BinaryTreeLib` properties. Coverage includes the **speed slider** label, **Play** auto-advance, **Pause**, and changing speed during playback.

**One-time setup** (Node.js 18+ recommended):

```bash
npm install
npx playwright install chromium
```

**Run tests:**

```bash
npm test
```

Other scripts: `npm run test:ui` (interactive UI mode), `npm run test:headed` (see the browser), `npm run test:report` (open the last HTML report).

On push/PR to `main` or `master`, [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) runs the same suite on Ubuntu in CI.

## Git commit hooks (optional)

To strip `Co-authored-by:` lines that mention Cursor from commit messages (so trailers stay neutral), run once in this repo:

```bash
git config core.hooksPath .githooks
```

The hook lives in [`.githooks/commit-msg`](.githooks/commit-msg). It removes `Co-authored-by:` lines mentioning Cursor and any `Made-with:` trailer. If your shell wraps `git` and still injects trailers after the hook runs, use the real binary (for example `C:\Program Files\Git\bin\git.exe` on Windows) for `commit` / `commit-tree`.

## Project layout

```
BinaryTreeVisualizer/
├── .githooks/          # optional: commit-msg strips Cursor co-author trailers
├── index.html
├── style.css
├── README.md
├── LICENSE
├── package.json
├── playwright.config.js
├── tests/
│   ├── ui.spec.js       # Page flows: generate, start, steps, i18n
│   └── library.spec.js  # Random-tree traversal invariants in the browser
└── js/
    ├── binarytree.js   # TreeNode, random build, traversal step lists
    ├── visualizer.js   # Canvas layout and drawing
    ├── main.js         # UI wiring and playback
    └── i18n.js         # Strings and language toggle
```

## Credits

UI/UX pattern inspired by [layiku/AVLTreeVisualizer](https://github.com/layiku/AVLTreeVisualizer).

Licensed under the [MIT License](LICENSE).
