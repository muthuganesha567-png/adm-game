# DHARMA DECISION — An AI-Based Ethical Decision-Making Simulator

A browser-based 3D game (Three.js / WebGL / HTML / CSS / JavaScript) in which you are placed inside
ten different situations where duties collide — a truck on a village road, an ambulance in city
traffic, a wallet in a park, a relief camp with too little to share, a chariot between two armies —
and the game evaluates **what you actually did**, scores it on ethical dimensions, and explains the
reasoning through a Dharma Mentor inspired by the Mahabharata.

It is not a quiz. Every scenario is played in a 3D world with its own controls, mechanics, timers,
hazards, characters and consequences. Scores and feedback are derived only from the recorded
gameplay events of the run you just played.

---

## Contents

1. [Purpose](#1-purpose)
2. [Features](#2-features)
3. [Technology](#3-technology)
4. [Install and launch (exact commands)](#4-install-and-launch)
5. [Project structure](#5-project-structure)
6. [Controls and the ten scenarios](#6-controls-and-the-ten-scenarios)
7. [How random scenario selection works](#7-random-scenario-selection)
8. [Dharma scoring method](#8-dharma-scoring-method)
9. [The Dharma Mentor — offline rules and the optional AI hook](#9-the-dharma-mentor)
10. [Save data, history, reset](#10-save-data)
11. [Settings](#11-settings)
12. [Architecture and game state machine](#12-architecture)
13. [Automated tests that were actually run](#13-tests)
14. [Troubleshooting](#14-troubleshooting)
15. [Known limitations](#15-known-limitations)
16. [Assets, licences and respectful treatment of the epic](#16-assets-and-licences)

---

## 1. Purpose

Dharma Decision is an educational simulation. Instead of asking "what would you do?", it puts you
in a situation where you must drive, walk, pick things up, talk to people and decide under pressure.
Afterwards the game reconstructs what happened, shows the consequences, scores the relevant ethical
dimensions and offers a reflection rooted in themes from the Mahabharata (nishkama karma,
Arjuna's despondency, Abhimanyu and the chakravyuha, Yudhishthira's dice game, Karna's loyalty,
Vidura's counsel, and others).

## 2. Features

* **Cinematic main menu** — animated 3D background with golden particles, procedural music,
  buttons: *Play (random scenario)*, *Continue*, *How to Play*, *Dharma Journey*,
  *Decision History*, *Scoreboard* (personal, local statistics only — there is no online
  leaderboard), *Choose Scenario* (manual mode), *Settings*, *About*, *Return to Title*.
* **Ten distinct playable 3D scenarios** (two driving, one driving-in-rain, seven third-person
  character scenarios) — see section 6.
* **Central scenario registry and randomizer** — no immediate repeats, recent-window avoidance,
  not-yet-completed scenarios weighted higher, manual selection as a separate mode.
* **Dharma scoring** on ten dimensions (0–100), a relevant subset per scenario, every adjustment
  logged with its reason and shown in *Detailed Analysis*.
* **Dharma Mentor** — deterministic rule-based feedback that works fully offline, plus an optional
  OpenAI-compatible endpoint hook; feedback is always labelled as rule-based or AI-generated.
* **Results screen** after every scenario (outcome, actions, consequences, scores, strengths,
  risks, mentor feedback, lesson, reflection question, improvement) with *Play Again*,
  *Play Another Random Scenario*, *View Detailed Analysis*, *Decision History*, *Main Menu*.
* **Decision History** and **Dharma Journey** (LocalStorage; records, statistics, dimension
  averages, milestones, progress through all ten scenarios) with honest empty states and a
  confirmed *Reset All Progress*.
* **Audio** entirely procedural (Web Audio synthesis): menu and per-scenario music beds, engine,
  brakes, collisions, footsteps, interaction sounds, siren, rain, conch and drums for the
  battlefield; master/music/SFX volume and mute; autoplay-restriction handling.
* **Settings** — audio, graphics (Low/Medium/High, shadows, particles, reduced motion), gameplay
  (mouse sensitivity, invert look, pointer-lock vs drag, default vehicle camera, screen shake,
  difficulty), accessibility (subtitles, high contrast, larger UI text, keyboard navigation).
* **Game state machine** with pause menu that genuinely freezes physics, timers and NPCs;
  restart that resets a scenario without touching history; defined completion/failure for every
  scenario; nothing can leave the player permanently stuck.

## 3. Technology

* Three.js r160 (vendored in `vendor/three/`, MIT licence) — no build step, no bundler, no npm
  dependencies at runtime. Plain ES modules.
* HTML5 / CSS3 / modern JavaScript (ES2020 modules, async/await).
* Web Audio API for all sound (nothing is downloaded or streamed).
* LocalStorage for settings, history and progress.
* Any static file server works; `serve.py` (Python standard library only) is included.

## 4. Install and launch

Because the game uses ES modules, it must be served over HTTP (opening `index.html` directly with
`file://` is blocked by browsers). No installation step is required.

**Option A — Python (recommended, no dependencies):**

```bash
cd dharma-decision
python serve.py 8000
# then open http://localhost:8000 in Chrome, Edge or Firefox
```

On some systems the command is `python3 serve.py 8000`.

**Option B — Node.js:**

```bash
cd dharma-decision
npx serve -l 8000 .          # or:  npm start   (runs the same python server)
# open http://localhost:8000
```

**Option C — VS Code:** open the folder and use the *Live Server* extension on `index.html`.

Requirements: a desktop browser with WebGL 2 (Chrome 90+, Edge 90+, Firefox 90+, Safari 15+),
a keyboard and a mouse. An integrated GPU is enough — use *Settings → Graphics → Low* on older
machines.

## 5. Project structure

```
dharma-decision/
├── index.html                   entry page (loads src/main.js as a module)
├── README.md                    this document
├── package.json                 npm start / npm test convenience scripts
├── serve.py                     dependency-free static server
├── styles/main.css              all interface styling (menus, HUD, dialogue, panels, results)
├── vendor/three/                three.module.js r160 + LICENSE (MIT)
├── assets/CREDITS.md            asset provenance (everything is procedural)
├── src/
│   ├── main.js                  boot: creates Game, exposes window.__dharma for tests
│   ├── game.js                  state machine, scenario lifecycle, pause/restart/continue
│   ├── sceneManager.js          renderer, quality presets, active scene/camera, shake, resize
│   ├── inputManager.js          keyboard/mouse/pointer-lock/touch, per-frame pressed keys
│   ├── audioManager.js          Web Audio synthesis: music beds, SFX, loops, engine, volumes
│   ├── settingsManager.js       settings schema, persistence, change events
│   ├── saveManager.js           LocalStorage: history, statistics, recent/completed, reset
│   ├── scenarioRegistry.js      metadata for all ten scenarios (dimensions, controls, tips)
│   ├── scenarioRandomizer.js    random selection rules + self-test simulation
│   ├── scoringEngine.js         ten dimensions, ScoreSheet with reasoned ledger, overall score
│   ├── dharmaMentor.js          rule-based mentor, Mahabharata theme library, optional AI hook
│   ├── resultsManager.js        builds the result record, saves history, milestones
│   ├── scenarioBase.js          base class: events, timers, dialogue helpers, finish()
│   ├── engine/
│   │   ├── worldKit.js          procedural builders: roads, buildings, trees, vehicles, humans…
│   │   ├── collision.js         AABB/circle/OBB tests and resolution
│   │   ├── vehicleController.js arcade vehicle physics, chase cameras, LaneCar traffic AI
│   │   ├── characterController.js third-person character, camera occlusion, footsteps
│   │   └── interactionSystem.js proximity interactables with prompts and priorities
│   ├── scenarios/
│   │   ├── _bases.js            VehicleScenario / CharacterScenario shared plumbing
│   │   ├── roadOfDharma.js      1  truck, pedestrian, roadside well
│   │   ├── emergencyRun.js      2  ambulance, traffic lights, siren, pedestrians
│   │   ├── lostWallet.js        3  park, wallet, owner, friend, canteen, security cabin
│   │   ├── teamLeader.js        4  project room, log, credit sheet, professor, complaint
│   │   ├── actOfCourage.js      5  riverside, person in the water, lifebuoy, bystander, 112
│   │   ├── floodedBridge.js     6  jeep in rain, causeway, depth gauge, diversion, waiting
│   │   ├── honestEmployee.js    7  office, inspection log, report editor, manager, compliance
│   │   ├── lastResource.js      8  relief camp, inventory, six families, coordinator
│   │   ├── friendInTrouble.js   9  campus lab, access log, snapshot restore, professor
│   │   └── arjunaChallenge.js   10 Kurukshetra, chariot, Krishna dialogue, survey, resolve
│   └── ui/
│       ├── uiManager.js         screen stack, toasts, fade, confirm dialogs
│       ├── mainMenu.js, menuBackground.js, pauseMenu.js
│       ├── hud.js, dialogueBox.js, gamePanel.js
│       ├── tutorialScreen.js    How to Play, scenario intro, scenario select, About
│       ├── resultsScreen.js     results + detailed analysis
│       ├── historyScreen.js     Decision History, Dharma Journey, Scoreboard
│       └── settingsScreen.js
└── tests/                       Playwright-based automated checks (see section 13)
```

There are no placeholder files; every module above is used by the game.

## 6. Controls and the ten scenarios

**Driving scenarios (1, 2, 6)**

| Key | Action |
|---|---|
| W / ↑ | Accelerate |
| S / ↓ | Brake; reverse when stopped |
| A / ← , D / → | Steer |
| Space | Emergency brake |
| H | Horn (scenario 1) / Siren on-off (scenario 2) |
| C | Change camera (chase / high chase / bonnet) |
| E | Talk to the villager when stopped near him (scenario 6) |
| Esc | Pause |
| R | Restart (asks for confirmation) |

**Character scenarios (3, 4, 5, 7, 8, 9, 10)**

| Key | Action |
|---|---|
| W A S D | Move (relative to the camera) |
| Shift | Run |
| Mouse drag (or pointer lock, see Settings) | Look around |
| E | Interact with the highlighted object/person |
| 1–4 | Choose a dialogue option |
| I | Open the inventory (scenario 3 — wallet actions) |
| P | Call emergency services (scenario 5) |
| Esc | Pause |
| R | Restart |

Touch controls appear automatically on touch screens (basic support only).

| # | Scenario | Setting and mechanics | Objective | Possible outcomes |
|---|---|---|---|---|
| 1 | **The Road of Dharma** | Delivery truck on a village highway; a pedestrian steps out, a roadside well limits your swerve; speed-scaled hazard trigger | Reach the delivery point without endangering the pedestrian or crashing | safe pass · pedestrian endangered · hit the hazard · arrived with damage · hit pedestrian · crash · timeout |
| 2 | **The Emergency Run** | Ambulance through a city avenue with traffic lights, cross traffic that yields to the siren, slow cars, pedestrians, patient timer | Reach the hospital bay within the time window without endangering others | arrived safe and timely · arrived in time but reckless · arrived late · failed · crash · hit pedestrian |
| 3 | **The Lost Wallet** | Campus park, third person; wallet with cash and ID; owner searching; friend with an opinion; canteen; notice board; security cabin | Decide what to do with the wallet before the owner gives up | returned intact · returned via security · returned after taking money · took money · kept wallet · discarded · walked away · never engaged |
| 4 | **The Team Leader** | Project room; contribution log in a cabinet; four teammates; credit sheet (20 points + lead presenter); professor asks who is responsible; complaint phase; revision possible | Allocate credit fairly and answer for the team | fair and accountable · fair allocation · corrected after complaint · unfair · self-serving · no allocation |
| 5 | **An Act of Courage** | Riverside at dusk; a man clinging in the current; grip timer; phone (P); tea-stall owner; lifebuoy with rope and bamboo pole; slippery steps; a child near the edge | Get him out without creating a second casualty | rescued safely · rescued alone · rescued with injury · rescued by the emergency team · both in danger · lost grip (help coming / no help) · left |
| 6 | **The Flooded Bridge** | Jeep in heavy rain; flood warning sign; depth gauge; barrier; villager; the water drops over time; signed diversion (Upper Road); clinic timer | Deliver medicine to the health post | arrived via diversion · waited then crossed safely · crossed recklessly · stranded (stalled) · swept away · clinic closed |
| 7 | **The Honest Employee** | Office; inspection log cabinet; report editor; colleague who made the mistake; manager who wants it sent; compliance box; client-call timer | Decide what happens to a false figure before 17:00 | corrected and reported · corrected quietly · corrected but blamed · reported but uncorrected · concealed · blamed colleague · destroyed evidence · ignored · not discovered |
| 8 | **The Last Resource** | Relief camp at nightfall; depot with 6 water, 4 food, 2 medical kits, 3 blankets; carry 4 at a time; six people whose stated and real needs differ; coordinator | Distribute the last supplies, then confirm | well prioritised · reasonable · poor distribution · misallocated medicine · nothing distributed |
| 9 | **A Friend in Trouble** | Campus lab; the friend deleted shared data; access log; backup snapshot; lab manager; the person being blamed; professor's door | Find out what happened and decide what to do about it | truth with friend and amends · truth reported without friend · restored but silent · concealed · blamed Sameer · tampered logs · ignored |
| 10 | **The Arjuna Challenge** | Cinematic Kurukshetra; chariot with Arjuna and Krishna as mentor; survey mound; elders across the line; wounded soldier; dialogue topics; resolve gated by reflection | Decide whether and how to act, after genuine reflection | informed resolve · sought peace then resolved · hasty resolve · withdrew after reflection · withdrew impulsively · charged in anger · paralysis |

All dialogue in the game — including every line spoken by Krishna — is original writing created
for the game and labelled as such in the scenario intro, the About screen and the results.
No line is presented as a quotation from the Mahabharata or the Bhagavad Gita.

## 7. Random scenario selection

`src/scenarioRandomizer.js`:

1. Candidates are all ten scenarios (only scenarios marked `available` — all ten are).
2. **Hard rule:** the scenario just played (this session, or the last one saved) is excluded when
   any alternative exists — *Play Another Random Scenario* therefore never repeats immediately.
3. **Soft rule:** the last three played scenarios are avoided while at least two fresh candidates
   remain.
4. **Weighting:** scenarios you have never completed are twice as likely as completed ones, so new
   players see variety first; everything remains replayable.
5. Recent and completed scenarios are tracked in LocalStorage and in the session.
6. *Choose Scenario* on the main menu is a separate manual mode; both modes record to the same
   history (manual plays are tagged *chosen manually*).

## 8. Dharma scoring method

Ten dimensions: Compassion, Responsibility, Fairness, Honesty, Self-Control, Consequence
Awareness, Safety Awareness, Practical Wisdom, Accountability, Duty & Discernment.

* Each scenario evaluates a relevant subset of 5–6 dimensions (listed in the registry).
* Every relevant dimension starts at a neutral **50**.
* The scenario's `evaluate()` reads the **recorded gameplay events** (speed at the hazard, whether
  the log was read before deciding, who received the medical kits, how long you waited at the
  water, what you told the professor…) and applies documented adjustments, each with a reason.
* Dimensions are clamped to 0–100. **Overall score = arithmetic mean of the relevant dimensions.**
* One bad outcome lowers the dimensions it touches; it does not zero everything — a crash in the
  Emergency Run still credits the siren use that let people yield.
* The *Detailed Analysis* screen shows the full ledger (dimension, change, reason) and the raw
  event timeline so the computation is transparent.
* Grades: ≥85 Exemplary, ≥70 Responsible, ≥55 Developing, ≥40 Conflicted, otherwise Harmful or
  incomplete. The score is an educational game score, not a measure of anyone's character — this
  disclaimer is shown on the results screen.

## 9. The Dharma Mentor

`src/dharmaMentor.js` produces, for every completed scenario: key actions, a summary, the
consequences, the principles involved, the trade-offs, strengths, risks, concrete improvements, a
Mahabharata-inspired theme (short retelling for reflection, never a fabricated quotation) and a
reflection question.

* **Offline / default mode:** scenario-specific rule templates in each scenario's `evaluate()` plus
  the mentor's theme library. Deterministic for the same events. Labelled on screen as
  *"Rule-based feedback (offline)"*. No network access, no API key.
* **Optional AI mode:** *Settings → Dharma Mentor* accepts an OpenAI-compatible
  chat-completions endpoint URL, a model name and an optional API key. After a scenario the game
  sends the scenario description, the recorded actions, outcome and scores and asks for feedback
  in the same structure. If the request succeeds the text is shown and labelled
  *"AI-generated feedback (model) — rule-based analysis shown below for reference"*; if it fails
  or times out (8 s) the rule-based feedback is used and labelled accordingly. The key is stored
  only in your browser's LocalStorage. Scores are **never** produced by the AI — only by the
  scoring engine.

## 10. Save data

Everything is stored in the browser's LocalStorage under the keys `dharmaDecision.settings.v1`
and `dharmaDecision.save.v1`:

* history records: id, scenario id and name, date/time, mode, duration, outcome, success flag,
  actions, consequences, overall and dimension scores, the ledger, mentor feedback and the raw
  event list (up to 300 records);
* completion counts, recent list, milestones, session counter;
* an "active scenario" marker used by *Continue* (mid-scenario positions are kept in memory while
  the page is open; after a reload *Continue* offers to restart that scenario from its beginning
  and says so).

*Reset All Progress* (Decision History / Journey / Settings) asks for confirmation and deletes
history, statistics and milestones; settings are kept. Clearing the browser's site data also
removes everything.

## 11. Settings

Audio: enabled, mute, master/music/SFX volume. Graphics: quality preset (Low = no shadows and
reduced render resolution, Medium, High), shadows, particles, reduced motion. Gameplay: mouse
sensitivity, invert vertical look, mouse-look mode (click & drag / pointer lock), default vehicle
camera, screen shake, difficulty (affects timers: Relaxed / Normal / Demanding). Accessibility:
subtitles for spoken lines, high-contrast interface, larger text, full keyboard navigation of
menus (Tab/Enter/Esc, 1–4 for dialogue). Dharma Mentor: optional endpoint (section 9). Every
control shown in the menu is wired to behaviour; there are no decorative options.

## 12. Architecture

States (`game.js`): `BOOT → MENU → LOADING → INTRO → PLAYING ⇄ PAUSED → COMPLETED → RESULTS`,
with `analysis`, `history`, `journey`, `scoreboard`, `settings`, `how-to-play`, `about`,
`scenario-select` as UI screens on a stack. The render loop advances a scenario only in `PLAYING`;
`PAUSED` stops the scenario clock, all NPCs, vehicles, timers and particles.

A scenario is a class extending `VehicleScenario` or `CharacterScenario` (`scenarios/_bases.js`
→ `scenarioBase.js`). It builds its world with `engine/worldKit.js`, registers colliders and
interactables, records events with `record(type, data)`, ends with `finish(outcomeId)`, and
implements `evaluate(outcome)` that returns the outcome description, the `ScoreSheet`, positives,
negatives, actions, consequences and the mentor rules. `resultsManager.js` turns that into a
history record and the results screen.

## 13. Tests

The checks below were executed with headless Chromium (Playwright, software WebGL) against the
served game. They drive the game through **real keyboard and mouse events** (walking, pressing E,
clicking dialogue options and panel buttons, holding W/A/D/Space/H), not by calling internal
shortcuts. Scripts live in `tests/` and can be re-run with `node tests/<name>.cjs` after
`npm install -D playwright@1.47 && npx playwright install chromium` (Playwright is only needed
for the tests, never for the game).

| Script | What it verified | Result |
|---|---|---|
| `smoke.cjs` | page loads without errors, menu appears, a scenario can start | pass |
| `buildall.cjs` | each of the ten scenarios builds its world, enters PLAYING, renders, and is disposed without JavaScript errors | 10 / 10 pass |
| `road.cjs`, `road2.cjs` | Road of Dharma: reckless run (hit) vs careful run (safe pass) vs swerve into the well produce different outcomes and scores (8 / 61 / 25) | pass |
| `wallet.cjs`, `wallet_b.cjs` | Lost Wallet: examine → talk to friend → notice board → canteen → return to owner = *returned intact* (72); take the money and leave = *took money* (29) | pass |
| `chars.cjs` | Team Leader (fair and accountable 73), Act of Courage (rescued safely 74), Honest Employee (corrected and reported 75), Last Resource (reasonable distribution 64), Friend in Trouble (truth with friend and amends 71), Arjuna Challenge (informed resolve 68) — each played end-to-end to the results screen | 6 / 6 pass |
| `vehicles.cjs` | Emergency Run careful autopilot = *arrived safely and in time* (67); reckless 92 km/h run = *crash* (35); Flooded Bridge diversion = *arrived via diversion* (67); wait for the gauge then cross = *waited then crossed safely* (65); straight into deep water = *swept away* (32) | 5 / 5 pass |
| `touch.cjs` | with an emulated touch device the on-screen controls appear and a press on ▲ moves the character; releasing resets the input | pass |
| `menus.cjs` | all main-menu buttons, Continue with nothing saved, empty states of History/Journey/Scoreboard, settings persistence across reload, randomizer (60 draws: no immediate repeat, all 10 reached), Esc pause freezes the clock, resume, leave-to-menu confirmation, Continue resumes with the same clock, R restart confirmation and reset, a full scenario through the UI, results buttons, detailed analysis, history record, journey statistics, scoreboard, confirmed reset, Return to Title | pass |

Screenshots of the runs are in `tests/shots/` (a curated set is in `docs/screenshots/`). Things that were **not** tested: real GPU
performance on Windows hardware (only software rendering was available here), touch controls on
a physical device (only Chromium's touch emulation), and the optional AI endpoint against a live
model (only the offline path and the failure fallback were exercised).

## 14. Troubleshooting

* **Blank page / "Failed to load module script"** — you opened `index.html` from disk. Serve it
  over HTTP (section 4).
* **No sound** — browsers block audio until the first click or key press; the menu shows
  *"Click or press any key to enable sound"*. Check *Settings → Audio* and the system mixer.
* **Low frame rate** — *Settings → Graphics → Low*, disable shadows and particles, close other
  WebGL tabs. The game caps the pixel ratio on Low.
* **Mouse look does not capture** — choose *Pointer lock* in Settings and click the game view;
  press Esc to release. Drag mode works everywhere.
* **Keys do not respond** — click the game canvas once to focus the page; check that the pause
  menu or a dialogue box is not open.
* **I want to start fresh** — *Decision History → Reset All Progress* (with confirmation), or clear
  the site data for `localhost:8000`.
* **Port 8000 is busy** — `python serve.py 8080` and open `http://localhost:8080`.

## 15. Known limitations

* Graphics are low-poly and fully procedural (no imported models or textures); characters are
  stylised block figures with simple walk animation.
* Music and sound are synthesised; there are no recorded voices (subtitles are always available).
* Mid-scenario progress is kept in memory while the page is open; it is not saved to disk across
  reloads (the Continue button explains this honestly).
* The vehicle model is arcade physics (no suspension simulation); traffic AI follows lanes and
  brakes for obstacles but does not route around them.
* Character movement uses capsule-vs-box/circle collision without pathfinding for NPCs beyond
  scripted waypoints.
* Touch controls are basic (move pad, interact, brake; no touch look-around) and were only tested with an emulated touch device.
* The optional AI mentor expects an OpenAI-compatible chat-completions API; other APIs need a small
  adapter in `dharmaMentor.js`.
* Scores are a transparent heuristic model designed for reflection, not a validated psychometric
  instrument.

## 16. Assets and licences

* `vendor/three/three.module.js` — three.js r160, MIT licence (`vendor/three/LICENSE`).
* All geometry, textures (canvas-generated text boards and signs), particles and audio are generated
  procedurally at runtime by code in this repository. No third-party images, fonts, models or
  recordings are included. The game may be used freely for educational purposes.
* The Mahabharata material is used respectfully as reflective retellings. Nothing in the game is
  an authentic quotation; the intro to The Arjuna Challenge, the About screen and the mentor
  output say so explicitly. Injury is never depicted graphically.
