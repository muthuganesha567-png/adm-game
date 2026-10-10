// In-scenario interactive panel (allocation sheets, report editors, distribution lists).
// Rendered as a DOM overlay inside #ui-root; resolves with whatever the scenario passes to close().
import { el } from './uiManager.js';

export function openGamePanel(root, { title, sub = '', render, wide = false, escapable = false }) {
  return new Promise((resolve) => {
    const body = el('div', { class: 'gp-body' });
    const panel = el('div', { class: `panel ${wide ? 'wide' : ''}`, role: 'dialog', 'aria-modal': 'true' }, [el('h2', { text: title }), sub ? el('p', { class: 'sub', html: sub }) : null, body]);
    const screen = el('div', { class: 'screen dim visible game-panel' }, [panel]);
    let closed = false;
    const close = (value) => {
      if (closed) return; closed = true; screen.classList.remove('visible'); setTimeout(() => screen.remove(), 300);
      document.removeEventListener('keydown', onKey, true);
      if (!root.querySelector('.game-panel.visible')) document.getElementById('hud')?.classList.remove('panel-open');
      resolve(value);
    };
    screen.__closePanel = close;
    const onKey = (e) => { if (escapable && e.code === 'Escape') { e.stopPropagation(); close(null); } };
    document.addEventListener('keydown', onKey, true);
    const api = { el }; api.rerender = () => { body.innerHTML = ''; render(body, close, api); };
    render(body, close, api);
    root.prepend(screen); document.getElementById('hud')?.classList.add('panel-open');
    setTimeout(() => panel.querySelector('button, [tabindex]')?.focus({ preventScroll: true }), 40);
  });
}

/** Close every open in-scenario panel (used when a scenario is restarted, suspended or disposed). */
export function closeAllPanels(root, value = null) {
  for (const p of [...root.querySelectorAll('.game-panel')]) { if (typeof p.__closePanel === 'function') p.__closePanel(value); else p.remove(); }
  document.getElementById('hud')?.classList.remove('panel-open');
}
