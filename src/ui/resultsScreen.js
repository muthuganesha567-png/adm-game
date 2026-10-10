// Results screen and Detailed Analysis screen.
import { el, esc } from './uiManager.js';
import { DIMENSIONS, gradeFor } from '../scoringEngine.js';

function scoreRing(score) {
  const r = 62, c = 2 * Math.PI * r; const off = c * (1 - score / 100);
  const color = score >= 70 ? '#f1c75b' : score >= 45 ? '#e0922f' : '#e2574c';
  return el('div', { class: 'score-ring', html: `
    <svg width="150" height="150" viewBox="0 0 150 150"><circle cx="75" cy="75" r="${r}" stroke="rgba(255,255,255,0.1)" stroke-width="10" fill="none"/>
    <circle cx="75" cy="75" r="${r}" stroke="${color}" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" style="transition: stroke-dashoffset 1s ease"/></svg>
    <div class="num"><b>${score}</b><span>Dharma Score</span></div>` });
}
export function dimBars(dimensions) {
  const host = el('div', { class: 'dim-bars' });
  for (const [k, v] of Object.entries(dimensions)) {
    const cls = v < 40 ? 'low' : v < 65 ? 'mid' : '';
    const row = el('div', { class: 'dim', html: `<span>${esc(DIMENSIONS[k]?.label || k)}</span><div class="bar ${cls}"><span style="width:0%"></span></div><span class="v">${v}</span>` });
    host.append(row); requestAnimationFrame(() => setTimeout(() => { row.querySelector('.bar span').style.width = `${v}%`; }, 60));
  }
  return host;
}
function list(items, cls) { return el('ul', { class: `bullets ${cls}` }, items.map((t) => el('li', { html: esc(t) }))); }

export function mentorBlock(m) {
  const box = el('div', { class: 'mentor-box' });
  box.append(el('div', { class: 'src', html: `<span class="tag ${m.source === 'ai' ? 'blue' : ''}">${m.source === 'ai' ? 'AI-generated' : 'Rule-based (offline)'}</span> ${esc(m.label)}` }));
  if (m.aiError) box.append(el('div', { class: 'warn small', text: m.aiError }));
  if (m.aiText) { box.append(el('h4', { text: 'Mentor (AI model)' })); for (const p of m.aiText.split(/\n+/)) box.append(el('p', { text: p })); box.append(el('h4', { text: 'Rule-based analysis' })); }
  box.append(el('h4', { text: 'The situation and your decision' }), el('p', { text: m.summary }));
  box.append(el('h4', { text: 'Consequences' }), el('p', { text: m.consequences }));
  box.append(el('h4', { text: 'Principles involved' }), el('p', { text: (m.principles || []).join(' · ') }));
  box.append(el('h4', { text: 'Competing responsibilities' }), el('p', { text: m.tradeoffs }));
  box.append(el('div', { class: 'two-col' }, [
    el('div', {}, [el('h4', { text: 'What you did well' }), list(m.didWell, 'list-good')]),
    el('div', {}, [el('h4', { text: 'Risks or shortcomings' }), list(m.risks, 'list-bad')]),
  ]));
  box.append(el('h4', { text: 'How to improve' }), el('p', { text: m.improve }));
  box.append(el('h4', { text: `Mahabharata-inspired theme: ${m.theme.title}` }), el('p', { text: m.theme.text }), el('p', { class: 'small muted', text: 'This is a brief retelling written for the game, not a scriptural quotation.' }));
  box.append(el('h4', { text: 'Reflection' }), el('div', { class: 'reflection', text: m.reflection }));
  return box;
}

export class ResultsScreen {
  constructor(game) {
    this.game = game; this.el = el('div', { id: 'results', class: 'dim' }); this.panel = el('div', { class: 'panel wide' }); this.el.append(this.panel);
  }
  show({ result, fromHistory = false }) {
    this.result = result; const r = result; const p = this.panel; p.innerHTML = '';
    const g = gradeFor(r.overall);
    p.append(el('div', { class: 'results-head' }, [
      scoreRing(r.overall),
      el('div', { class: 'outcome-box' }, [
        el('div', { class: 'small muted', text: fromHistory ? `Played ${new Date(r.date).toLocaleString()}` : 'Scenario complete' }),
        el('h2', { text: r.scenarioName }),
        el('p', { class: 'sub', text: r.scenarioDescription }),
        el('div', {}, [el('span', { class: `tag ${r.success ? 'ok' : 'bad'}`, text: r.success ? 'Objective handled' : 'Harmful or incomplete outcome' }), ' ', el('span', { class: `tag ${g.tag}`, text: g.label }), ' ', el('span', { class: 'tag', text: r.mode === 'manual' ? 'Chosen manually' : 'Random selection' })]),
        el('div', { class: 'outcome-title', text: `Outcome: ${r.outcome.title}` }),
        el('p', { text: r.outcome.summary }),
      ]),
    ]));
    p.append(el('h3', { text: 'Objective' }), el('p', { text: r.objective }));
    p.append(el('h3', { text: 'Ethical dimension scores' }), dimBars(r.dimensions));
    p.append(el('p', { class: 'small muted', text: 'Overall Dharma Score = average of the dimensions relevant to this scenario. It is an educational game score, not a measure of anyone’s character.' }));
    p.append(el('div', { class: 'two-col' }, [
      el('div', {}, [el('h3', { text: 'Important actions' }), r.actions.length ? list(r.actions, '') : el('p', { class: 'muted', text: 'No notable actions recorded.' })]),
      el('div', {}, [el('h3', { text: 'Consequences' }), list(r.consequences, '')]),
    ]));
    p.append(el('div', { class: 'two-col' }, [
      el('div', {}, [el('h3', { text: 'Positive decisions' }), r.positives.length ? list(r.positives, 'list-good') : el('p', { class: 'muted', text: 'None recorded.' })]),
      el('div', {}, [el('h3', { text: 'Missed opportunities / risky decisions' }), r.negatives.length ? list(r.negatives, 'list-bad') : el('p', { class: 'muted', text: 'None recorded.' })]),
    ]));
    p.append(el('h3', { text: 'Dharma Mentor' }), mentorBlock(r.mentor));
    const game = this.game; const row = el('div', { class: 'btn-row' });
    if (!fromHistory) {
      row.append(el('button', { class: 'btn primary', text: 'Play Another Random Scenario', onClick: () => game.playRandom() }));
      row.append(el('button', { class: 'btn', text: 'Play Again', onClick: () => game.startScenario(r.scenarioId, { mode: r.mode }) }));
    } else row.append(el('button', { class: 'btn primary', text: 'Replay This Scenario', onClick: () => game.startScenario(r.scenarioId, { mode: 'manual' }) }));
    row.append(el('button', { class: 'btn', text: 'View Detailed Analysis', onClick: () => game.ui.show('analysis', { result: r, fromHistory }, { push: true }) }));
    row.append(el('button', { class: 'btn', text: 'Decision History', onClick: () => game.ui.show('history', {}, { push: true }) }));
    row.append(el('button', { class: 'btn', text: 'Main Menu', onClick: () => game.returnToMenu({ confirm: false }) }));
    p.append(row); p.scrollTop = 0;
  }
  hide() {}
}

export class AnalysisScreen {
  constructor(game) { this.game = game; this.el = el('div', { id: 'analysis', class: 'dim' }); this.panel = el('div', { class: 'panel wide' }); this.el.append(this.panel); }
  show({ result, fromHistory }) {
    const r = result; const p = this.panel; p.innerHTML = '';
    p.append(el('h2', { text: `Detailed Analysis — ${r.scenarioName}` }), el('p', { class: 'sub', text: `Outcome: ${r.outcome.title} · Overall ${r.overall}/100 · Duration ${Math.round(r.durationSec)}s` }));
    p.append(el('h3', { text: 'How each score was calculated' }));
    p.append(el('p', { class: 'small muted', text: 'Every relevant dimension starts at a neutral 50. Each recorded action adds or subtracts points according to the scenario’s rules, then the result is clamped to 0–100.' }));
    const table = el('table', { class: 'ledger' }); table.append(el('tr', { html: '<th>Dimension</th><th>Change</th><th>Reason</th>' }));
    for (const l of r.ledger) table.append(el('tr', { html: `<td>${esc(DIMENSIONS[l.dim]?.label || l.dim)}</td><td class="${l.delta >= 0 ? 'pos' : 'neg'}">${l.delta >= 0 ? '+' : ''}${l.delta}</td><td>${esc(l.reason)}</td>` }));
    if (!r.ledger.length) table.append(el('tr', { html: '<td colspan="3" class="muted">No adjustments recorded.</td>' }));
    p.append(table);
    p.append(el('h3', { text: 'Final dimension scores' }), dimBars(r.dimensions));
    p.append(el('h3', { text: 'Event timeline (recorded gameplay data)' }));
    const tl = el('div', { class: 'timeline' });
    for (const e of r.events) { const { type, t, ...rest } = e; const extra = Object.keys(rest).length ? ' ' + esc(JSON.stringify(rest)) : ''; tl.append(el('div', { html: `<b>${String(t).padStart(5, ' ')}s</b> ${esc(type)}${extra}` })); }
    p.append(tl);
    p.append(el('h3', { text: 'Mentor reasoning' }), el('p', { text: r.mentor.tradeoffs }), el('p', { text: r.mentor.improve }));
    p.append(el('div', { class: 'btn-row' }, [el('button', { class: 'btn primary', text: 'Back to Results', onClick: () => this.game.ui.show('results', { result: r, fromHistory }) }), el('button', { class: 'btn', text: 'Main Menu', onClick: () => this.game.returnToMenu({ confirm: false }) })]));
    p.scrollTop = 0;
  }
  hide() {}
}
