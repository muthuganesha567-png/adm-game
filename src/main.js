// Entry point: boot the game and surface fatal errors on the boot screen.
import { Game } from './game.js';

function showFatal(err) {
  console.error(err);
  const e = document.getElementById('boot-error'); const bar = document.querySelector('.boot-bar');
  if (bar) bar.hidden = true;
  if (e) { e.hidden = false; e.textContent = `The game could not start.\n${err?.message || err}\n\nMake sure you are opening the game through a local web server (see README) in a browser with WebGL enabled.`; }
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    const game = new Game();
    window.__dharma = game; // debugging / automated test hook
    game.init().catch(showFatal);
  } catch (err) { showFatal(err); }
});
