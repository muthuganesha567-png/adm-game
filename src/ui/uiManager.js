// UI manager: screens, modal confirmations, toasts, fade transitions, keyboard accessibility.
export function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== null && v !== undefined && v !== false) e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) { if (c === null || c === undefined) continue; e.append(typeof c === 'string' ? document.createTextNode(c) : c); }
  return e;
}
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export class UIManager {
  constructor(root, audio) {
    this.root = root; this.audio = audio; this.screens = new Map(); this.active = null; this.stack = [];
    this.toastHost = el('div', { id: 'toasts' }); root.append(this.toastHost);
    this.fadeEl = el('div', { id: 'fade' }); root.append(this.fadeEl);
    this.loadingEl = el('div', { class: 'loading-text', hidden: true }); root.append(this.loadingEl);
    this.modalEl = el('div', { id: 'modal', role: 'dialog', 'aria-modal': 'true' }); root.append(this.modalEl);
    root.addEventListener('click', (e) => { if (e.target.closest('.btn, .toggle, .seg button, .hist-item')) this.audio?.sfx('click'); });
  }

  register(id, screen) { this.screens.set(id, screen); screen.el.classList.add('screen'); screen.el.id = screen.el.id || id; this.root.append(screen.el); return screen; }
  get(id) { return this.screens.get(id); }

  show(id, data = {}, { push = false } = {}) {
    const s = this.screens.get(id); if (!s) { console.warn('[UI] unknown screen', id); return; }
    if (push && this.active && this.active !== id) this.stack.push({ id: this.active, data: this.activeData || {} });
    if (!push) this.stack = [];
    if (this.active && this.active !== id) this.screens.get(this.active)?.hide?.();
    for (const [k, sc] of this.screens) if (k !== id) sc.el.classList.remove('visible');
    this.active = id; this.activeData = data; s.show?.(data); s.el.classList.add('visible');
    const first = s.el.querySelector('[autofocus], .btn.primary, .btn'); if (first && !data.noFocus) setTimeout(() => first.focus({ preventScroll: true }), 50);
  }
  back(fallback = 'main-menu') {
    const prev = this.stack.pop(); const rest = this.stack;
    if (prev) { this.show(prev.id, prev.data || {}, { push: false }); this.stack = rest; } else this.show(fallback, {}, { push: false });
  }
  hideAll() { if (this.active) this.screens.get(this.active)?.hide?.(); for (const sc of this.screens.values()) sc.el.classList.remove('visible'); this.active = null; this.stack = []; }

  toast(text, kind = 'info', ms = 3200) {
    const t = el('div', { class: `toast ${kind}`, html: text }); this.toastHost.append(t);
    while (this.toastHost.children.length > 4) this.toastHost.firstChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 450); }, ms);
    if (kind === 'bad') this.audio?.sfx('warning'); else if (kind === 'good') this.audio?.sfx('notify');
  }

  fade(on, { fast = false, text = null } = {}) {
    this.fadeEl.classList.toggle('fast', fast); this.fadeEl.classList.toggle('on', on);
    if (text) { this.loadingEl.innerHTML = text; this.loadingEl.hidden = false; } else this.loadingEl.hidden = true;
    return new Promise((r) => setTimeout(r, fast ? 260 : 620));
  }

  /** Confirmation dialog; resolves true/false. */
  confirm({ title = 'Are you sure?', text = '', okText = 'Confirm', cancelText = 'Cancel', danger = false }) {
    return new Promise((resolve) => {
      this.modalEl.innerHTML = '';
      const done = (v) => { this.modalEl.classList.remove('visible'); this.modalEl.innerHTML = ''; window.removeEventListener('keydown', onKey, true); resolve(v); };
      const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); done(false); } if (e.key === 'Enter') { e.stopPropagation(); done(true); } };
      const ok = el('button', { class: `btn ${danger ? 'danger' : 'primary'}`, text: okText, onClick: () => done(true) });
      const cancel = el('button', { class: 'btn', text: cancelText, onClick: () => done(false) });
      this.modalEl.append(el('div', { class: 'panel narrow' }, [el('h2', { text: title }), el('p', { class: 'sub', html: text }), el('div', { class: 'btn-row' }, [ok, cancel])]));
      this.modalEl.classList.add('visible'); setTimeout(() => cancel.focus(), 30);
      window.addEventListener('keydown', onKey, true);
    });
  }
  /** Information dialog. */
  alert({ title = 'Notice', text = '', okText = 'OK' }) {
    return new Promise((resolve) => {
      this.modalEl.innerHTML = '';
      const done = () => { this.modalEl.classList.remove('visible'); this.modalEl.innerHTML = ''; window.removeEventListener('keydown', onKey, true); resolve(); };
      const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter') { e.stopPropagation(); done(); } };
      const ok = el('button', { class: 'btn primary', text: okText, onClick: done });
      this.modalEl.append(el('div', { class: 'panel narrow' }, [el('h2', { text: title }), el('div', { class: 'sub', html: text }), el('div', { class: 'btn-row' }, [ok])]));
      this.modalEl.classList.add('visible'); setTimeout(() => ok.focus(), 30);
      window.addEventListener('keydown', onKey, true);
    });
  }
  get modalOpen() { return this.modalEl.classList.contains('visible'); }
}
