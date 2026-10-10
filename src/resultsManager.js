// Builds the result record for a completed scenario: scoring, mentor feedback, persistence, milestones.
import { evaluateAchievements } from './ui/historyScreen.js';

export class ResultsManager {
  constructor(game) { this.game = game; }

  /**
   * @param scenario   the finished scenario instance
   * @param outcomeId  outcome identifier reported by the scenario
   * @param data       extra outcome data
   * @param mode       'random' | 'manual'
   */
  async build(scenario, outcomeId, data, mode) {
    const meta = scenario.meta;
    const ev = scenario.evaluate(outcomeId, data) || {};
    const sheetResult = ev.sheet ? ev.sheet.finalize() : { dimensions: {}, ledger: [], overall: 0 };
    const context = {
      scenarioName: meta.name, objective: meta.objective, dimensions: meta.dimensions,
      outcome: ev.outcome?.title || outcomeId, actions: ev.actions || [], scores: sheetResult.dimensions,
    };
    const mentor = await this.game.mentor.generate(ev.mentor || {}, context);
    const record = {
      scenarioId: meta.id, scenarioName: meta.name, scenarioDescription: meta.description, objective: meta.objective,
      date: new Date().toISOString(), mode, durationSec: scenario.time,
      outcome: { id: outcomeId, title: ev.outcome?.title || outcomeId, summary: ev.outcome?.summary || '' },
      success: !!ev.outcome?.success,
      overall: sheetResult.overall, dimensions: sheetResult.dimensions, ledger: sheetResult.ledger,
      actions: ev.actions || [], consequences: ev.consequences || [], positives: ev.positives || [], negatives: ev.negatives || [],
      mentor, events: scenario.events.slice(0, 400),
    };
    const saved = this.game.save.addHistory(record);
    const unlocked = evaluateAchievements(this.game.save, this.game.registry.playable().length);
    return { record: saved, unlocked };
  }
}
