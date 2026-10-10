// Pause menu (Escape during gameplay).
import { el } from './uiManager.js';

export class PauseMenu {
  constructor(game) {
    this.game = game;
    this.el = el('div', { id: 'pause-menu', class: 'dim' });
    const btn = (label, action, cls = '') => el('button', { class: `btn ${cls}`, text: label, onClick: action });
    this.title = el('h2', { text: 'Paused' }); this.sub = el('p', { class: 'sub' });
    this.el.append(el('div', { class: 'panel narrow' }, [
      this.title, this.sub,
      el('div', { class: 'btn-row' }, [
        btn('Resume', () => game.resume(), 'primary'),
        btn('Restart Scenario', () => game.restartScenario(true)),
        btn('Settings', () => game.ui.show('settings', {}, { push: true })),
        btn('Main Menu', () => game.returnToMenu({ confirm: true })),
      ]),
      el('p', { class: 'small muted', html: 'Press <span class="kbd">Esc</span> to resume.' }),
    ]));
  }
  show() { const s = this.game.scenario; this.sub.textContent = s ? `${s.meta.name} — ${s.meta.objective}` : ''; }
  hide() {}
}
