/**
 * English / Chinese UI strings and apply without reload.
 */
(function (global) {
  'use strict';

  const DICT = {
    en: {
      appTitle: 'Binary Tree Traversal Visualizer',
      brandTitle: 'Binary Tree',
      brandSubtitle: 'Traversal Visualizer',
      nodeCountLabel: 'Node count (1–31)',
      btnGenerate: 'Generate tree',
      traversalLabel: 'Traversal',
      trPreorder: 'Preorder',
      trInorder: 'Inorder',
      trPostorder: 'Postorder',
      trLevelIter: 'Level-order (queue)',
      trLevelRecur: 'Level-order (recursive)',
      btnStart: 'Start demo',
      statusHeader: 'Status',
      statusTraversal: 'Traversal',
      statusStep: 'Step',
      statusHintIdle: 'Generate a tree, choose traversal, then Start.',
      statusHintReady: 'Press Start to step through the traversal.',
      statusHintPlaying: 'Playing… Use controls to pause or step.',
      speedLabel: 'Animation speed',
      langSwitch: 'Switch to 中文',
      langCode: 'en',
    },
    zh: {
      appTitle: '二叉树遍历演示',
      brandTitle: '二叉树',
      brandSubtitle: '遍历演示',
      nodeCountLabel: '节点数量（1–31）',
      btnGenerate: '生成树',
      traversalLabel: '遍历方式',
      trPreorder: '前序遍历',
      trInorder: '中序遍历',
      trPostorder: '后序遍历',
      trLevelIter: '层序遍历（队列，非递归）',
      trLevelRecur: '层序遍历（递归按层）',
      btnStart: '开始演示',
      statusHeader: '状态',
      statusTraversal: '当前遍历',
      statusStep: '步骤',
      statusHintIdle: '请生成树、选择遍历方式后点击「开始演示」。',
      statusHintReady: '点击「开始演示」逐步播放遍历。',
      statusHintPlaying: '播放中… 可暂停或单步。',
      speedLabel: '动画速度',
      langSwitch: 'Switch to English',
      langCode: 'zh',
    },
  };

  let lang = 'en';

  function t(key, vars) {
    let s = DICT[lang][key] || DICT.en[key] || key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), String(vars[k]));
      });
    }
    return s;
  }

  function setLang(next) {
    lang = next === 'zh' ? 'zh' : 'en';
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    apply();
  }

  function toggleLang() {
    setLang(lang === 'en' ? 'zh' : 'en');
  }

  function apply() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      const key = el.getAttribute('data-i18n');
      if (key && DICT[lang][key] !== undefined) {
        el.textContent = DICT[lang][key];
      }
    });
    const titleEl = document.querySelector('title');
    if (titleEl) titleEl.textContent = t('appTitle');
  }

  global.I18n = {
    t,
    setLang,
    toggleLang,
    apply,
    getLang: function () {
      return lang;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
