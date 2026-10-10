// Save / load system: progress, decision history, statistics (LocalStorage).
const KEY = 'dharmaDecision.save.v1';

function emptySave() {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    history: [],            // completed scenario records (newest first)
    completed: {},          // scenarioId -> completion count
    recent: [],             // recently selected scenario ids (most recent last)
    sessions: 0,            // number of scenario starts
    activeScenario: null,   // { id, startedAt, mode } when a scenario was started but not finished
    tutorialSeen: false,
    achievements: [],       // ids of unlocked milestones
  };
}

export class SaveManager {
  constructor() {
    this.data = emptySave();
    this.available = true;
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const base = emptySave();
          this.data = {
            ...base,
            ...parsed,
            history: Array.isArray(parsed.history) ? parsed.history.filter((r) => r && typeof r === 'object') : base.history,
            completed: (parsed.completed && typeof parsed.completed === 'object' && !Array.isArray(parsed.completed)) ? parsed.completed : base.completed,
            recent: Array.isArray(parsed.recent) ? parsed.recent : base.recent,
            sessions: typeof parsed.sessions === 'number' && !isNaN(parsed.sessions) ? parsed.sessions : base.sessions,
            achievements: Array.isArray(parsed.achievements) ? parsed.achievements : base.achievements,
            tutorialSeen: Boolean(parsed.tutorialSeen),
          };
        }
      }
    } catch (err) {
      console.warn('[Save] Could not load save data. Starting fresh with safe defaults.', err);
      this.data = emptySave();
      this.available = false;
    }
  }

  persist() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); return true; }
    catch (err) { console.warn('[Save] Could not persist save data.', err); return false; }
  }

  // ---- progress ----
  incrementSessions() { this.data.sessions += 1; this.persist(); }
  setActiveScenario(info) { this.data.activeScenario = info; this.persist(); }
  getActiveScenario() { return this.data.activeScenario; }
  setTutorialSeen(v = true) { this.data.tutorialSeen = v; this.persist(); }
  get tutorialSeen() { return !!this.data.tutorialSeen; }

  pushRecent(id, max = 4) {
    const r = this.data.recent.filter((x) => x !== id);
    r.push(id);
    while (r.length > max) r.shift();
    this.data.recent = r;
    this.persist();
  }
  getRecent() { return [...this.data.recent]; }
  getLastPlayed() { return this.data.recent[this.data.recent.length - 1] || null; }

  getCompletedMap() { return { ...this.data.completed }; }
  isCompleted(id) { return (this.data.completed[id] || 0) > 0; }

  // ---- history ----
  addHistory(record) {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const rec = { id, ...record };
    this.data.history.unshift(rec);
    if (this.data.history.length > 300) this.data.history.length = 300;
    this.data.completed[record.scenarioId] = (this.data.completed[record.scenarioId] || 0) + 1;
    this.data.activeScenario = null;
    this.persist();
    return rec;
  }
  getHistory() { return [...this.data.history]; }
  getRecord(id) { return this.data.history.find((r) => r.id === id) || null; }

  unlockAchievement(id) {
    if (this.data.achievements.includes(id)) return false;
    this.data.achievements.push(id);
    this.persist();
    return true;
  }
  getAchievements() { return [...this.data.achievements]; }

  // ---- statistics ----
  getStats(totalScenarios = 10) {
    const h = this.data.history;
    const n = h.length;
    const unique = new Set(h.map((r) => r.scenarioId)).size;
    const scores = h.map((r) => r.overall).filter((v) => typeof v === 'number');
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const best = scores.length ? Math.max(...scores) : null;
    const successCount = h.filter((r) => r.success).length;
    // dimension averages
    const dimSums = {}; const dimCounts = {};
    for (const r of h) {
      for (const [k, v] of Object.entries(r.dimensions || {})) {
        dimSums[k] = (dimSums[k] || 0) + v; dimCounts[k] = (dimCounts[k] || 0) + 1;
      }
    }
    const dimensionAverages = {};
    for (const k of Object.keys(dimSums)) dimensionAverages[k] = Math.round(dimSums[k] / dimCounts[k]);
    // progress over time (oldest -> newest)
    const timeline = [...h].reverse().map((r) => ({ date: r.date, overall: r.overall, scenarioName: r.scenarioName }));
    const perScenario = {};
    for (const r of h) {
      const p = perScenario[r.scenarioId] || (perScenario[r.scenarioId] = { plays: 0, best: 0, last: null, name: r.scenarioName });
      p.plays += 1; p.best = Math.max(p.best, r.overall || 0); p.last = p.last || r.date;
    }
    return {
      completed: n, unique, totalScenarios, sessions: this.data.sessions, average: avg, best, successCount,
      dimensionAverages, timeline, perScenario, achievements: this.getAchievements(),
    };
  }

  // ---- reset ----
  resetAll() {
    this.data = emptySave();
    try { localStorage.removeItem(KEY); } catch (_) { /* ignore */ }
    this.persist();
  }

  exportJSON() { return JSON.stringify(this.data, null, 2); }
}
