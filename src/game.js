// Game application: state machine and orchestration of all systems.
import { SettingsManager } from './settingsManager.js';
import { SaveManager } from './saveManager.js';
import { AudioManager } from './audioManager.js';
import { InputManager } from './inputManager.js';
import { SceneManager } from './sceneManager.js';
import { ScenarioRegistry } from './scenarioRegistry.js';
import { ScenarioRandomizer } from './scenarioRandomizer.js';
import { DharmaMentor } from './dharmaMentor.js';
import { ResultsManager } from './resultsManager.js';
import { UIManager } from './ui/uiManager.js';
import { HUD } from './ui/hud.js';
import { DialogueBox } from './ui/dialogueBox.js';
import { MainMenu } from './ui/mainMenu.js';
import { PauseMenu } from './ui/pauseMenu.js';
import { ResultsScreen, AnalysisScreen } from './ui/resultsScreen.js';
import { HistoryScreen, JourneyScreen, ScoreboardScreen, ScenarioSelectScreen } from './ui/historyScreen.js';
import { SettingsScreen } from './ui/settingsScreen.js';
import { HowToPlayScreen, IntroScreen, AboutScreen } from './ui/tutorialScreen.js';
import { MenuBackground } from './ui/menuBackground.js';
import { closeAllPanels } from './ui/gamePanel.js';

export const STATES = ['BOOT', 'MENU', 'LOADING', 'INTRO', 'PLAYING', 'PAUSED', 'COMPLETED', 'RESULTS'];

export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.settings = new SettingsManager();
    this.save = new SaveManager();
    this.audio = new AudioManager(this.settings);
    this.input = new InputManager(this.canvas);
    this.engine = new SceneManager(this.canvas, this.settings);
    this.registry = new ScenarioRegistry();
    this.randomizer = new ScenarioRandomizer(this.registry, this.save);
    this.mentor = new DharmaMentor(this.settings);
    this.results = new ResultsManager(this);
    this.uiRoot = document.getElementById('ui-root');
    this.ui = new UIManager(this.uiRoot, this.audio);
    this.hud = new HUD(this.uiRoot, this.settings);
    this.dialogue = new DialogueBox(this.uiRoot, this.input, this.audio, this.hud);
    this.state = 'BOOT'; this.scenario = null; this.mode = 'random'; this.suspendedScenario = null; this.lastResult = null;
    this.frame = 0; this.simSteps = 1; this.fps = 0; this._fpsAcc = 0; this._fpsN = 0; this.errors = [];
  }

  async init() {
    document.body.classList.toggle('reduced-motion', !!this.settings.get('reducedMotion'));
    this.ui.register('main-menu', new MainMenu(this));
    this.ui.register('pause-menu', new PauseMenu(this));
    this.ui.register('results', new ResultsScreen(this));
    this.ui.register('analysis', new AnalysisScreen(this));
    this.ui.register('history', new HistoryScreen(this));
    this.ui.register('journey', new JourneyScreen(this));
    this.ui.register('scoreboard', new ScoreboardScreen(this));
    this.ui.register('scenario-select', new ScenarioSelectScreen(this));
    this.ui.register('settings', new SettingsScreen(this));
    this.ui.register('how-to-play', new HowToPlayScreen(this));
    this.ui.register('intro', new IntroScreen(this));
    this.ui.register('about', new AboutScreen(this));
    this.menuBg = new MenuBackground(this.settings);
    this._bindGlobalKeys();
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.state === 'PLAYING') this.pause(); });
    window.addEventListener('error', (e) => { this.errors.push(String(e.message)); });
    window.addEventListener('unhandledrejection', (e) => { this.errors.push(String(e.reason?.message || e.reason)); });
    this.showMenu();
    this.engine.clock.start();
    this._loop();
    const boot = document.getElementById('boot-screen'); if (boot) { boot.classList.add('hide'); setTimeout(() => boot.remove(), 700); }
  }

  // ---------------------------------------------------------------- state helpers
  setState(s) {
    this.state = s; document.body.dataset.state = s;
    // Keyboard focus must not linger on a hidden menu button while playing: Space/Enter would re-trigger it.
    if (s === 'PLAYING' || s === 'INTRO' || s === 'LOADING') { const a = document.activeElement; if (a && a !== document.body && typeof a.blur === 'function' && !a.closest('.game-panel')) a.blur(); }
  }
  get scenarioContext() {
    return {
      game: this, engine: this.engine, input: this.input, audio: this.audio, settings: this.settings, hud: this.hud, dialogue: this.dialogue, ui: this.ui, uiRoot: this.ui.root,
      notify: (t, k = 'info') => this.ui.toast(t, k), onComplete: (o, d) => this.onScenarioComplete(o, d), difficulty: this.settings.get('difficulty'),
    };
  }

  showMenu() {
    this.setState('MENU');
    this.hud.hide(); this.hud.reset(); this.dialogue.close();
    this.engine.setActive(this.menuBg.scene, this.menuBg.camera);
    this.audio.stopGameplaySounds(); this.audio.playMusic('menu');
    this.ui.show('main-menu');
  }

  returnToTitle() {
    // Brief title splash, then the menu again (there is no window to close in a browser game).
    this.ui.fade(true, { text: 'DHARMA DECISION<small>An AI-Based Ethical Decision-Making Simulator</small>' }).then(() => setTimeout(async () => { this.showMenu(); await this.ui.fade(false); }, 900));
  }

  // ---------------------------------------------------------------- scenario flow
  playRandom() {
    const entry = this.randomizer.pick({ exclude: this.scenario ? [this.scenario.meta.id] : [] });
    if (!entry) { this.ui.alert({ title: 'No scenarios available', text: 'The scenario registry is empty.' }); return; }
    this.startScenario(entry.id, { mode: 'random' });
  }

  async startScenario(id, { mode = 'random', skipIntro = false } = {}) {
    const entry = this.registry.get(id);
    if (!entry || !entry.available) { this.ui.alert({ title: 'Scenario unavailable', text: `"${id}" is not implemented or not playable.` }); return; }
    if (this.state === 'LOADING') return;
    this.setState('LOADING');
    this.dialogue.close(); this.ui.hideAll();
    await this.ui.fade(true, { text: `${entry.name}<small>Loading scenario…</small>` });
    this._disposeScenario(); this._disposeSuspended();
    this.hud.reset(); this.hud.hide();
    this.audio.stopGameplaySounds();
    try {
      const scenario = entry.create(this.scenarioContext);
      scenario.build();
      this.scenario = scenario; this.mode = mode;
      this.engine.setActive(scenario.scene, scenario.camera);
      this.save.incrementSessions(); this.save.pushRecent(id); this.save.setActiveScenario({ id, startedAt: new Date().toISOString(), mode });
      this.audio.playMusic(entry.music);
    } catch (err) {
      console.error('[Game] Failed to build scenario', id, err);
      this.errors.push(err.message);
      await this.ui.fade(false);
      this.showMenu();
      this.ui.alert({ title: 'Could not load scenario', text: `${entry.name} failed to load: ${err.message}. Returning to the main menu.` });
      return;
    }
    this.setState('INTRO');
    await this.ui.fade(false);
    const begin = () => this.beginGameplay();
    if (skipIntro) { begin(); return; }
    const showIntro = () => this.ui.show('intro', { intro: this.scenario.getIntro(), onBegin: begin, mode });
    if (!this.save.tutorialSeen) this.ui.show('how-to-play', { firstTime: true, onBegin: showIntro });
    else showIntro();
  }

  beginGameplay() {
    if (!this.scenario) return;
    this.ui.hideAll(); this.hud.reset(); this.hud.show();
    this.setState('PLAYING');
    this.hud.controlsHint(this.scenario.meta.type === 'vehicle' ? '<span class="kbd">W A S D</span> drive · <span class="kbd">Space</span> brake · <span class="kbd">C</span> camera · <span class="kbd">Esc</span> pause' : '<span class="kbd">W A S D</span> move · drag mouse to look · <span class="kbd">E</span> interact · <span class="kbd">Esc</span> pause');
    try { this.scenario.start(); } catch (err) { console.error(err); this.errors.push(err.message); }
  }

  pause() {
    if (this.state !== 'PLAYING') return;
    this.setState('PAUSED'); this.input.exitPointerLock(); this.input.keys.clear();
    this.audio.stopEngine(); this.audio.setBrake(false);
    this.ui.show('pause-menu');
  }
  resume() {
    if (this.state !== 'PAUSED') return;
    this.ui.hideAll(); this.setState('PLAYING'); this.engine.clock.getDelta();
    if (this.scenario?.meta.type === 'vehicle') this.audio.startEngine(this.scenario.engineKind || 'truck');
  }

  async restartScenario(confirm = false) {
    if (!this.scenario) return;
    if (confirm) {
      const wasPlaying = this.state === 'PLAYING'; if (wasPlaying) this.pause();
      const ok = await this.ui.confirm({ title: 'Restart scenario?', text: 'Everything in this scenario resets: position, timers, objects and recorded actions. Your saved history is not affected.', okText: 'Restart' });
      if (!ok) return;
    }
    this.startScenario(this.scenario.meta.id, { mode: this.mode, skipIntro: true });
  }

  async returnToMenu({ confirm = false } = {}) {
    const inProgress = this.scenario && !this.scenario.finished && ['PLAYING', 'PAUSED'].includes(this.state);
    if (inProgress && confirm) {
      const ok = await this.ui.confirm({ title: 'Return to main menu?', text: 'Your position in this scenario is kept in memory—use CONTINUE to resume it. (It is lost if you close or reload the page.)', okText: 'Main menu' });
      if (!ok) return;
    }
    await this.ui.fade(true, { fast: true });
    if (inProgress) { closeAllPanels(this.uiRoot); this._disposeSuspended(); this.suspendedScenario = { scenario: this.scenario, mode: this.mode }; this.scenario.player?.deactivate?.(); this.scenario = null; }
    else this._disposeScenario();
    this.showMenu();
    await this.ui.fade(false, { fast: true });
  }

  async continueGame() {
    if (this.suspendedScenario) {
      const { scenario, mode } = this.suspendedScenario; this.suspendedScenario = null;
      await this.ui.fade(true, { fast: true });
      this.scenario = scenario; this.mode = mode; this.ui.hideAll();
      this.engine.setActive(scenario.scene, scenario.camera); this.hud.show();
      this.audio.playMusic(scenario.meta.music); if (scenario.meta.type === 'vehicle') this.audio.startEngine(scenario.engineKind || 'truck');
      scenario.player?.activate?.();
      this.setState('PLAYING'); this.engine.clock.getDelta();
      await this.ui.fade(false, { fast: true });
      this.ui.toast(`Resumed: ${scenario.meta.name}`, 'info');
      return;
    }
    const active = this.save.getActiveScenario();
    if (active && this.registry.isPlayable(active.id)) {
      const entry = this.registry.get(active.id);
      const ok = await this.ui.confirm({ title: 'Continue your journey', text: `You were playing <b>${entry.name}</b> (started ${new Date(active.startedAt).toLocaleString()}). Mid-scenario positions are not stored between sessions, so it will restart from its beginning. Continue?`, okText: 'Continue' });
      if (ok) this.startScenario(active.id, { mode: active.mode || 'random' });
      return;
    }
    const ok = await this.ui.confirm({ title: 'Nothing to continue', text: 'There is no scenario in progress. Would you like to start a new random scenario?', okText: 'Start new scenario', cancelText: 'Back' });
    if (ok) this.playRandom();
  }

  onScenarioComplete(outcomeId, data) {
    if (this.state !== 'PLAYING' && this.state !== 'PAUSED') return;
    this.setState('COMPLETED');
    this.input.exitPointerLock(); this.dialogue.close();
    this.audio.stopGameplaySounds();
    this.hud.centerMessage('Scenario complete', 1800);
    this.audio.sfx('chime');
    const scenario = this.scenario; const mode = this.mode;
    setTimeout(async () => {
      if (this.scenario !== scenario) return;
      try {
        await this.ui.fade(true, { text: 'Dharma Mentor<small>Evaluating your decisions…</small>' });
        const { record, unlocked } = await this.results.build(scenario, outcomeId, data, mode);
        this.lastResult = record; this.hud.hide();
        this.setState('RESULTS'); this.audio.playMusic('results');
        this.ui.show('results', { result: record });
        await this.ui.fade(false);
        for (const a of unlocked) this.ui.toast(`Milestone unlocked: <b>${a.title}</b>`, 'good', 4500);
      } catch (err) {
        console.error('[Game] Results failed', err); this.errors.push(err.message);
        await this.ui.fade(false); this.ui.alert({ title: 'Could not build results', text: err.message }); this.showMenu();
      }
    }, 1500);
  }

  async resetProgress() {
    const ok = await this.ui.confirm({ title: 'Reset all progress?', text: 'This permanently deletes your decision history, statistics and milestones on this device. Settings are kept.', okText: 'Delete everything', danger: true });
    if (!ok) return;
    this.save.resetAll(); this.randomizer.sessionRecent = [];
    this.ui.toast('All progress has been reset.', 'info');
    if (this.ui.active) this.ui.show(this.ui.active, {}, { push: false });
  }

  // ---------------------------------------------------------------- internals
  _disposeScenario() { closeAllPanels(this.uiRoot); if (this.scenario) { try { this.scenario.player?.dispose?.(); this.scenario.dispose(); } catch (err) { console.warn(err); } this.scenario = null; } }
  _disposeSuspended() { if (this.suspendedScenario) { try { this.suspendedScenario.scenario.player?.dispose?.(); this.suspendedScenario.scenario.dispose(); } catch (err) { console.warn(err); } this.suspendedScenario = null; } }

  _bindGlobalKeys() {
    this.input.on('keydown', ({ code }) => {
      if (this.ui.modalOpen) return;
      if (code === 'Escape') {
        if (this.state === 'PLAYING') this.pause();
        else if (this.state === 'PAUSED') { if (this.ui.active === 'pause-menu') this.resume(); else this.ui.back('pause-menu'); }
        else if (this.state === 'MENU' && this.ui.active && this.ui.active !== 'main-menu') this.ui.back();
        else if (this.state === 'RESULTS' && this.ui.active !== 'results') this.ui.back('results');
      }
      if (code === 'KeyR' && this.state === 'PLAYING' && !this.dialogue.open) this.restartScenario(true);
    });
  }

  _loop() {
    requestAnimationFrame(() => this._loop());
    const dt = Math.min(this.engine.clock.getDelta(), 0.05);
    this.frame++; this._fpsAcc += dt; this._fpsN++; if (this._fpsAcc >= 1) { this.fps = Math.round(this._fpsN / this._fpsAcc); this._fpsAcc = 0; this._fpsN = 0; }
    try {
      switch (this.state) {
        case 'MENU': this.menuBg.update(dt); break;
        case 'PLAYING': if (this.scenario) { const steps = Math.max(1, Math.min(8, this.simSteps | 0 || 1)); for (let i = 0; i < steps && this.state === 'PLAYING'; i++) { this.scenario.update(dt); if (i < steps - 1) this.input.endFrame(); } } break;
        case 'INTRO': case 'COMPLETED': case 'RESULTS': if (this.scenario) this.scenario.updateIdle?.(dt); break;
        default: break;
      }
      this.engine.render(dt);
    } catch (err) {
      // Never let a single frame error freeze the game permanently.
      if (!this._lastErr || this._lastErr !== err.message) { console.error('[Game] frame error', err); this.errors.push(err.message); this._lastErr = err.message; }
      if (this.state === 'PLAYING' && this.scenario && ++this._frameErrors > 120) { this._frameErrors = 0; this.ui.toast('The scenario hit an internal error and was stopped. Returning to the menu.', 'bad'); this.returnToMenu({ confirm: false }); }
    }
    this.input.endFrame();
  }
}
