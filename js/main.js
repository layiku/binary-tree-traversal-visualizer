/**
 * UI: generate tree, pick traversal, play steps, logs, i18n.
 */
(function () {
  'use strict';

  const BT = window.BinaryTreeLib;
  const V = window.TreeVisualizer;
  const I18n = window.I18n;

  let root = null;
  let steps = [];
  let stepIndex = -1;
  let playing = false;
  let playTimer = null;

  const canvas = document.getElementById('tree-canvas');
  const nodeCountInput = document.getElementById('node-count');
  const btnGenerate = document.getElementById('btn-generate');
  const btnStart = document.getElementById('btn-start');
  const btnPlay = document.getElementById('btn-play');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const stepCounter = document.getElementById('step-counter');
  const speedInput = document.getElementById('speed');
  const speedValue = document.getElementById('speed-value');
  const logContent = document.getElementById('log-content');
  const langBtn = document.getElementById('lang-btn');
  const statusTraversalVal = document.getElementById('status-traversal-val');
  const statusStepVal = document.getElementById('status-step-val');
  const statusHint = document.getElementById('status-hint');

  const TRAVERSAL_NAMES = {
    preorder: 'trPreorder',
    inorder: 'trInorder',
    postorder: 'trPostorder',
    levelIter: 'trLevelIter',
    levelRecur: 'trLevelRecur',
  };

  function getSelectedMode() {
    const el = document.querySelector('input[name="traversal"]:checked');
    return el ? el.value : 'preorder';
  }

  function traversalDisplayName(mode) {
    const key = TRAVERSAL_NAMES[mode];
    return key ? I18n.t(key) : mode;
  }

  function stopPlayback() {
    playing = false;
    if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
    }
    updatePlayButton();
  }

  function updatePlayButton() {
    btnPlay.textContent = playing ? '⏸' : '▶';
    btnPlay.classList.toggle('primary', !playing);
    btnPlay.classList.toggle('secondary', playing);
  }

  function baseIntervalMs() {
    const v = parseInt(speedInput.value, 10) || 10;
    return Math.max(80, 550 - v * 25);
  }

  function redraw() {
    const hi =
      stepIndex >= 0 && stepIndex < steps.length ? steps[stepIndex].nodeId : null;
    V.drawTree(canvas, root, hi);
  }

  function setStatusHint(key) {
    statusHint.setAttribute('data-i18n', key);
    statusHint.textContent = I18n.t(key);
  }

  function updateStepUi() {
    const total = steps.length;
    const cur = stepIndex < 0 ? 0 : stepIndex + 1;
    const label = total === 0 ? '0 / 0' : cur + ' / ' + total;
    stepCounter.textContent = label;
    statusStepVal.textContent = label;

    const canStep = total > 0;
    btnPrev.disabled = !canStep || stepIndex <= 0;
    btnNext.disabled = !canStep || stepIndex >= total - 1;
    btnPlay.disabled = !canStep;

    if (total > 0 && statusTraversalVal) {
      statusTraversalVal.textContent = traversalDisplayName(getSelectedMode());
    } else if (statusTraversalVal) {
      statusTraversalVal.textContent = '—';
    }

    redraw();
  }

  function clearLog() {
    logContent.innerHTML = '';
    const empty = document.createElement('div');
    empty.className = 'empty-log';
    empty.setAttribute('data-i18n', 'logWelcome');
    empty.textContent = I18n.t('logWelcome');
    logContent.appendChild(empty);
  }

  function showLogForCurrentRun() {
    logContent.innerHTML = '';
    if (steps.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-log';
      empty.textContent = I18n.t('logEmpty');
      logContent.appendChild(empty);
      return;
    }
    const frag = document.createDocumentFragment();
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      const line = I18n.t('logLineVisit', { value: s.value, id: s.nodeId });
      const div = document.createElement('div');
      div.className = 'log-item';
      div.textContent = line;
      frag.appendChild(div);
    }
    logContent.appendChild(frag);
  }

  function goToStep(i) {
    if (!steps.length) {
      stepIndex = -1;
      updateStepUi();
      return;
    }
    stepIndex = Math.max(0, Math.min(i, steps.length - 1));
    updateStepUi();
    const nodes = logContent.querySelectorAll('.log-item');
    nodes.forEach(function (n) {
      n.classList.remove('highlight');
    });
    if (nodes[stepIndex]) nodes[stepIndex].classList.add('highlight');
  }

  function onGenerate() {
    stopPlayback();
    let n = parseInt(nodeCountInput.value, 10);
    if (Number.isNaN(n)) n = 7;
    n = Math.max(1, Math.min(31, n));
    nodeCountInput.value = String(n);

    root = BT.buildRandomTree(n);
    steps = [];
    stepIndex = -1;
    clearLog();
    btnStart.disabled = false;
    setStatusHint('statusHintReady');
    statusTraversalVal.textContent = '—';
    updateStepUi();
    V.drawTree(canvas, root, null);
  }

  function onStart() {
    if (!root) return;
    stopPlayback();
    const mode = getSelectedMode();
    steps = BT.getTraversalSteps(root, mode);
    stepIndex = -1;
    showLogForCurrentRun();
    setStatusHint('statusHintReady');
    if (steps.length) {
      goToStep(0);
      setStatusHint('statusHintPlaying');
    } else {
      updateStepUi();
    }
  }

  function onPrev() {
    stopPlayback();
    if (stepIndex <= 0) return;
    goToStep(stepIndex - 1);
  }

  function onNext() {
    stopPlayback();
    if (stepIndex >= steps.length - 1) return;
    goToStep(stepIndex + 1);
  }

  function tick() {
    if (stepIndex >= steps.length - 1) {
      stopPlayback();
      setStatusHint('statusHintReady');
      return;
    }
    goToStep(stepIndex + 1);
  }

  function onPlayToggle() {
    if (!steps.length) return;
    if (playing) {
      stopPlayback();
      setStatusHint('statusHintReady');
      return;
    }
    playing = true;
    updatePlayButton();
    setStatusHint('statusHintPlaying');
    if (stepIndex >= steps.length - 1) goToStep(0);
    playTimer = setInterval(tick, baseIntervalMs());
  }

  function onResize() {
    redraw();
  }

  function onSpeedChange() {
    const v = parseInt(speedInput.value, 10) || 10;
    speedValue.textContent = (v / 10).toFixed(1) + 'x';
    if (playing && playTimer) {
      clearInterval(playTimer);
      playTimer = setInterval(tick, baseIntervalMs());
    }
  }

  btnGenerate.addEventListener('click', onGenerate);
  btnStart.addEventListener('click', onStart);
  btnPlay.addEventListener('click', onPlayToggle);
  btnPrev.addEventListener('click', onPrev);
  btnNext.addEventListener('click', onNext);
  speedInput.addEventListener('input', onSpeedChange);
  window.addEventListener('resize', onResize);

  document.querySelectorAll('input[name="traversal"]').forEach(function (r) {
    r.addEventListener('change', function () {
      stopPlayback();
      steps = [];
      stepIndex = -1;
      clearLog();
      if (root) {
        setStatusHint('statusHintReady');
      } else {
        setStatusHint('statusHintIdle');
      }
      updateStepUi();
    });
  });

  langBtn.addEventListener('click', function () {
    I18n.toggleLang();
    langBtn.textContent = I18n.t('langSwitch');
    onSpeedChange();
    if (statusHint.getAttribute('data-i18n')) {
      setStatusHint(statusHint.getAttribute('data-i18n'));
    }
    if (root && steps.length) {
      const si = stepIndex;
      showLogForCurrentRun();
      if (si >= 0) goToStep(si);
    } else if (!root) clearLog();
    if (statusTraversalVal && steps.length) {
      statusTraversalVal.textContent = traversalDisplayName(getSelectedMode());
    }
  });

  I18n.apply();
  onSpeedChange();
  setStatusHint('statusHintIdle');
  btnStart.disabled = true;
  updateStepUi();
  V.drawTree(canvas, null, null);

  if (typeof ResizeObserver !== 'undefined' && canvas && canvas.parentElement) {
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas.parentElement);
  }
})();
