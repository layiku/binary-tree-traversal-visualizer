# Binary Tree Traversal Visualizer

A lightweight, static web app that builds a **random binary tree** from a chosen node count and **animates five traversal modes** step by step. The layout and controls (sidebar, canvas, floating playback bar, logs, English/Chinese toggle) follow the same interaction pattern as [AVLTreeVisualizer](https://github.com/layiku/AVLTreeVisualizer).

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
