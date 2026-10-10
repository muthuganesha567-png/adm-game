// Main menu screen.
import { el } from './uiManager.js';

export class MainMenu {
  constructor(game) {
    this.game = game;
    this.el = el('div', { id: 'main-menu' });
    const btn = (label, action, cls = '') => el('button', { class: `btn ${cls}`, text: label, onClick: action });
    this.continueBtn = btn('Continue', () => game.continueGame());
    this.el.append(
      el('div', { class: 'title-block' }, [
        el('div', { class: 'eyebrow', text: 'Inspired by the Mahabharata' }),
        el('h1', { text: 'DHARMA DECISION' }),
        el('div', { class: 'subtitle', text: 'An AI-Based Ethical Decision-Making Simulator' }),
        el('div', { class: 'title-rule' }),
      ]),
      el('div', { class: 'menu-buttons' }, [
        btn('Play — Random Scenario', () => game.playRandom(), 'primary'),
        this.continueBtn,
        btn('How to Play', () => game.ui.show('how-to-play', {}, { push: true })),
        btn('Dharma Journey', () => game.ui.show('journey', {}, { push: true })),
        btn('Decision History', () => game.ui.show('history', {}, { push: true })),
        btn('Scoreboard', () => game.ui.show('scoreboard', {}, { push: true })),
        btn('Choose Scenario', () => game.ui.show('scenario-select', {}, { push: true })),
        btn('Settings', () => game.ui.show('settings', {}, { push: true })),
        btn('About the Project', () => game.ui.show('about', {}, { push: true })),
        btn('Return to Title', () => game.returnToTitle()),
      ]),
      el('div', { class: 'menu-footer', text: 'Understand the situation · Consider your duties · Act responsibly · Learn from the consequences' }),
    );
    this.audioHint = el('div', { class: 'audio-hint', text: 'Click or press any key to enable sound' });
    this.el.append(this.audioHint);
    window.addEventListener('dharma-audio-unlocked', () => { this.audioHint.hidden = true; });
  }
  show() {
    const active = this.game.save.getActiveScenario();
    const inMemory = !!this.game.suspendedScenario;
    this.continueBtn.textContent = inMemory ? 'Continue (resume paused scenario)' : active ? `Continue — ${this.game.registry.get(active.id)?.name || 'scenario'}` : 'Continue';
    this.audioHint.hidden = this.game.audio.unlocked || !this.game.audio.supported;
  }
  hide() {}
}
