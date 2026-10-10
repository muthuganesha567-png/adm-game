// Transparent Dharma scoring: every dimension starts at a neutral 50 and is adjusted by
// scenario rules that reference recorded gameplay events. Each adjustment is logged so the
// Detailed Analysis screen can show exactly why a score moved.

export const DIMENSIONS = {
  compassion:           { label: 'Compassion',            desc: 'Care for the wellbeing of others.' },
  responsibility:       { label: 'Responsibility',        desc: 'Owning the task and its effects on people.' },
  fairness:             { label: 'Fairness',              desc: 'Giving people what is due to them.' },
  honesty:              { label: 'Honesty',               desc: 'Truthfulness in word and deed.' },
  selfControl:          { label: 'Self-Control',          desc: 'Restraint of impulse, speed and anger.' },
  consequenceAwareness: { label: 'Consequence Awareness', desc: 'Anticipating what follows from an action.' },
  safetyAwareness:      { label: 'Safety Awareness',      desc: 'Reading hazards and protecting life.' },
  practicalWisdom:      { label: 'Practical Wisdom',      desc: 'Choosing workable means for good ends.' },
  accountability:       { label: 'Accountability',        desc: 'Answering for one’s own mistakes.' },
  dutyDiscernment:      { label: 'Duty & Discernment',    desc: 'Seeing which duty applies here and now.' },
};

export const BASE_SCORE = 50;
export const clamp100 = (v) => Math.max(0, Math.min(100, Math.round(v)));

export class ScoreSheet {
  constructor(dims, base = BASE_SCORE) {
    this.dims = dims; this.values = {}; this.ledger = [];
    for (const d of dims) this.values[d] = base;
  }
  /** Adjust a dimension by delta and log the reason. */
  adjust(dim, delta, reason) {
    if (!(dim in this.values)) return this;
    this.values[dim] += delta; this.ledger.push({ dim, delta, reason });
    return this;
  }
  /** Adjust several dimensions at once: adjustMany({safetyAwareness: 10, selfControl: 5}, 'reason'). */
  adjustMany(map, reason) { for (const [d, v] of Object.entries(map)) this.adjust(d, v, reason); return this; }
  get(dim) { return clamp100(this.values[dim] ?? 0); }
  finalize() {
    const dimensions = {};
    for (const d of this.dims) dimensions[d] = clamp100(this.values[d]);
    return { dimensions, ledger: [...this.ledger], overall: overallScore(dimensions) };
  }
}

/** Overall Dharma Score = arithmetic mean of the scenario's relevant dimension scores (0–100). */
export function overallScore(dimensions) {
  const v = Object.values(dimensions); if (!v.length) return 0;
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length);
}

export function gradeFor(score) {
  if (score >= 85) return { label: 'Exemplary', tag: 'ok' };
  if (score >= 70) return { label: 'Responsible', tag: 'ok' };
  if (score >= 55) return { label: 'Developing', tag: 'blue' };
  if (score >= 40) return { label: 'Conflicted', tag: '' };
  return { label: 'Harmful Pattern', tag: 'bad' };
}

export function dimensionLabel(k) { return DIMENSIONS[k]?.label || k; }

/** Convert a recorded event list into readable action lines for the results screen. */
export function describeEvents(events, dictionary) {
  const out = [];
  for (const e of events) {
    const f = dictionary[e.type]; if (!f) continue;
    const text = typeof f === 'function' ? f(e) : f; if (!text) continue;
    out.push({ t: e.t, text });
  }
  return out;
}

export const fmtTime = (s) => { const m = Math.floor(s / 60); const r = Math.floor(s % 60); return `${m}:${r.toString().padStart(2, '0')}`; };
