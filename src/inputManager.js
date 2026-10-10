// Keyboard / mouse / pointer input with per-frame "pressed" edge detection.
export class InputManager extends EventTarget {
  constructor(canvas) {
    super();
    this.canvas = canvas;
    this.keys = new Set();          // currently held key codes
    this.pressedThisFrame = new Set();
    this.mouse = { dx: 0, dy: 0, x: 0, y: 0, down: false, button: -1, dragging: false, wheel: 0 };
    this.pointerLocked = false;
    this.enabled = true;
    this.touch = { forward: 0, turn: 0, brake: false, action: false };

    window.addEventListener('keydown', (e) => this._onKeyDown(e));
    window.addEventListener('keyup', (e) => this._onKeyUp(e));
    window.addEventListener('blur', () => this.keys.clear());

    canvas.addEventListener('pointerdown', (e) => {
      this.mouse.down = true; this.mouse.button = e.button; this.mouse.dragging = true;
      this.mouse.x = e.clientX; this.mouse.y = e.clientY;
      canvas.setPointerCapture?.(e.pointerId);
      this.dispatchEvent(new CustomEvent('canvasclick', { detail: e }));
    });
    canvas.addEventListener('pointerup', () => { this.mouse.down = false; this.mouse.dragging = false; });
    canvas.addEventListener('pointercancel', () => { this.mouse.down = false; this.mouse.dragging = false; });
    canvas.addEventListener('pointermove', (e) => {
      if (this.pointerLocked) { this.mouse.dx += e.movementX || 0; this.mouse.dy += e.movementY || 0; }
      else if (this.mouse.dragging) {
        this.mouse.dx += e.clientX - this.mouse.x; this.mouse.dy += e.clientY - this.mouse.y;
      }
      this.mouse.x = e.clientX; this.mouse.y = e.clientY;
    });
    canvas.addEventListener('wheel', (e) => { this.mouse.wheel += Math.sign(e.deltaY); }, { passive: true });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === canvas;
      this.dispatchEvent(new CustomEvent('pointerlock', { detail: this.pointerLocked }));
    });
  }

  _isTypingTarget(e) {
    const t = e.target;
    return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
  }

  _onKeyDown(e) {
    if (this._isTypingTarget(e)) return;
    const code = e.code;
    // prevent page scrolling for game keys
    const onControl = e.target && e.target.closest && e.target.closest('button, a, [tabindex], .toggle, .seg');
    const playing = document.body.dataset.state === 'PLAYING' && !(onControl && onControl.closest('.game-panel, #dialogue, #modal, .screen.visible'));
    if (playing && onControl && (code === 'Space' || code === 'Enter')) { e.preventDefault(); onControl.blur?.(); }
    else if (code !== 'Tab' && !(onControl && code === 'Space') && ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) e.preventDefault();
    if (!this.keys.has(code)) this.pressedThisFrame.add(code);
    this.keys.add(code);
    this.dispatchEvent(new CustomEvent('keydown', { detail: { code, key: e.key, event: e } }));
  }
  _onKeyUp(e) {
    this.keys.delete(e.code);
    this.dispatchEvent(new CustomEvent('keyup', { detail: { code: e.code } }));
  }

  /** Whether a key is currently held. Accepts several codes. */
  held(...codes) { if (!this.enabled) return false; return codes.some((c) => this.keys.has(c)); }
  /** Edge-triggered: true only on the frame the key went down. */
  pressed(...codes) { if (!this.enabled) return false; return codes.some((c) => this.pressedThisFrame.has(c)); }

  /** Standard axes used by controllers. */
  axis() {
    const t = this.touch;
    const forward = (this.held('KeyW', 'ArrowUp') ? 1 : 0) - (this.held('KeyS', 'ArrowDown') ? 1 : 0) + t.forward;
    const turn = (this.held('KeyD', 'ArrowRight') ? 1 : 0) - (this.held('KeyA', 'ArrowLeft') ? 1 : 0) + t.turn;
    return { forward: Math.max(-1, Math.min(1, forward)), turn: Math.max(-1, Math.min(1, turn)) };
  }

  consumeMouseDelta() {
    const d = { dx: this.mouse.dx, dy: this.mouse.dy, wheel: this.mouse.wheel };
    this.mouse.dx = 0; this.mouse.dy = 0; this.mouse.wheel = 0;
    return d;
  }

  /** Call at end of every frame. */
  endFrame() { this.pressedThisFrame.clear(); this.touch.action = false; }

  requestPointerLock() { try { this.canvas.requestPointerLock?.(); } catch (_) { /* unsupported */ } }
  exitPointerLock() { if (document.pointerLockElement) { try { document.exitPointerLock(); } catch (_) { /* ignore */ } } }

  on(type, fn) { this.addEventListener(type, (e) => fn(e.detail)); }
}
