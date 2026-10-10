// In-world conversation box. Options are chosen with mouse or number keys; a Promise resolves with the choice.
import { el, esc } from './uiManager.js';

export class DialogueBox {
  constructor(root, input, audio, hud) {
    this.input = input; this.audio = audio; this.hud = hud;
    this.el = el('div', { id: 'dialogue', role: 'dialog', 'aria-live': 'polite' });
    this.el.innerHTML = `<div class="speaker"><i></i><span class="name"></span></div><div class="text"></div><div class="options"></div><div class="foot">Choose with the mouse or press the number key</div>`;
    root.append(this.el);
    this.open = false; this._resolve = null; this._options = [];
    input.on('keydown', ({ code }) => {
      if (!this.open) return;
      const n = code.startsWith('Digit') ? parseInt(code.slice(5), 10) : code.startsWith('Numpad') ? parseInt(code.slice(6), 10) : NaN;
      if (!Number.isNaN(n) && n >= 1 && n <= this._options.length) this._choose(n - 1);
      else if ((code === 'Enter' || code === 'KeyE') && this._options.length === 1) this._choose(0);
    });
  }

  /**
   * Show a line with options. Resolves with the option's `value` (or index when no value).
   * @param {{speaker:string, text:string, options?:Array<{label:string,value?:any,danger?:boolean}>}} cfg
   */
  say({ speaker = '', text = '', options = null, subtitleOnly = false }) {
    if (subtitleOnly) { this.hud.subtitle(speaker, text); return Promise.resolve(null); }
    if (this.open) this._choose(null); // close previous
    return new Promise((resolve) => {
      this._resolve = resolve; this.open = true;
      this.el.querySelector('.name').textContent = speaker; this.el.querySelector('.text').textContent = text;
      const opts = options && options.length ? options : [{ label: 'Continue', value: null }];
      this._options = opts; const host = this.el.querySelector('.options'); host.innerHTML = '';
      opts.forEach((o, i) => host.append(el('button', { class: `btn opt ${o.danger ? 'danger' : ''}`, onClick: () => this._choose(i) }, [el('span', { class: 'num', text: `${i + 1}` }), el('span', { html: esc(o.label) })])));
      this.el.classList.add('visible'); this.hud.setPrompt('');
      this.input.exitPointerLock();
      setTimeout(() => host.firstElementChild?.focus({ preventScroll: true }), 30);
    });
  }
  _choose(i) {
    const r = this._resolve; const opts = this._options; this._resolve = null; this._options = []; this.open = false; this.el.classList.remove('visible');
    if (i !== null && opts[i]) this.audio?.sfx('click');
    r?.(i === null ? null : (opts[i].value !== undefined ? opts[i].value : i));
  }
  close() { if (this.open) this._choose(null); }

  /** Convenience: a sequence of lines with a single Continue each. */
  async lines(speaker, texts) { for (const t of texts) await this.say({ speaker, text: t }); }
}
