// How to Play, scenario introduction, and About screens.
import { el, esc } from './uiManager.js';
import { DIMENSIONS } from '../scoringEngine.js';

const K = (k) => `<span class="kbd">${k}</span>`;

export class HowToPlayScreen {
  constructor(game) { this.game = game; this.el = el('div', { id: 'how-to-play', class: 'dim' }); this.panel = el('div', { class: 'panel wide' }); this.el.append(this.panel); }
  show({ firstTime = false, onBegin = null } = {}) {
    const p = this.panel; p.innerHTML = '';
    p.append(el('h2', { text: 'How to Play' }), el('p', { class: 'sub', text: 'Dharma Decision places you in situations where responsibilities conflict. You act through gameplay—driving, walking, picking things up, talking to people—and the game evaluates what you actually did.' }));
    p.append(el('div', { class: 'grid-2' }, [
      el('div', {}, [
        el('h3', { text: 'Driving scenarios' }),
        el('div', { class: 'controls-table', html: `<span class="k">${K('W')} / ${K('↑')}</span><span>Accelerate</span><span class="k">${K('S')} / ${K('↓')}</span><span>Brake, then reverse when stopped</span><span class="k">${K('A')} ${K('D')} / ${K('←')} ${K('→')}</span><span>Steer</span><span class="k">${K('Space')}</span><span>Emergency brake</span><span class="k">${K('H')}</span><span>Horn / siren where available</span><span class="k">${K('C')}</span><span>Change camera view</span>` }),
        el('h3', { text: 'Character scenarios' }),
        el('div', { class: 'controls-table', html: `<span class="k">${K('W A S D')}</span><span>Walk (relative to the camera)</span><span class="k">${K('Shift')}</span><span>Run</span><span class="k">Mouse drag</span><span>Look around (pointer lock optional in Settings)</span><span class="k">${K('E')}</span><span>Interact with the highlighted object or person</span><span class="k">${K('1')}–${K('4')}</span><span>Choose a dialogue option</span><span class="k">Scroll</span><span>Zoom camera</span>` }),
        el('h3', { text: 'Always' }),
        el('div', { class: 'controls-table', html: `<span class="k">${K('Esc')}</span><span>Pause (resume, restart, settings, main menu)</span><span class="k">${K('R')}</span><span>Restart the scenario (asks for confirmation)</span>` }),
      ]),
      el('div', {}, [
        el('h3', { text: 'Objectives and hazards' }),
        el('ul', { class: 'bullets' }, ['The objective is shown at the top-left of the screen.', 'Glowing golden markers show things you can interact with; walk close and press E.', 'Warning banners appear when a hazard is actually near—pedestrians, floodwater, unstable ground.', 'Timers appear when urgency is part of the dilemma. Speed is never rewarded by itself.', 'Scenarios end when you reach the goal, make a final decision, or when time or a serious collision ends them. You can always restart.'].map((t) => el('li', { text: t }))),
        el('h3', { text: 'The Dharma scoring system' }),
        el('p', { text: 'Each scenario evaluates the ethical dimensions relevant to it on a 0–100 scale. Every dimension starts at a neutral 50 and moves up or down according to the actions the game recorded—braking in time, returning money, verifying data, sharing credit fairly. The Overall Dharma Score is the average of the relevant dimensions. The Detailed Analysis screen lists every adjustment and its reason.' }),
        el('p', { class: 'small muted', text: 'A single bad outcome never zeroes every score: intention, process and consequence are weighed separately where the scenario can tell them apart. The score is an educational device, not a judgement of your character.' }),
        el('div', { class: 'small', html: Object.values(DIMENSIONS).map((d) => `<span class="tag">${esc(d.label)}</span>`).join(' ') }),
        el('h3', { text: 'Random selection' }),
        el('p', { text: 'PLAY and PLAY ANOTHER draw from all ten implemented scenarios, never repeating the one you just played while alternatives exist and favouring scenarios you have not completed yet. Use Choose Scenario for manual selection.' }),
      ]),
    ]));
    const row = el('div', { class: 'btn-row' });
    if (onBegin) row.append(el('button', { class: 'btn primary', text: 'Continue to the scenario', onClick: () => { this.game.save.setTutorialSeen(true); onBegin(); } }));
    else row.append(el('button', { class: 'btn primary', text: 'Back', onClick: () => this.game.ui.back() }));
    p.append(row); p.scrollTop = 0;
  }
  hide() {}
}

export class IntroScreen {
  constructor(game) { this.game = game; this.el = el('div', { id: 'intro', class: 'dim' }); this.panel = el('div', { class: 'panel' }); this.el.append(this.panel); }
  show({ intro, onBegin, mode }) {
    const p = this.panel; p.innerHTML = '';
    p.append(el('div', { class: 'intro-head' }, [el('h2', { text: intro.title }), el('span', { class: 'tag', text: mode === 'manual' ? 'Chosen manually' : 'Randomly selected' })]));
    p.append(el('p', { class: 'sub', text: intro.tagline }));
    p.append(el('p', { text: intro.description }));
    p.append(el('h3', { text: 'Your objective' }), el('p', { html: `<b>${esc(intro.objective)}</b>` }));
    if (intro.controls?.length) { p.append(el('h3', { text: 'Controls' })); p.append(el('div', { class: 'controls-table', html: intro.controls.map(([k, d]) => `<span class="k">${k.split('/').map((x) => K(x.trim())).join(' / ')}</span><span>${esc(d)}</span>`).join('') })); }
    if (intro.tips?.length) { p.append(el('h3', { text: 'Keep in mind' })); p.append(el('ul', { class: 'bullets' }, intro.tips.map((t) => el('li', { text: t })))); }
    if (intro.note) p.append(el('p', { class: 'note', text: intro.note }));
    p.append(el('p', { class: 'small muted', text: `Ethical theme: ${intro.lesson}` }));
    p.append(el('div', { class: 'btn-row' }, [el('button', { class: 'btn primary', text: 'Begin', autofocus: true, onClick: onBegin }), el('button', { class: 'btn', text: 'Main Menu', onClick: () => this.game.returnToMenu({ confirm: false }) })]));
    p.scrollTop = 0;
  }
  hide() {}
}

export class AboutScreen {
  constructor(game) { this.game = game; this.el = el('div', { id: 'about', class: 'dim' }); this.panel = el('div', { class: 'panel' }); this.el.append(this.panel); }
  show() {
    const p = this.panel; p.innerHTML = '';
    p.append(el('h2', { text: 'About the Project' }), el('p', { class: 'sub', text: 'Dharma Decision — An AI-Based Ethical Decision-Making Simulator inspired by strategic lessons from the Mahabharata.' }));
    p.append(el('h3', { text: 'Purpose' }), el('p', { text: 'This is an educational simulation. Instead of asking "what would you do?", it puts you in a 3D situation where you must actually drive, walk, pick things up, talk to people and make decisions through play. The game then evaluates what happened and the Dharma Mentor explains the competing duties, the consequences, and how a more responsible path might have looked.' }));
    p.append(el('h3', { text: 'The Mahabharata inspiration' }), el('p', { text: 'The epic is full of dharma-sankata—situations where legitimate duties collide: loyalty and truth, mercy and justice, urgency and safety. Krishna’s guidance to Arjuna on the field of Kurukshetra concerns duty, intention, self-control, discernment and acceptance of consequences. The game draws on these themes, and on episodes such as Yudhishthira’s dice game, Abhimanyu and the Chakravyuha, Karna’s loyalty and Krishna’s peace mission, as reflective lenses.' }));
    p.append(el('div', { class: 'note', text: 'All dialogue in this game—including Krishna’s lines in The Arjuna Challenge—is original writing created for the game, inspired by the themes of the epic. It is not scripture and no line should be taken as a quotation from the Mahabharata or the Bhagavad Gita. Theme texts in the mentor feedback are short retellings for reflection.' }));
    p.append(el('h3', { text: 'What the scores mean' }), el('p', { text: 'Dharma Scores are transparent, rule-based game scores computed from recorded actions. They are intended to prompt reflection; they are not a validated measure of anyone’s morality and should never be used to judge real people.' }));
    p.append(el('h3', { text: 'Technology' }), el('p', { text: 'Three.js (WebGL) for real-time 3D, plain JavaScript modules for gameplay, the Web Audio API for fully synthesised music and sound, and LocalStorage for progress. No external services or API keys are required; an optional AI endpoint can be configured in Settings and is clearly labelled when used.' }));
    p.append(el('p', { class: 'small muted', text: 'All 3D models, textures, music and sound effects are generated procedurally by the game’s own code and are original. Three.js is used under the MIT licence.' }));
    p.append(el('div', { class: 'btn-row' }, [el('button', { class: 'btn primary', text: 'Back', onClick: () => this.game.ui.back() })]));
    p.scrollTop = 0;
  }
  hide() {}
}
