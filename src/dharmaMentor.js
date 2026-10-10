// The Dharma Mentor: produces structured ethical feedback from recorded gameplay.
//  - Offline, rule-based feedback is always available (each scenario supplies its own rules).
//  - Optionally, an OpenAI-compatible chat endpoint can be configured in Settings; when it is
//    actually used the feedback is labelled "AI-generated". It is never implied otherwise.
import { DIMENSIONS } from './scoringEngine.js';

// Brief retellings of well-known Mahabharata episodes used as reflective themes.
// These are summaries written for this game, not quotations of scripture.
export const THEMES = {
  duryodhanaEnvy: { title: 'Duryodhana’s Envy', text: 'Duryodhana could not bear to see the Pandavas prosper, and every scheme that followed—the lac house, the dice game, the refusal of five villages—grew from that one unmastered feeling. The epic shows how a leader’s private envy becomes a public catastrophe.' },
  yudhishthiraTruth: { title: 'Yudhishthira’s Reputation for Truth', text: 'Yudhishthira was trusted so completely that his chariot was said not to touch the ground. That trust was built from thousands of small, unglamorous honest acts, and the one time he bent the truth—about Ashwatthama—the ground rose to meet him. Credibility is slow to earn and quick to spend.' },
  nalaDamayanti: { title: 'Nala’s Return', text: 'King Nala, ruined by dice and his own weakness, did not stay in hiding. He returned, disguised and humbled, to make his way back to Damayanti and his kingdom. The story is remembered less for the fall than for the long, honest road back.' },
  nishkamaKarma: { title: 'Acting Without Attachment to Reward', text: 'A central idea in Krishna’s counsel to Arjuna is that we are responsible for the quality of our action, not for guaranteeing its fruits. Act carefully for the right reasons, and accept that outcomes are only partly in our hands.' },
  arjunaVishada: { title: 'Arjuna’s Despondency', text: 'Before the battle Arjuna lowers his bow, overwhelmed by grief and doubt. Krishna does not shame him; he helps him see the situation clearly, distinguish duty from attachment, and act from steadiness rather than panic. Hesitation itself can be wise if it leads to clearer action.' },
  abhimanyu: { title: 'Abhimanyu and the Chakravyuha', text: 'Abhimanyu knew how to enter the wheel formation but not how to come out, and his courage ended in tragedy. Bravery without a way out is not the same as wisdom: before entering danger, know how you will leave it.' },
  yudhishthiraDice: { title: 'The Game of Dice', text: 'Yudhishthira, famed for righteousness, lost his kingdom, his brothers and Draupadi to a dice game he could not stop playing. Even a good person can be ruined by a moment’s loss of self-control. Restraint protects everything else we value.' },
  ashwatthama: { title: 'The Half-Truth about Ashwatthama', text: 'Yudhishthira announced "Ashwatthama is dead" and added, softly, "the elephant". The technically true words were meant to deceive Drona, who laid down his arms and was killed. A truth arranged to mislead carries the weight of a lie.' },
  karnaLoyalty: { title: 'Karna’s Loyalty', text: 'Karna stayed loyal to Duryodhana out of gratitude even when he knew the cause was unjust. His loyalty was genuine and his generosity famous, yet loyalty that shields wrongdoing becomes complicity. Friendship is tested by whether we help a friend do right.' },
  bhishmaVow: { title: 'Bhishma’s Vow', text: 'Bhishma kept his vow of service to the throne so rigidly that he stayed silent when Draupadi was humiliated in the assembly. A duty followed mechanically, without discernment of what the moment demands, can itself become a failure of dharma.' },
  draupadiQuestion: { title: 'Draupadi’s Question to the Assembly', text: 'When Draupadi asked the elders by what right she was staked, most stayed silent. The epic treats that silence as a moral failure in its own right. Not acting, when one could speak or help, is also a decision with consequences.' },
  krishnaEnvoy: { title: 'Krishna as Peace Envoy', text: 'Before the war Krishna went to Hastinapura to seek a settlement, asking for only five villages for the Pandavas. The attempt failed, but the epic honours it: the responsible path tries the least harmful means first and accepts conflict only when they are exhausted.' },
  ekalavya: { title: 'Ekalavya’s Thumb', text: 'Ekalavya’s skill exceeded Arjuna’s, yet Drona demanded his thumb to protect a promise to his favoured student. The story is remembered as an injustice: recognition should follow real merit and effort, not status or convenience.' },
  viduraNiti: { title: 'Vidura’s Counsel', text: 'Vidura repeatedly advised the blind king Dhritarashtra with unwelcome truths about his son’s conduct. The king heard and did nothing. Good counsel is only useful when it is acted upon—and honest counsel is a duty even when it is inconvenient.' },
  shantanuPromise: { title: 'Promises and Their Costs', text: 'The Mahabharata is full of vows made in haste—Shantanu’s, Bhishma’s, Arjuna’s—whose costs were paid by others. Before committing, consider who will bear the consequences if the promise turns out to be a mistake.' },
  dharmaSankata: { title: 'Dharma-Sankata: When Duties Collide', text: 'The epic repeatedly places its characters where two legitimate duties conflict—loyalty against truth, mercy against justice, speed against safety. It does not pretend such knots have painless solutions; it asks for discernment, honesty about trade-offs, and willingness to bear responsibility for the choice.' },
  yudhishthiraDog: { title: 'Yudhishthira and the Dog', text: 'At the end of his journey Yudhishthira refused to enter heaven without the stray dog that had followed him faithfully. The small, inconvenient act of compassion was the final test, and he passed it by not abandoning a dependent creature for his own gain.' },
  krishnaRestraint: { title: 'Krishna’s Restraint with Shishupala', text: 'Krishna forgave Shishupala a hundred insults before acting, honouring a promise to the latter’s mother. Restraint is not weakness; it is strength under control, and it leaves room for the other person to change course.' },
  karnaCharity: { title: 'Karna’s Generosity', text: 'Karna gave away his divine armour knowing it would cost him his life, because he had vowed never to refuse a request. Generosity is admirable, but the epic also invites us to ask whether a gift is wise when it endangers the giver and those who depend on him.' },
  sanjayaSight: { title: 'Sanjaya’s Clear Sight', text: 'Sanjaya was granted the ability to see the whole battlefield and report it truthfully to the king. Clear, complete information is the foundation of a responsible decision—look before you act, and report what you actually see.' },
};

export class DharmaMentor {
  constructor(settings) { this.settings = settings; }

  /** Whether an external AI endpoint is configured. */
  aiConfigured() { return !!(this.settings.get('aiEndpoint') && this.settings.get('aiEndpoint').startsWith('http')); }

  /** Normalise the rule-based feedback supplied by a scenario and resolve theme references. */
  compileRules(raw, context) {
    const theme = typeof raw.theme === 'string' ? THEMES[raw.theme] : raw.theme;
    return {
      source: 'rules',
      label: 'Rule-based Dharma Mentor (offline) — generated from your recorded actions, not by an external AI model',
      summary: raw.summary || `You completed ${context.scenarioName}.`,
      consequences: raw.consequences || 'The consequences followed directly from your actions.',
      principles: raw.principles || context.dimensions.map((d) => DIMENSIONS[d]?.label).filter(Boolean),
      tradeoffs: raw.tradeoffs || 'Every option in this situation involved competing responsibilities.',
      didWell: raw.didWell && raw.didWell.length ? raw.didWell : ['You engaged with the situation and completed the scenario.'],
      risks: raw.risks && raw.risks.length ? raw.risks : ['No significant risks were recorded.'],
      improve: raw.improve || 'Consider the situation again and look for a route that protects everyone involved.',
      theme: theme || THEMES.dharmaSankata,
      reflection: raw.reflection || 'Which of the competing duties in this situation weighed most on you, and why?',
    };
  }

  /** Optionally enrich with an external model. Always returns usable feedback. */
  async generate(rules, context) {
    const base = this.compileRules(rules, context);
    if (!this.aiConfigured()) return base;
    try {
      const text = await this._callAI(base, context);
      if (text && text.trim().length > 40) {
        return { ...base, source: 'ai', label: `AI-generated feedback (${this.settings.get('aiModel') || 'configured model'}) — rule-based analysis shown below for reference`, aiText: text.trim() };
      }
      return { ...base, aiError: 'The AI endpoint returned an empty response; showing rule-based feedback.' };
    } catch (err) {
      console.warn('[Mentor] AI request failed; falling back to rules.', err);
      return { ...base, aiError: `AI request failed (${err.message}); showing rule-based feedback.` };
    }
  }

  async _callAI(base, context) {
    const endpoint = this.settings.get('aiEndpoint'); const key = this.settings.get('aiKey'); const model = this.settings.get('aiModel') || 'gpt-4o-mini';
    const payload = {
      model, temperature: 0.6,
      messages: [
        { role: 'system', content: 'You are the Dharma Mentor in an educational game inspired by the Mahabharata. Analyse ONLY the recorded gameplay data. Explain competing duties, consequences, what went well, risks, one improvement, one Mahabharata-inspired theme (clearly marked as a retelling, never as a quotation), and one reflection question. Be balanced, concise (max 220 words), and never shame the player.' },
        { role: 'user', content: JSON.stringify({ scenario: context.scenarioName, objective: context.objective, outcome: context.outcome, actions: context.actions, scores: context.scores, ruleBasedSummary: base.summary }) },
      ],
    };
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) }, body: JSON.stringify(payload), signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || data?.content?.[0]?.text || data?.text || '';
  }
}
