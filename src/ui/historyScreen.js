// Decision History, Dharma Journey (progress), Scoreboard (personal statistics) and Scenario Select.
import { el, esc } from './uiManager.js';
import { DIMENSIONS, gradeFor } from '../scoringEngine.js';
import { dimBars } from './resultsScreen.js';

const ACHIEVEMENTS = [
  { id: 'first-step', title: 'First Step on the Path', desc: 'Complete your first scenario.', test: (s) => s.completed >= 1 },
  { id: 'five-scenarios', title: 'Seeker', desc: 'Complete five scenarios.', test: (s) => s.completed >= 5 },
  { id: 'all-unique', title: 'The Full Circle', desc: 'Complete all ten different scenarios.', test: (s) => s.unique >= s.totalScenarios },
  { id: 'exemplary', title: 'Exemplary Conduct', desc: 'Earn a Dharma Score of 85 or more.', test: (s) => (s.best || 0) >= 85 },
  { id: 'steady', title: 'Steady Mind', desc: 'Average Dharma Score of 70+ across five or more scenarios.', test: (s) => s.completed >= 5 && (s.average || 0) >= 70 },
  { id: 'returning', title: 'Learning from Consequences', desc: 'Replay a scenario and improve on your previous best.', test: (s, hist) => { const seen = {}; for (const r of [...hist].reverse()) { if (seen[r.scenarioId] !== undefined && r.overall > seen[r.scenarioId]) return true; seen[r.scenarioId] = Math.max(seen[r.scenarioId] ?? -1, r.overall); } return false; } },
];
export function evaluateAchievements(save, totalScenarios) {
  const stats = save.getStats(totalScenarios); const hist = save.getHistory(); const unlocked = [];
  for (const a of ACHIEVEMENTS) if (a.test(stats, hist) && save.unlockAchievement(a.id)) unlocked.push(a);
  return unlocked;
}

function backRow(game, extra = []) { return el('div', { class: 'btn-row' }, [el('button', { class: 'btn primary', text: 'Back', onClick: () => game.ui.back() }), ...extra]); }

export class HistoryScreen {
  constructor(game) { this.game = game; this.el = el('div', { id: 'history', class: 'dim' }); this.panel = el('div', { class: 'panel wide' }); this.el.append(this.panel); this.sort = 'newest'; this.filter = 'all'; }
  show() { this.render(); }
  render() {
    const game = this.game; const p = this.panel; p.innerHTML = '';
    p.append(el('h2', { text: 'Decision History' }), el('p', { class: 'sub', text: 'Every completed scenario is recorded locally in your browser: actions, outcome, scores and mentor feedback.' }));
    let hist = game.save.getHistory();
    if (!hist.length) { p.append(el('div', { class: 'empty-state', html: 'No decisions recorded yet.<br>Complete a scenario and it will appear here with its outcome, scores and mentor feedback.' }), backRow(game)); return; }
    const sortSel = el('select', { class: 'sel', onChange: (e) => { this.sort = e.target.value; this.render(); } }, [['newest', 'Newest first'], ['oldest', 'Oldest first'], ['high', 'Highest score'], ['low', 'Lowest score']].map(([v, l]) => el('option', { value: v, text: l, selected: this.sort === v })));
    const names = [...new Set(hist.map((r) => r.scenarioId))];
    const filterSel = el('select', { class: 'sel', onChange: (e) => { this.filter = e.target.value; this.render(); } }, [el('option', { value: 'all', text: 'All scenarios', selected: this.filter === 'all' }), ...names.map((id) => el('option', { value: id, text: game.registry.get(id)?.name || id, selected: this.filter === id }))]);
    p.append(el('div', { class: 'hist-controls' }, [el('span', { class: 'muted small', text: 'Sort' }), sortSel, el('span', { class: 'muted small', text: 'Filter' }), filterSel, el('span', { class: 'muted small', text: `${hist.length} record${hist.length === 1 ? '' : 's'}` })]));
    if (this.filter !== 'all') hist = hist.filter((r) => r.scenarioId === this.filter);
    if (this.sort === 'oldest') hist = [...hist].reverse(); else if (this.sort === 'high') hist = [...hist].sort((a, b) => b.overall - a.overall); else if (this.sort === 'low') hist = [...hist].sort((a, b) => a.overall - b.overall);
    for (const r of hist) {
      const g = gradeFor(r.overall);
      p.append(el('div', { class: 'hist-item', tabindex: '0', role: 'button', onClick: () => game.ui.show('results', { result: r, fromHistory: true }, { push: true }), onKeydown: (e) => { if (e.key === 'Enter') game.ui.show('results', { result: r, fromHistory: true }, { push: true }); } }, [
        el('div', {}, [el('div', { class: 'name', text: r.scenarioName }), el('div', { class: 'meta', html: `${esc(new Date(r.date).toLocaleString())} · Outcome: ${esc(r.outcome.title)} · <span class="tag ${r.success ? 'ok' : 'bad'}">${r.success ? 'handled' : 'harmful/incomplete'}</span> <span class="tag ${g.tag}">${g.label}</span>` }), el('div', { class: 'meta', text: 'Click to view feedback and detailed analysis' })]),
        el('div', { class: 'score', text: r.overall }),
      ]));
    }
    p.append(backRow(game, [el('button', { class: 'btn danger', text: 'Reset All Progress', onClick: () => game.resetProgress() })]));
  }
  hide() {}
}

export class JourneyScreen {
  constructor(game) { this.game = game; this.el = el('div', { id: 'journey', class: 'dim' }); this.panel = el('div', { class: 'panel wide' }); this.el.append(this.panel); }
  show() {
    const game = this.game; const p = this.panel; p.innerHTML = ''; const total = game.registry.playable().length; const s = game.save.getStats(total);
    p.append(el('h2', { text: 'Dharma Journey' }), el('p', { class: 'sub', text: 'Your progress through the ten scenarios and your accumulated ethical scores.' }));
    if (!s.completed) p.append(el('div', { class: 'empty-state', html: 'Your journey has not begun.<br>Statistics, dimension averages and milestones will appear here after you complete scenarios.' }));
    else {
      p.append(el('div', { class: 'stat-cards' }, [
        card(s.completed, 'Scenarios completed'), card(`${s.unique}/${total}`, 'Unique scenarios'), card(s.sessions, 'Play sessions'), card(s.average ?? '—', 'Average score'), card(s.best ?? '—', 'Highest score'), card(`${Math.round((s.successCount / s.completed) * 100)}%`, 'Handled well'),
      ]));
      p.append(el('h3', { text: 'Ethical dimension averages' }), Object.keys(s.dimensionAverages).length ? dimBars(s.dimensionAverages) : el('p', { class: 'muted', text: 'No data yet.' }));
      p.append(el('h3', { text: 'Progress over time (overall score per completed scenario)' }));
      const spark = el('div', { class: 'spark' }); for (const t of s.timeline.slice(-40)) spark.append(el('span', { style: `height:${Math.max(4, t.overall)}%`, title: `${t.scenarioName}: ${t.overall} (${new Date(t.date).toLocaleDateString()})` })); p.append(spark);
    }
    p.append(el('h3', { text: 'Scenario progress' }));
    const grid = el('div', { class: 'scen-grid' });
    for (const sc of game.registry.playable()) {
      const ps = s.perScenario[sc.id]; const done = !!ps;
      grid.append(el('div', { class: `scen-card ${done ? 'done' : ''}` }, [el('div', { class: 'n', text: sc.name }), el('div', { class: 'd', text: sc.tagline }), el('div', { class: 'small', html: done ? `<span class="tag ok">Completed ×${ps.plays}</span> best ${ps.best}` : '<span class="tag">Not yet played</span>' })]));
    }
    p.append(grid);
    p.append(el('h3', { text: 'Milestones' }));
    const unlocked = new Set(s.achievements);
    for (const a of ACHIEVEMENTS) p.append(el('div', { class: `ach ${unlocked.has(a.id) ? '' : 'locked'}` }, [el('div', { class: 'ic', text: unlocked.has(a.id) ? '✓' : '·' }), el('div', {}, [el('b', { text: a.title }), el('div', { class: 'small muted', text: a.desc })])]));
    p.append(backRow(game));
  }
  hide() {}
}
function card(v, l) { return el('div', { class: 'stat-card' }, [el('div', { class: 'v', text: String(v) }), el('div', { class: 'l', text: l })]); }

export class ScoreboardScreen {
  constructor(game) { this.game = game; this.el = el('div', { id: 'scoreboard', class: 'dim' }); this.panel = el('div', { class: 'panel' }); this.el.append(this.panel); }
  show() {
    const game = this.game; const p = this.panel; p.innerHTML = ''; const total = game.registry.playable().length; const s = game.save.getStats(total); const hist = game.save.getHistory();
    p.append(el('h2', { text: 'Personal Scoreboard' }), el('p', { class: 'sub', text: 'Personal statistics stored on this device only. There is no online leaderboard.' }));
    if (!hist.length) { p.append(el('div', { class: 'empty-state', html: 'No scores yet. Your best and average Dharma Scores per scenario will appear here after you play.' }), backRow(game)); return; }
    p.append(el('div', { class: 'stat-cards' }, [card(s.best ?? '—', 'Best score'), card(s.average ?? '—', 'Average score'), card(s.completed, 'Completed'), card(s.unique, 'Unique')]));
    p.append(el('h3', { text: 'Best score per scenario' }));
    const table = el('table', { class: 'ledger' }); table.append(el('tr', { html: '<th>Scenario</th><th>Plays</th><th>Best</th><th>Average</th><th>Latest</th>' }));
    for (const sc of game.registry.playable()) {
      const rs = hist.filter((r) => r.scenarioId === sc.id); if (!rs.length) { table.append(el('tr', { html: `<td>${esc(sc.name)}</td><td colspan="4" class="muted">not played yet</td>` })); continue; }
      const avg = Math.round(rs.reduce((a, r) => a + r.overall, 0) / rs.length);
      table.append(el('tr', { html: `<td>${esc(sc.name)}</td><td>${rs.length}</td><td class="pos">${Math.max(...rs.map((r) => r.overall))}</td><td>${avg}</td><td>${rs[0].overall}</td>` }));
    }
    p.append(table);
    p.append(el('h3', { text: 'Top 10 results' }));
    const top = [...hist].sort((a, b) => b.overall - a.overall).slice(0, 10);
    const t2 = el('table', { class: 'ledger' }); t2.append(el('tr', { html: '<th>#</th><th>Scenario</th><th>Outcome</th><th>Date</th><th>Score</th>' }));
    top.forEach((r, i) => t2.append(el('tr', { html: `<td>${i + 1}</td><td>${esc(r.scenarioName)}</td><td>${esc(r.outcome.title)}</td><td>${esc(new Date(r.date).toLocaleDateString())}</td><td class="pos">${r.overall}</td>` })));
    p.append(t2, backRow(game));
  }
  hide() {}
}

export class ScenarioSelectScreen {
  constructor(game) { this.game = game; this.el = el('div', { id: 'scenario-select', class: 'dim' }); this.panel = el('div', { class: 'panel wide' }); this.el.append(this.panel); }
  show() {
    const game = this.game; const p = this.panel; p.innerHTML = '';
    p.append(el('h2', { text: 'Choose a Scenario' }), el('p', { class: 'sub', text: 'Manual selection mode. The PLAY button on the main menu uses random selection instead; both modes record to the same history.' }));
    const grid = el('div', { class: 'scen-grid' }); const completed = game.save.getCompletedMap();
    for (const sc of game.registry.playable()) {
      grid.append(el('div', { class: `scen-card ${completed[sc.id] ? 'done' : ''}` }, [
        el('div', { class: 'n', text: sc.name }), el('div', { class: 'd', text: sc.description }),
        el('div', { class: 'small muted', text: `${sc.type === 'vehicle' ? 'Driving' : sc.type === 'epic' ? 'Exploration & dialogue' : 'Character & interaction'} · ~${sc.minutes} min` }),
        el('div', {}, [el('span', { class: `tag ${completed[sc.id] ? 'ok' : ''}`, text: completed[sc.id] ? `Completed ×${completed[sc.id]}` : 'New' })]),
        el('button', { class: 'btn small primary', text: 'Play', onClick: () => game.startScenario(sc.id, { mode: 'manual' }) }),
      ]));
    }
    p.append(grid, backRow(game, [el('button', { class: 'btn', text: 'Random Scenario Instead', onClick: () => game.playRandom() })]));
  }
  hide() {}
}
