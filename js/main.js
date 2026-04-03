/**
 * UI: generate tree, pick traversal, play steps, i18n.
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
  /** @type {{ node: object, frozenView: { scale: number, offsetX: number, offsetY: number, drawR: number } } | null} */
  let drag = null;

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
    const el = document.querySelector('#traversal-modes input[name="traversal"]:checked');
    const v = el && typeof el.value === 'string' ? el.value.trim() : '';
    return v || 'preorder';
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
    /** @type {{ frozenView?: object, dragNodeId?: number }} */
    const opts = {};
    if (drag) {
      opts.frozenView = drag.frozenView;
      opts.dragNodeId = drag.node.id;
    }
    V.drawTree(canvas, root, hi, opts);
  }

  function canvasCssCoords(ev) {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  function endDrag(ev) {
    if (!drag) return;
    drag = null;
    canvas.style.cursor = 'default';
    if (ev && typeof ev.pointerId === 'number' && canvas.hasPointerCapture(ev.pointerId)) {
      try {
        canvas.releasePointerCapture(ev.pointerId);
      } catch (e) {
        /* ignore */
      }
    }
    redraw();
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

  function goToStep(i) {
    if (!steps.length) {
      stepIndex = -1;
      updateStepUi();
      return;
    }
    stepIndex = Math.max(0, Math.min(i, steps.length - 1));
    updateStepUi();
  }

  function onGenerate() {
    stopPlayback();
    drag = null;
    canvas.style.cursor = 'default';
    let n = parseInt(nodeCountInput.value, 10);
    if (Number.isNaN(n)) n = 7;
    n = Math.max(1, Math.min(31, n));
    nodeCountInput.value = String(n);

    root = BT.buildRandomTree(n);
    if (root) V.clearDragState(root);
    steps = [];
    stepIndex = -1;
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

  canvas.addEventListener('pointerdown', function (ev) {
    if (!root || ev.button !== 0) return;
    const { x, y } = canvasCssCoords(ev);
    const node = V.pickNodeAt(canvas, root, x, y);
    if (!node) return;
    ev.preventDefault();
    drag = { node: node, frozenView: V.getViewForDragFreeze(canvas, root) };
    try {
      canvas.setPointerCapture(ev.pointerId);
    } catch (e) {
      /* ignore */
    }
    canvas.style.cursor = 'grabbing';
  });

  canvas.addEventListener('pointermove', function (ev) {
    if (!root) return;
    if (drag) {
      ev.preventDefault();
      const { x, y } = canvasCssCoords(ev);
      const fv = drag.frozenView;
      const ax = (x - fv.offsetX) / fv.scale;
      const ay = (y - fv.offsetY) / fv.scale;
      V.layoutEffectivePositions(root);
      if (drag.node === root) {
        drag.node._rootDragDx = ax - drag.node._baseLx;
        drag.node._rootDragDy = ay - drag.node._baseLy;
      } else {
        const p = V.findParent(root, drag.node);
        if (p) {
          drag.node._dragParentDx = ax - p._lx;
          /** Abstract y grows downward; forbid child center above parent center. */
          drag.node._dragParentDy = Math.max(0, ay - p._ly);
        }
      }
      redraw();
      return;
    }
    const { x, y } = canvasCssCoords(ev);
    const node = V.pickNodeAt(canvas, root, x, y);
    canvas.style.cursor = node ? 'grab' : 'default';
  });

  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('lostpointercapture', function () {
    if (drag) {
      drag = null;
      canvas.style.cursor = 'default';
      redraw();
    }
  });

  document.querySelectorAll('input[name="traversal"]').forEach(function (r) {
    r.addEventListener('change', function () {
      stopPlayback();
      steps = [];
      stepIndex = -1;
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
    if (statusTraversalVal && steps.length) {
      statusTraversalVal.textContent = traversalDisplayName(getSelectedMode());
    }
    redraw();
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
