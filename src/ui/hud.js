// Gameplay HUD: objective, prompt, speed, timer, inventory, progress bars, warnings, subtitles.
import { el, esc } from './uiManager.js';
import { fmtTime } from '../scoringEngine.js';

export class HUD {
  constructor(root, settings) {
    this.settings = settings;
    this.el = el('div', { id: 'hud' });
    this.el.innerHTML = `
      <div class="hud-vignette"></div>
      <div class="hud-flash"></div>
      <div class="hud-top-left"><div class="hud-objective"><div class="label">Objective</div><div class="text"></div></div></div>
      <div class="hud-top-right"><div class="hud-timer" hidden>0:00</div><div class="hud-hint"><span class="kbd">Esc</span> Pause</div></div>
      <div class="hud-bottom-left"><div class="hud-inventory" hidden><div class="label">Inventory</div><div class="items"></div></div><div class="hud-progress" hidden><div class="ptext"></div><div class="bar"><span></span></div></div><div class="hud-progress p2" hidden><div class="ptext"></div><div class="bar"><span></span></div></div></div>
      <div class="hud-bottom-center"><div class="hud-warning" hidden></div><br><div class="hud-prompt" hidden></div></div>
      <div class="hud-bottom-right"><div class="hud-speed" hidden><div class="value">0</div><div class="unit">km/h</div><div class="gear">D</div></div></div>
      <div class="hud-subtitle" hidden><span class="speaker"></span><span class="line"></span></div>
      <div class="hud-center-msg" hidden></div>
      <div class="hud-controls-hint" hidden></div>
      <div class="touch-controls" aria-label="Touch controls">
        <button data-t="up" style="left:84px;bottom:150px" aria-label="Forward">▲</button>
        <button data-t="down" style="left:84px;bottom:20px" aria-label="Back / brake">▼</button>
        <button data-t="left" style="left:16px;bottom:85px" aria-label="Left">◀</button>
        <button data-t="right" style="left:152px;bottom:85px" aria-label="Right">▶</button>
        <button data-t="action" style="right:24px;bottom:95px" aria-label="Interact">E</button>
        <button data-t="brake" class="t-brake" style="right:104px;bottom:28px;width:84px;border-radius:14px" aria-label="Emergency brake">BRAKE</button>
      </div>`;
    root.append(this.el);
    this.q = (s) => this.el.querySelector(s);
    this.objectiveEl = this.q('.hud-objective .text'); this.timerEl = this.q('.hud-timer'); this.promptEl = this.q('.hud-prompt'); this.warnEl = this.q('.hud-warning');
    this.speedEl = this.q('.hud-speed'); this.speedVal = this.q('.hud-speed .value'); this.gearEl = this.q('.hud-speed .gear');
    this.invEl = this.q('.hud-inventory'); this.invItems = this.q('.hud-inventory .items');
    this.prog = [this.q('.hud-progress:not(.p2)'), this.q('.hud-progress.p2')];
    this.subEl = this.q('.hud-subtitle'); this.centerEl = this.q('.hud-center-msg'); this.hintEl = this.q('.hud-controls-hint'); this.flashEl = this.q('.hud-flash');
    this._subTimer = null; this._centerTimer = null;
    this.setupTouch();
  }
  /** On-screen controls for touch devices; they feed the same InputManager fields the keyboard does. */
  setupTouch() {
    this.touchEl = this.q('.touch-controls');
    const coarse = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || navigator.maxTouchPoints > 0;
    this.touchAvailable = coarse;
    const input = () => window.__dharma?.input;
    for (const b of this.touchEl.querySelectorAll('button')) {
      const kind = b.dataset.t;
      const apply = (on) => {
        const t = input()?.touch; if (!t) return;
        if (kind === 'up') t.forward = on ? 1 : (t.forward > 0 ? 0 : t.forward);
        else if (kind === 'down') t.forward = on ? -1 : (t.forward < 0 ? 0 : t.forward);
        else if (kind === 'left') t.turn = on ? -1 : (t.turn < 0 ? 0 : t.turn);
        else if (kind === 'right') t.turn = on ? 1 : (t.turn > 0 ? 0 : t.turn);
        else if (kind === 'brake') t.brake = on;
        else if (kind === 'action' && on) t.action = true;
        b.classList.toggle('held', on && kind !== 'action');
      };
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); apply(true); });
      for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(ev, () => apply(false));
      b.addEventListener('contextmenu', (e) => e.preventDefault());
    }
  }
  show() { this.el.classList.add('visible'); if (this.touchAvailable) this.touchEl.classList.add('visible'); }
  hide() { this.el.classList.remove('visible'); }
  reset() {
    this.setObjective(''); this.setPrompt(''); this.setWarning(''); this.showSpeed(false); this.showTimer(false); this.setInventory(null); this.setProgress(0, null); this.setProgress(1, null);
    this.subEl.hidden = true; this.centerEl.hidden = true; this.hintEl.hidden = true;
  }
  setObjective(text) { this.objectiveEl.innerHTML = text || ''; this.objectiveEl.parentElement.style.display = text ? '' : 'none'; }
  setPrompt(html) { if (!html) { this.promptEl.hidden = true; this.promptEl.innerHTML = ''; } else { if (this.promptEl.innerHTML !== html) this.promptEl.innerHTML = html; this.promptEl.hidden = false; } }
  setWarning(text) { if (!text) { this.warnEl.hidden = true; this.warnEl.textContent = ''; } else { this.warnEl.textContent = text; this.warnEl.hidden = false; } }
  showSpeed(v) { this.speedEl.hidden = !v; const br = this.touchEl?.querySelector('.t-brake'); if (br) br.hidden = !v; }
  setSpeed(kmh, gear = 'D') { this.speedVal.textContent = Math.round(kmh); this.gearEl.textContent = gear; }
  showTimer(v) { this.timerEl.hidden = !v; }
  setTimer(seconds, urgentBelow = 20, label = '') { this.timerEl.textContent = `${label ? label + ' ' : ''}${fmtTime(Math.max(0, seconds))}`; this.timerEl.classList.toggle('urgent', seconds <= urgentBelow); this.timerEl.hidden = false; }
  setTimerText(text, urgent = false) { this.timerEl.textContent = text; this.timerEl.classList.toggle('urgent', urgent); this.timerEl.hidden = !text; }
  setInventory(items, label = 'Inventory') {
    if (!items || !items.length) { this.invEl.hidden = true; return; }
    this.invEl.hidden = false; this.invEl.querySelector('.label').textContent = label;
    this.invItems.innerHTML = items.map((i) => `<span class="item">${esc(i)}</span>`).join('');
  }
  setProgress(slot, data) { // data: { text, value (0..1), kind }
    const p = this.prog[slot]; if (!data) { p.hidden = true; return; }
    p.hidden = false; p.querySelector('.ptext').innerHTML = data.text || ''; const bar = p.querySelector('.bar'); bar.className = `bar ${data.kind || ''}`; bar.firstElementChild.style.width = `${Math.round(Math.max(0, Math.min(1, data.value)) * 100)}%`;
  }
  subtitle(speaker, line, ms = 4000) {
    if (!this.settings.get('subtitles')) return;
    this.subEl.querySelector('.speaker').textContent = speaker ? `${speaker}:` : ''; this.subEl.querySelector('.line').textContent = line; this.subEl.hidden = false;
    clearTimeout(this._subTimer); this._subTimer = setTimeout(() => { this.subEl.hidden = true; }, ms);
  }
  centerMessage(text, ms = 2500) { this.centerEl.textContent = text; this.centerEl.hidden = false; clearTimeout(this._centerTimer); this._centerTimer = setTimeout(() => { this.centerEl.hidden = true; }, ms); }
  controlsHint(html) { if (!html || !this.settings.get('showControlsHint')) { this.hintEl.hidden = true; return; } this.hintEl.innerHTML = html; this.hintEl.hidden = false; }
  flash(red = false, opacity = 0.5) { this.flashEl.classList.toggle('red', red); this.flashEl.style.opacity = opacity; setTimeout(() => { this.flashEl.style.opacity = 0; }, 120); }
}
