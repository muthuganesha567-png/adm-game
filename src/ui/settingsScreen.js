// Settings: audio, graphics, gameplay, accessibility, optional AI mentor endpoint, data reset.
import { el } from './uiManager.js';

export class SettingsScreen {
  constructor(game) { this.game = game; this.el = el('div', { id: 'settings', class: 'dim' }); this.panel = el('div', { class: 'panel' }); this.el.append(this.panel); }
  show() { this.render(); }
  hide() {}
  render() {
    const { settings: s, audio, ui } = this.game; const p = this.panel; p.innerHTML = '';
    p.append(el('h2', { text: 'Settings' }), el('p', { class: 'sub', text: 'All settings are saved automatically and applied immediately.' }));
    const group = (title) => { const g = el('div', { class: 'set-group' }, [el('h3', { text: title })]); p.append(g); return g; };
    const row = (g, label, control, desc = '') => g.append(el('div', { class: 'set-row' }, [el('label', { html: `${label}${desc ? `<span class="desc">${desc}</span>` : ''}` }), control]));
    const slider = (key, min = 0, max = 1, step = 0.05, fmt = (v) => `${Math.round(v * 100)}%`) => {
      const val = el('span', { class: 'val', text: fmt(s.get(key)) });
      const inp = el('input', { type: 'range', min, max, step, value: s.get(key), 'aria-label': key, onInput: (e) => { const v = parseFloat(e.target.value); s.set(key, v); val.textContent = fmt(v); } });
      return el('div', {}, [inp, val]);
    };
    const toggle = (key, onChange = null) => { const t = el('button', { class: `toggle ${s.get(key) ? 'on' : ''}`, role: 'switch', 'aria-checked': String(!!s.get(key)), 'aria-label': key }); t.addEventListener('click', () => { const v = !s.get(key); s.set(key, v); t.classList.toggle('on', v); t.setAttribute('aria-checked', String(v)); onChange?.(v); this.updateAudioState(); }); return t; };
    const seg = (key, options, onChange = null) => { const host = el('div', { class: 'seg' }); const render = () => { host.innerHTML = ''; for (const [v, l] of options) host.append(el('button', { class: s.get(key) === v ? 'on' : '', text: l, onClick: () => { s.set(key, v); render(); onChange?.(v); } })); }; render(); return host; };

    // Audio
    const a = group('Audio');
    this.audioState = el('div', { class: 'audio-state' }); a.append(this.audioState); this.updateAudioState();
    row(a, 'Audio enabled', toggle('audioEnabled'), 'Turns the whole audio system on or off.');
    row(a, 'Mute', toggle('muted'), 'Silences all sound without changing volume levels.');
    row(a, 'Master volume', slider('masterVolume'));
    row(a, 'Music volume', slider('musicVolume'));
    row(a, 'Sound effects volume', slider('sfxVolume'));
    a.append(el('p', { class: 'note', text: 'Browsers only allow sound after your first click or key press. All music and effects are synthesised in real time by the game, so no audio files need to load.' }));
    a.append(el('div', { class: 'btn-row' }, [el('button', { class: 'btn small', text: 'Test sound', onClick: () => { audio.unlock(); audio.sfx('success'); } })]));

    // Graphics
    const g = group('Graphics');
    row(g, 'Quality preset', seg('quality', [['low', 'Low'], ['medium', 'Medium'], ['high', 'High']]), 'Low disables shadows and reduces resolution for older computers.');
    row(g, 'Shadows', toggle('shadows'), 'Dynamic shadows (ignored on Low quality).');
    row(g, 'Particle effects', toggle('particles'), 'Dust, rain and golden particles. Applied when a scenario starts.');
    row(g, 'Reduced motion', toggle('reducedMotion', (v) => document.body.classList.toggle('reduced-motion', v)), 'Minimises interface animation and camera shake.');

    // Gameplay
    const gp = group('Gameplay');
    row(gp, 'Mouse sensitivity', slider('mouseSensitivity', 0.3, 2.5, 0.1, (v) => `${v.toFixed(1)}×`));
    row(gp, 'Invert vertical look', toggle('invertY'));
    row(gp, 'Mouse look mode', seg('mouseLook', [['drag', 'Click & drag'], ['lock', 'Pointer lock']]), 'Pointer lock captures the mouse when you click the game view (Esc releases it).');
    row(gp, 'Default vehicle camera', seg('cameraMode', [['chase', 'Chase'], ['far', 'Far'], ['hood', 'Bonnet'], ['top', 'Top']]), 'Press C during driving to cycle cameras.');
    row(gp, 'Screen shake on impact', toggle('screenShake'));
    row(gp, 'Difficulty', seg('difficulty', [['relaxed', 'Relaxed'], ['normal', 'Normal'], ['demanding', 'Demanding']]), 'Affects timers, traffic density and hazard timing. Applies to the next scenario.');
    row(gp, 'Show controls hint in HUD', toggle('showControlsHint'));
    gp.append(el('p', { class: 'small muted', html: 'Keyboard: <span class="kbd">W A S D</span>/<span class="kbd">↑ ← ↓ →</span> move or drive · <span class="kbd">E</span> interact · <span class="kbd">Space</span> emergency brake · <span class="kbd">C</span> camera · <span class="kbd">R</span> restart · <span class="kbd">Esc</span> pause · <span class="kbd">1–4</span> dialogue choices · <span class="kbd">Shift</span> run' }));

    // Accessibility
    const ac = group('Accessibility');
    row(ac, 'Subtitles for in-world dialogue', toggle('subtitles'), 'Spoken lines are also shown as text; conversation boxes are always shown.');
    ac.append(el('p', { class: 'small muted', text: 'Menus are keyboard accessible (Tab / Enter / Esc). Important information is always conveyed with text as well as colour.' }));

    // AI mentor
    const ai = group('AI Dharma Mentor (optional)');
    ai.append(el('p', { class: 'small muted', text: 'The mentor works fully offline with rule-based analysis. If you have access to an OpenAI-compatible chat-completions endpoint you may enter it here; the game will then label feedback as AI-generated when it is actually produced by that model. Keys are stored only in this browser.' }));
    const inpEndpoint = el('input', { class: 'inp', type: 'url', placeholder: 'https://api.example.com/v1/chat/completions', value: s.get('aiEndpoint'), style: 'width:100%' });
    const inpModel = el('input', { class: 'inp', type: 'text', placeholder: 'model name (e.g. gpt-4o-mini)', value: s.get('aiModel'), style: 'width:100%' });
    const inpKey = el('input', { class: 'inp', type: 'password', placeholder: 'API key (optional)', value: s.get('aiKey'), style: 'width:100%' });
    const aiStatus = el('span', { class: 'small muted', text: s.get('aiEndpoint') ? 'Endpoint configured — feedback will be requested from the model after each scenario.' : 'Not configured — rule-based mentor in use.' });
    ai.append(el('div', { style: 'display:grid;gap:0.5rem' }, [inpEndpoint, inpModel, inpKey, el('div', { class: 'btn-row' }, [
      el('button', { class: 'btn small', text: 'Save AI settings', onClick: () => { s.set('aiEndpoint', inpEndpoint.value.trim()); s.set('aiModel', inpModel.value.trim()); s.set('aiKey', inpKey.value.trim()); aiStatus.textContent = s.get('aiEndpoint') ? 'Saved. Feedback will be requested from the model after each scenario.' : 'Cleared — rule-based mentor in use.'; } }),
      el('button', { class: 'btn small', text: 'Clear', onClick: () => { inpEndpoint.value = ''; inpModel.value = ''; inpKey.value = ''; s.set('aiEndpoint', ''); s.set('aiModel', ''); s.set('aiKey', ''); aiStatus.textContent = 'Cleared — rule-based mentor in use.'; } }), aiStatus])]));

    // Data
    const d = group('Saved data');
    d.append(el('p', { class: 'small muted', text: 'Progress, history and settings are stored in this browser’s LocalStorage. Resetting cannot be undone.' }));
    d.append(el('div', { class: 'btn-row' }, [
      el('button', { class: 'btn danger small', text: 'Reset all progress & history', onClick: () => this.game.resetProgress() }),
      el('button', { class: 'btn small', text: 'Restore default settings', onClick: async () => { if (await ui.confirm({ title: 'Restore defaults?', text: 'All settings return to their default values.' })) { s.reset(); document.body.classList.toggle('reduced-motion', false); this.render(); } } }),
      el('button', { class: 'btn small', text: 'Export history (JSON)', onClick: () => this.exportJSON() }),
    ]));
    p.append(el('div', { class: 'btn-row' }, [el('button', { class: 'btn primary', text: 'Back', onClick: () => ui.back() })]));
    p.scrollTop = 0;
  }
  updateAudioState() {
    if (!this.audioState) return; const st = this.game.audio.state;
    const txt = { on: '<b>ON</b> — sound is playing', muted: '<b class="off">MUTED</b>', disabled: '<b class="off">DISABLED</b>', locked: '<b class="off">WAITING</b> — click or press a key to allow sound', unsupported: '<b class="off">UNSUPPORTED</b> in this browser' }[st];
    this.audioState.innerHTML = `Audio state: ${txt}`;
  }
  exportJSON() {
    try { const blob = new Blob([this.game.save.exportJSON()], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'dharma-decision-history.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
    catch (err) { this.game.ui.alert({ title: 'Export failed', text: err.message }); }
  }
}
