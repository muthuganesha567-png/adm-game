// Random scenario selection over the playable pool.
// Rules: never choose an unavailable scenario; never repeat the immediately previous scenario
// when an alternative exists; avoid the last few picks when the pool allows; favour scenarios
// the player has not completed yet (weighted), while keeping every scenario reachable.
export class ScenarioRandomizer {
  constructor(registry, save, rng = Math.random) { this.registry = registry; this.save = save; this.rng = rng; this.sessionRecent = []; }

  pick({ exclude = [] } = {}) {
    const pool = this.registry.playable();
    if (!pool.length) return null;
    const recent = [...new Set([...this.save.getRecent(), ...this.sessionRecent])];
    const last = this.sessionRecent[this.sessionRecent.length - 1] || this.save.getLastPlayed();
    let candidates = pool.filter((s) => !exclude.includes(s.id));
    if (!candidates.length) candidates = pool;
    // hard rule: no immediate repetition when alternatives exist
    if (last && candidates.length > 1) candidates = candidates.filter((s) => s.id !== last);
    // soft rule: avoid the recent window when enough alternatives remain
    const window = recent.slice(-3);
    const fresh = candidates.filter((s) => !window.includes(s.id));
    if (fresh.length >= 2) candidates = fresh;
    // weights: not-yet-completed scenarios are twice as likely
    const completed = this.save.getCompletedMap();
    const weights = candidates.map((s) => (completed[s.id] ? 1 : 2));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = this.rng() * total; let chosen = candidates[candidates.length - 1];
    for (let i = 0; i < candidates.length; i++) { r -= weights[i]; if (r <= 0) { chosen = candidates[i]; break; } }
    this.sessionRecent.push(chosen.id); if (this.sessionRecent.length > 6) this.sessionRecent.shift();
    return chosen;
  }

  /** Statistical self-test used by the automated test-suite: returns pick counts. */
  simulate(n = 1000) {
    const counts = {}; const saved = this.sessionRecent; this.sessionRecent = [];
    for (let i = 0; i < n; i++) { const s = this.pick(); counts[s.id] = (counts[s.id] || 0) + 1; }
    this.sessionRecent = saved; return counts;
  }
}
