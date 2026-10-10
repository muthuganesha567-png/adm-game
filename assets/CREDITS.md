# Assets

Dharma Decision ships **no binary assets**. Everything the player sees and hears is generated at
runtime by code in `src/`:

| Kind | Where it is generated | Notes |
|---|---|---|
| Geometry (roads, buildings, trees, vehicles, humans, chariots, water, rain) | `src/engine/worldKit.js` | three.js primitives combined procedurally |
| Text boards, signs, notices, documents | `src/engine/worldKit.js` (`makeTextBoard`, `makeSign`) | drawn on `<canvas>` and used as textures |
| Golden particles, dust, rain | `src/engine/worldKit.js`, `src/ui/menuBackground.js` | `THREE.Points` |
| Music beds (menu, road, city, park, office, rain, river, camp, campus, battle, results) | `src/audioManager.js` | Web Audio oscillators/filters, original compositions |
| Sound effects (clicks, engine, brakes, skid, crash, siren, splash, footsteps, conch, drum, bell…) | `src/audioManager.js` | synthesised |
| Fonts | system font stack declared in `styles/main.css` | no web fonts are downloaded |

Third-party code: three.js r160 (`vendor/three/`, MIT licence — see `vendor/three/LICENSE`).

No copyrighted audio, images, models or texts are included. The Mahabharata themes used by the
Dharma Mentor are short original retellings written for this project; no invented text is
presented as scripture.
