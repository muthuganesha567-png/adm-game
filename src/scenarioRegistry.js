// Central scenario registry. Only entries whose class implements the full scenario contract
// (build / start / update / evaluate) are considered playable and offered to the randomizer.
import { RoadOfDharma } from './scenarios/roadOfDharma.js';
import { EmergencyRun } from './scenarios/emergencyRun.js';
import { LostWallet } from './scenarios/lostWallet.js';
import { TeamLeader } from './scenarios/teamLeader.js';
import { ActOfCourage } from './scenarios/actOfCourage.js';
import { FloodedBridge } from './scenarios/floodedBridge.js';
import { HonestEmployee } from './scenarios/honestEmployee.js';
import { LastResource } from './scenarios/lastResource.js';
import { FriendInTrouble } from './scenarios/friendInTrouble.js';
import { ArjunaChallenge } from './scenarios/arjunaChallenge.js';

const DRIVE_CONTROLS = [['W / ↑', 'Accelerate'], ['S / ↓', 'Brake (reverse when stopped)'], ['A / ←', 'Steer left'], ['D / →', 'Steer right'], ['Space', 'Emergency brake'], ['H', 'Horn'], ['C', 'Change camera'], ['Esc', 'Pause'], ['R', 'Restart']];
const WALK_CONTROLS = [['W A S D', 'Move'], ['Shift', 'Run'], ['Mouse drag', 'Look around'], ['E', 'Interact'], ['1-4', 'Dialogue choices'], ['Esc', 'Pause'], ['R', 'Restart']];

export const SCENARIOS = [
  {
    id: 'road-of-dharma', name: 'The Road of Dharma', type: 'vehicle', minutes: 3, music: 'road', cls: RoadOfDharma,
    tagline: 'A truck, a pedestrian, a roadside well—and only seconds to decide.',
    description: 'You drive a delivery truck along a busy Indian highway. Near a village, a pedestrian steps onto the road while a roadside well and barriers leave little room to swerve. Steer, brake and judge your speed.',
    objective: 'Reach the finish line without endangering the pedestrian or crashing into the roadside hazards.',
    lesson: 'Safety, compassion, responsibility, attention and anticipating consequences.',
    dimensions: ['safetyAwareness', 'compassion', 'responsibility', 'consequenceAwareness', 'selfControl'],
    controls: DRIVE_CONTROLS, tips: ['Your speed before the hazard decides how many options you have afterwards.', 'The horn warns people; it does not stop a truck.', 'Avoiding one danger can create another—look at the whole road.'],
  },
  {
    id: 'emergency-run', name: 'The Emergency Run', type: 'vehicle', minutes: 3, music: 'city', cls: EmergencyRun,
    tagline: 'A patient is waiting. So is a city full of people.',
    description: 'You drive an ambulance with a critical patient through city traffic: slow cars, busy intersections and pedestrian crossings. Every second matters—but so does every person on the street.',
    objective: 'Reach the hospital before the patient’s condition becomes critical, without causing avoidable danger.',
    lesson: 'Balancing urgency, compassion, public safety and responsibility.',
    dimensions: ['responsibility', 'safetyAwareness', 'compassion', 'selfControl', 'practicalWisdom', 'consequenceAwareness'],
    controls: [...DRIVE_CONTROLS.slice(0, 5), ['H', 'Siren on/off (traffic yields when it can hear you)'], ...DRIVE_CONTROLS.slice(6)],
    tips: ['Use the siren—cross traffic will try to yield when you are close enough.', 'Slow down through intersections; a crash helps nobody, least of all the patient.', 'Arriving fast by endangering pedestrians is not success.'],
  },
  {
    id: 'lost-wallet', name: 'The Lost Wallet', type: 'character', minutes: 4, music: 'park', cls: LostWallet,
    tagline: 'Nobody saw you find it. What do you do with it?',
    description: 'In a campus park you find a wallet containing cash and an identity card. A friend has an opinion, a security office exists, and somewhere the owner is searching.',
    objective: 'Decide what to do with the wallet through your actions in the park before the owner gives up and leaves.',
    lesson: 'Honesty, integrity, empathy and respect for another person’s property.',
    dimensions: ['honesty', 'compassion', 'responsibility', 'fairness', 'practicalWisdom', 'accountability'],
    controls: WALK_CONTROLS.concat([['I', 'Open inventory (wallet actions)']]), tips: ['Examine things before deciding. The ID card has a name.', 'The notice board and the security cabin exist for a reason.', 'What you do when nobody is watching is still a decision.'],
  },
  {
    id: 'team-leader', name: 'The Team Leader', type: 'character', minutes: 5, music: 'office', cls: TeamLeader,
    tagline: 'The project is done. Who gets the credit—and the blame?',
    description: 'Your student team has finished its project and the professor is coming for the presentation. Review what each person actually did, prepare the credit slide, and respond when someone objects.',
    objective: 'Prepare and present the project, distributing credit and responsibility among the team.',
    lesson: 'Fairness, leadership, honesty, accountability and respect for teamwork.',
    dimensions: ['fairness', 'honesty', 'accountability', 'responsibility', 'practicalWisdom', 'dutyDiscernment'],
    controls: WALK_CONTROLS, tips: ['People’s own accounts of their work may differ from the records.', 'A leader answers for the team’s result, not just their own part.', 'You can revise a decision if you learn you were unfair.'],
  },
  {
    id: 'act-of-courage', name: 'The Act of Courage', type: 'character', minutes: 3, music: 'river', cls: ActOfCourage,
    tagline: 'Someone is in the water. The bank is slippery and the current is strong.',
    description: 'On a riverside path a man has fallen into a fast canal and is clinging to a rock. Signs warn of deep water, the bank is unstable, and there are things nearby that might help.',
    objective: 'Help the person in the water without becoming a second victim.',
    lesson: 'Compassion, courage, practical wisdom and responsibility.',
    dimensions: ['compassion', 'safetyAwareness', 'practicalWisdom', 'responsibility', 'selfControl', 'consequenceAwareness'],
    controls: WALK_CONTROLS.concat([['P', 'Call emergency services (112)']]), tips: ['Read the situation before you act. Look around for safe resources.', 'Reach or throw before you go—rescuers follow this rule for a reason.', 'Calling for help early is an action, not a delay.'],
  },
  {
    id: 'flooded-bridge', name: 'The Flooded Bridge', type: 'vehicle', minutes: 4, music: 'rain', cls: FloodedBridge,
    tagline: 'Medicine for the village, water over the bridge, and a longer road around.',
    description: 'Driving a jeep with medical supplies in heavy rain, you reach a bridge covered by floodwater. A warning sign, a depth marker, a villager and a diversion road all offer information—if you stop to read it.',
    objective: 'Deliver the medicine to the village health post safely before the deadline.',
    lesson: 'Patience, risk assessment, foresight and responsible decision-making.',
    dimensions: ['practicalWisdom', 'safetyAwareness', 'selfControl', 'consequenceAwareness', 'responsibility', 'dutyDiscernment'],
    controls: DRIVE_CONTROLS.slice(0, 5).concat([['E', 'Talk to the villager (when stopped nearby)'], ['C', 'Change camera'], ['Esc', 'Pause'], ['R', 'Restart']]),
    tips: ['Floodwater is deeper and faster than it looks; the depth marker tells the truth.', 'Waiting can be a decision too—water levels change.', 'A longer road that arrives beats a shorter one that does not.'],
  },
  {
    id: 'honest-employee', name: 'The Honest Employee', type: 'character', minutes: 5, music: 'office', cls: HonestEmployee,
    tagline: 'The report says the welds passed. The lab data says otherwise.',
    description: 'An hour before a client review, you notice that a safety audit report you compiled contradicts the raw inspection data. A colleague made the error; you signed the final version.',
    objective: 'Decide how to handle the discovered mistake before the client review call begins.',
    lesson: 'Truthfulness, professional integrity, accountability and preventing harm.',
    dimensions: ['honesty', 'accountability', 'responsibility', 'consequenceAwareness', 'fairness', 'dutyDiscernment'],
    controls: WALK_CONTROLS, tips: ['Verify before you act—and before you accuse.', 'The compliance process exists so that errors are fixed, not hidden.', 'Who made the mistake matters less than who could still prevent the harm.'],
  },
  {
    id: 'last-resource', name: 'The Last Resource', type: 'character', minutes: 6, music: 'camp', cls: LastResource,
    tagline: 'Six families, one crate of supplies, and not enough for everyone.',
    description: 'At a flood relief camp you are handed the last crate of water, food, medicine and blankets. Six households have different needs; one is loud, one is quiet, one is urgent. Carry, inspect, deliver—and reconsider if you must.',
    objective: 'Distribute the limited supplies among the people in the camp, then confirm the distribution with the coordinator.',
    lesson: 'Justice, compassion, fairness, prioritisation and responsible use of scarce resources.',
    dimensions: ['fairness', 'compassion', 'practicalWisdom', 'responsibility', 'consequenceAwareness', 'dutyDiscernment'],
    controls: WALK_CONTROLS, tips: ['Look closely at each person before giving anything—claims and needs differ.', 'Equal is not always fair; need and urgency matter.', 'You can take items back before confirming with the coordinator.'],
  },
  {
    id: 'friend-in-trouble', name: 'The Friend in Trouble', type: 'character', minutes: 5, music: 'campus', cls: FriendInTrouble,
    tagline: 'Your friend made the mistake. Someone else is being blamed.',
    description: 'In the computer lab your friend Karan accidentally wiped the class dataset needed for tomorrow’s evaluation. The lab assistant believes Sameer did it. Karan asks you to keep quiet.',
    objective: 'Decide how to handle your friend’s mistake before the evaluation deadline.',
    lesson: 'Loyalty, truthfulness, compassion, accountability and the difference between helping a person and helping them avoid responsibility.',
    dimensions: ['honesty', 'compassion', 'fairness', 'accountability', 'practicalWisdom', 'responsibility'],
    controls: WALK_CONTROLS, tips: ['Find out what actually happened before deciding anything.', 'Helping a friend and covering for a friend are different things.', 'The person being blamed is also someone’s friend.'],
  },
  {
    id: 'arjuna-challenge', name: 'The Arjuna Challenge', type: 'epic', minutes: 6, music: 'battle', cls: ArjunaChallenge,
    tagline: 'Between two armies, a bow lowered, and a charioteer who asks questions.',
    description: 'A fictionalised dilemma inspired by Arjuna’s crisis on the field of Kurukshetra. Walk the ground between the armies, survey who stands on each side, speak with Krishna, and decide how to act—or whether to act at all.',
    objective: 'Explore, reflect with Krishna, and make a considered decision about your duty before the sun reaches its height.',
    lesson: 'Dharma, duty, discernment, self-control, responsibility and acting thoughtfully in morally difficult situations.',
    dimensions: ['dutyDiscernment', 'selfControl', 'practicalWisdom', 'compassion', 'responsibility', 'consequenceAwareness'],
    controls: WALK_CONTROLS, tips: ['Everything here is original game dialogue inspired by the epic—not scripture.', 'Picking up the bow is not the same as deciding what to do with it.', 'Krishna asks more than he answers. That is the point.'],
  },
];

function implementsContract(cls) {
  if (typeof cls !== 'function') return false;
  const p = cls.prototype;
  return ['build', 'start', 'update', 'evaluate'].every((m) => typeof p[m] === 'function' && p[m] !== Object.getPrototypeOf(p)?.[m]);
}

export class ScenarioRegistry {
  constructor() {
    this.entries = SCENARIOS.map((s) => ({ ...s, available: implementsContract(s.cls), create: (ctx) => new s.cls(ctx, s) }));
    const missing = this.entries.filter((e) => !e.available).map((e) => e.id);
    if (missing.length) console.warn('[Registry] Scenarios excluded from the playable pool (incomplete):', missing);
  }
  all() { return this.entries; }
  playable() { return this.entries.filter((e) => e.available); }
  get(id) { return this.entries.find((e) => e.id === id) || null; }
  isPlayable(id) { const e = this.get(id); return !!(e && e.available); }
}
