// Procedural low-poly asset kit. Every model is built from primitives + canvas textures,
// so the game has no external model/texture dependencies and nothing can fail to load.
import * as THREE from 'three';

const matCache = new Map();
export function mat(color, opts = {}) {
  const key = `${color}|${opts.roughness ?? 0.85}|${opts.metalness ?? 0}|${opts.flat ? 1 : 0}|${opts.emissive || 0}|${opts.transparent ? opts.opacity : 1}`;
  if (!opts.noCache && matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial({
    color, roughness: opts.roughness ?? 0.85, metalness: opts.metalness ?? 0, flatShading: !!opts.flat,
    emissive: opts.emissive || 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 1,
    transparent: !!opts.transparent, opacity: opts.opacity ?? 1, side: opts.side || THREE.FrontSide,
  });
  if (!opts.noCache) matCache.set(key, m);
  return m;
}

export function box(w, h, d, color, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof color === 'number' ? mat(color, opts) : color);
  m.castShadow = opts.castShadow ?? true; m.receiveShadow = opts.receiveShadow ?? true;
  return m;
}
export function cyl(rt, rb, h, color, seg = 12, opts = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof color === 'number' ? mat(color, opts) : color);
  m.castShadow = true; m.receiveShadow = true; return m;
}
export function sphere(r, color, seg = 10, opts = {}) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), typeof color === 'number' ? mat(color, opts) : color);
  m.castShadow = true; m.receiveShadow = true; return m;
}

export function canvasTexture(w, h, draw, { repeat = null, anisotropy = 4 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'); draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = anisotropy;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

// ---------------------------------------------------------------- sky & lights
export function makeSky(scene, { top = 0x1b2a6b, bottom = 0xe9c7a0, horizon = null, radius = 900, exposure = 1 } = {}) {
  const geo = new THREE.SphereGeometry(radius, 24, 12);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) }, horizon: { value: new THREE.Color(horizon ?? bottom) }, exposure: { value: exposure } },
    vertexShader: `varying vec3 vP; void main(){ vP = (modelMatrix * vec4(position,1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 bottom; uniform vec3 horizon; uniform float exposure; varying vec3 vP;
      void main(){ float h = normalize(vP).y; float t = smoothstep(-0.05, 0.6, h); vec3 c = mix(horizon, top, t); c = mix(bottom, c, smoothstep(-0.3, 0.05, h)); gl_FragColor = vec4(c * exposure, 1.0); }`,
  });
  const sky = new THREE.Mesh(geo, material); sky.name = 'sky'; sky.renderOrder = -10; scene.add(sky);
  return sky;
}

export function makeSun(scene, { color = 0xfff1d6, intensity = 2.2, position = [60, 90, 40], shadowArea = 120, shadowSize = 1024, near = 5, far = 400 } = {}) {
  const sun = new THREE.DirectionalLight(color, intensity);
  sun.position.set(...position); sun.castShadow = true;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  sun.shadow.camera.left = -shadowArea; sun.shadow.camera.right = shadowArea; sun.shadow.camera.top = shadowArea; sun.shadow.camera.bottom = -shadowArea;
  sun.shadow.camera.near = near; sun.shadow.camera.far = far; sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02;
  scene.add(sun); scene.add(sun.target);
  return sun;
}
export function makeHemi(scene, sky = 0xbfd4ff, ground = 0x6b5a3a, intensity = 0.8) {
  const h = new THREE.HemisphereLight(sky, ground, intensity); scene.add(h); return h;
}

// ---------------------------------------------------------------- ground & roads
export function makeGround(size, color = 0x4f7a3a, { tint = null, y = 0 } = {}) {
  const tex = canvasTexture(256, 256, (c) => {
    const base = new THREE.Color(color); c.fillStyle = `#${base.getHexString()}`; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1600; i++) { const v = (Math.random() - 0.5) * 0.12; const col = base.clone().offsetHSL(0, 0, v); c.fillStyle = `#${col.getHexString()}`; c.fillRect(Math.random() * 256, Math.random() * 256, 3, 3); }
  }, { repeat: [size / 8, size / 8] });
  const g = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ map: tex, roughness: 1, color: tint || 0xffffff }));
  g.rotation.x = -Math.PI / 2; g.position.y = y; g.receiveShadow = true; g.name = 'ground';
  return g;
}

export function roadTexture({ dashed = true, edge = true, color = '#3b3b40' } = {}) {
  return canvasTexture(256, 256, (c, w, h) => {
    c.fillStyle = color; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    if (dashed) { c.fillStyle = '#e8e3c8'; c.fillRect(w / 2 - 4, 0, 8, h * 0.5); }
    if (edge) { c.fillStyle = '#e8e3c8'; c.fillRect(6, 0, 5, h); c.fillRect(w - 11, 0, 5, h); }
  }, { repeat: [1, 1] });
}

/** Straight road along +Z starting at z=0 with given length. */
export function makeRoad(length, width = 8, opts = {}) {
  const tex = roadTexture(opts); tex.repeat.set(1, length / 12);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, length), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
  m.rotation.x = -Math.PI / 2; m.position.set(0, 0.02, length / 2); m.receiveShadow = true; m.name = 'road';
  return m;
}
/** Road segment between two points (XZ). */
export function makeRoadBetween(ax, az, bx, bz, width = 8, opts = {}) {
  const dx = bx - ax, dz = bz - az; const len = Math.hypot(dx, dz);
  const tex = roadTexture(opts); tex.repeat.set(1, len / 12);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, len), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
  m.rotation.x = -Math.PI / 2; m.rotation.z = -Math.atan2(dx, dz);
  m.position.set((ax + bx) / 2, 0.02, (az + bz) / 2); m.receiveShadow = true;
  return m;
}
export function makeIntersection(x, z, size = 8) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat(0x3b3b40, { roughness: 0.95 }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0.03, z); m.receiveShadow = true; return m;
}
export function makeZebra(x, z, width = 8, along = 'x') {
  const g = new THREE.Group();
  for (let i = -3; i <= 3; i++) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(along === 'x' ? 0.5 : width, along === 'x' ? width : 0.5), mat(0xf0ead6));
    s.rotation.x = -Math.PI / 2; s.position.set(along === 'x' ? i * 1 : 0, 0.04, along === 'x' ? 0 : i * 1); s.receiveShadow = true; g.add(s);
  }
  g.position.set(x, 0, z); return g;
}
export function makePath(ax, az, bx, bz, width = 2.5, color = 0xb9a67a) {
  const dx = bx - ax, dz = bz - az; const len = Math.hypot(dx, dz);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, len), mat(color, { roughness: 1 }));
  m.rotation.x = -Math.PI / 2; m.rotation.z = -Math.atan2(dx, dz); m.position.set((ax + bx) / 2, 0.015, (az + bz) / 2); m.receiveShadow = true; return m;
}
export function makeSidewalk(length, width, x, z, color = 0x9d9a90) {
  const m = box(width, 0.18, length, color, { roughness: 1 }); m.position.set(x, 0.09, z); m.castShadow = false; return m;
}

// ---------------------------------------------------------------- nature
export function makeTree(variant = 0, scale = 1) {
  const g = new THREE.Group();
  const trunk = cyl(0.18, 0.28, 2.2, 0x6b4a2b, 7); trunk.position.y = 1.1; g.add(trunk);
  const greens = [0x3f7a35, 0x4f8f3b, 0x2f6b2f, 0x6a9a3a];
  const col = greens[variant % greens.length];
  if (variant % 3 === 0) {
    for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.5 - i * 0.35, 1.8, 7), mat(col, { flat: true })); c.position.y = 2.4 + i * 1.0; c.castShadow = true; g.add(c); }
  } else if (variant % 3 === 1) {
    const s = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 0), mat(col, { flat: true })); s.position.y = 3.0; s.castShadow = true; g.add(s);
    const s2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.0, 0), mat(col, { flat: true })); s2.position.set(0.8, 2.5, 0.3); s2.castShadow = true; g.add(s2);
  } else {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 0), mat(col, { flat: true })); s.position.y = 3.2; s.scale.y = 1.25; s.castShadow = true; g.add(s);
  }
  g.scale.setScalar(scale); return g;
}
export function makePalm(scale = 1) {
  const g = new THREE.Group();
  const trunk = cyl(0.14, 0.22, 5, 0x8a6a3c, 7); trunk.position.y = 2.5; trunk.rotation.z = 0.08; g.add(trunk);
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 2.6), mat(0x3d8b3d, { flat: true }));
    leaf.position.set(0.2, 5, 0); leaf.rotation.y = (i / 7) * Math.PI * 2; leaf.rotation.x = -0.5; leaf.translateZ(1.2); leaf.castShadow = true; g.add(leaf);
  }
  g.scale.setScalar(scale); return g;
}
export function makeBush(scale = 1, color = 0x3f7a35) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.2, 0), mat(color, { flat: true })); s.position.set((i - 1) * 0.45, 0.4, (Math.random() - 0.5) * 0.3); s.castShadow = true; g.add(s); }
  g.scale.setScalar(scale); return g;
}
export function makeRock(scale = 1, color = 0x7d7a74) {
  const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 0), mat(color, { flat: true })); r.scale.set(scale, scale * 0.65, scale); r.position.y = 0.3 * scale; r.castShadow = true; r.receiveShadow = true; return r;
}
export function makeMound(radius = 6, height = 1.4, color = 0x8a7a55) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(color, { flat: true }));
  m.scale.y = height / radius; m.receiveShadow = true; m.castShadow = false; return m;
}
export function makeFlower(color) { const g = new THREE.Group(); const s = cyl(0.02, 0.02, 0.3, 0x3f7a35, 4); s.position.y = 0.15; g.add(s); const f = sphere(0.08, color, 6); f.position.y = 0.32; g.add(f); return g; }

// ---------------------------------------------------------------- buildings & props
export function makeBuilding(w, h, d, color = 0xcfc3ad, { windows = true, roof = 0x7a5a45, floors = null, lit = false } = {}) {
  const g = new THREE.Group();
  const nF = floors || Math.max(1, Math.round(h / 3.2));
  const tex = canvasTexture(256, 256, (c) => {
    c.fillStyle = `#${new THREE.Color(color).getHexString()}`; c.fillRect(0, 0, 256, 256);
    if (windows) {
      const cols = Math.max(2, Math.round(w / 2.2));
      for (let f = 0; f < nF; f++) for (let i = 0; i < cols; i++) {
        const lightOn = lit && Math.random() < 0.5;
        c.fillStyle = lightOn ? '#ffe2a0' : '#2c3e55'; const cw = 256 / cols; const fh = 256 / nF;
        c.fillRect(i * cw + cw * 0.25, f * fh + fh * 0.25, cw * 0.5, fh * 0.45);
        c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(i * cw + cw * 0.25, f * fh + fh * 0.25, cw * 0.5, 3);
      }
    }
  });
  const bodyMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
  const sideMat = mat(color);
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [bodyMat, bodyMat, sideMat, sideMat, bodyMat, bodyMat]);
  body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
  const r = box(w + 0.3, 0.25, d + 0.3, roof); r.position.y = h + 0.12; g.add(r);
  return g;
}
export function makeShop(w = 6, h = 3.4, d = 5, color = 0xe8d7b0, awning = 0xc8452c, label = 'SHOP') {
  const g = makeBuilding(w, h, d, color, { windows: true, floors: 1 });
  const a = box(w * 0.9, 0.1, 1.4, awning); a.position.set(0, h * 0.78, d / 2 + 0.7); a.rotation.x = 0.25; g.add(a);
  const sign = makeTextBoard(label, { w: w * 0.7, h: 0.6, bg: '#2a2a2a', fg: '#f1c75b', fontSize: 64 }); sign.position.set(0, h * 0.9, d / 2 + 0.06); g.add(sign);
  return g;
}
export function makeTextBoard(text, { w = 2, h = 0.6, bg = '#ffffff', fg = '#111111', fontSize = 72, border = null, lines = null, font = 'bold {s}px "Segoe UI", Arial, sans-serif' } = {}) {
  const px = 512; const py = Math.max(64, Math.round(px * h / w));
  const tex = canvasTexture(px, py, (c) => {
    c.fillStyle = bg; c.fillRect(0, 0, px, py);
    if (border) { c.strokeStyle = border; c.lineWidth = 14; c.strokeRect(7, 7, px - 14, py - 14); }
    c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle';
    const ls = lines || [text]; const fs = Math.min(fontSize, (py / ls.length) * 0.7);
    c.font = font.replace('{s}', fs);
    ls.forEach((l, i) => c.fillText(l, px / 2, py / 2 + (i - (ls.length - 1) / 2) * fs * 1.15));
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide }));
  m.castShadow = false; return m;
}
export function makeSign(text, { color = '#ffd21f', fg = '#111', height = 2.4, w = 1.6, h = 1.0, lines = null, post = true, shape = 'rect', border = '#111', fontSize = 64 } = {}) {
  const g = new THREE.Group();
  if (post) { const p = cyl(0.05, 0.05, height, 0x777777, 6); p.position.y = height / 2; g.add(p); }
  const board = makeTextBoard(text, { w, h, bg: color, fg, border, lines, fontSize });
  board.position.y = height; g.add(board);
  const back = box(w, h, 0.04, 0x888888); back.position.set(0, height, -0.03); g.add(back);
  g.userData.board = board; return g;
}
export function makeBarrier(len = 2) { const g = new THREE.Group(); const b = box(len, 0.8, 0.5, 0xd8d3c8, { flat: true }); b.position.y = 0.4; g.add(b); for (let i = 0; i < Math.round(len); i++) { const s = box(0.35, 0.82, 0.52, 0xd84a2a); s.position.set(-len / 2 + 0.5 + i, 0.4, 0); g.add(s); } return g; }
export function makeWell() {
  const g = new THREE.Group();
  const ring = cyl(1.1, 1.2, 1.0, 0x8c7b6a, 14); ring.position.y = 0.5; g.add(ring);
  const inner = cyl(0.85, 0.85, 1.05, 0x111418, 14); inner.position.y = 0.52; g.add(inner);
  for (const sx of [-1, 1]) { const p = box(0.15, 2.0, 0.15, 0x6b4a2b); p.position.set(sx * 1.0, 1.9, 0); g.add(p); }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.8, 4), mat(0xa0522d, { flat: true })); roof.position.y = 3.2; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
  const bar = cyl(0.05, 0.05, 2.2, 0x444444, 6); bar.rotation.z = Math.PI / 2; bar.position.y = 2.6; g.add(bar);
  const bucket = cyl(0.2, 0.15, 0.3, 0x5a5a5a, 8); bucket.position.y = 1.6; g.add(bucket);
  return g;
}
export function makeFence(len, color = 0xb3a27e) {
  const g = new THREE.Group(); const n = Math.max(2, Math.round(len / 2));
  for (let i = 0; i <= n; i++) { const p = box(0.12, 1.0, 0.12, color); p.position.set(-len / 2 + (i / n) * len, 0.5, 0); g.add(p); }
  for (const y of [0.35, 0.8]) { const r = box(len, 0.08, 0.08, color); r.position.y = y; g.add(r); }
  return g;
}
export function makeRailing(len, color = 0x55606b) {
  const g = new THREE.Group(); const n = Math.max(2, Math.round(len / 1.5));
  for (let i = 0; i <= n; i++) { const p = cyl(0.04, 0.04, 1.1, color, 6); p.position.set(-len / 2 + (i / n) * len, 0.55, 0); g.add(p); }
  for (const y of [0.5, 1.05]) { const r = cyl(0.03, 0.03, len, color, 6); r.rotation.z = Math.PI / 2; r.position.y = y; g.add(r); }
  return g;
}
export function makeBench() {
  const g = new THREE.Group(); const seat = box(1.8, 0.08, 0.5, 0x8b5a2b); seat.position.y = 0.45; g.add(seat);
  const back = box(1.8, 0.4, 0.06, 0x8b5a2b); back.position.set(0, 0.7, -0.22); g.add(back);
  for (const sx of [-0.8, 0.8]) { const l = box(0.08, 0.45, 0.45, 0x2f2f2f); l.position.set(sx, 0.22, 0); g.add(l); }
  return g;
}
export function makeLamp(height = 4, lit = false) {
  const g = new THREE.Group(); const p = cyl(0.06, 0.09, height, 0x3a3f46, 8); p.position.y = height / 2; g.add(p);
  const head = box(0.5, 0.25, 0.5, lit ? mat(0xfff0b0, { emissive: 0xffe08a, emissiveIntensity: 1.2 }) : 0xdddddd); head.position.y = height; g.add(head);
  return g;
}
export function makeBusStop() {
  const g = new THREE.Group(); const roof = box(3, 0.1, 1.5, 0x3a5a8a); roof.position.y = 2.5; g.add(roof);
  for (const sx of [-1.4, 1.4]) { const p = box(0.08, 2.5, 0.08, 0x888888); p.position.set(sx, 1.25, -0.6); g.add(p); }
  const back = box(3, 1.8, 0.05, mat(0x88aadd, { transparent: true, opacity: 0.4 })); back.position.set(0, 1.5, -0.7); g.add(back);
  const b = makeBench(); b.position.set(0, 0, -0.3); g.add(b); return g;
}
export function makeTent(color = 0xd9d2b4, w = 4, d = 4) {
  const g = new THREE.Group();
  const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.75, 2.2, 4), mat(color, { flat: true })); roof.rotation.y = Math.PI / 4; roof.position.y = 2.2; roof.castShadow = true; g.add(roof);
  const wall = box(w * 0.98, 1.2, d * 0.98, mat(color, { flat: true })); wall.position.y = 0.6; g.add(wall);
  const pole = cyl(0.05, 0.05, 3.4, 0x6b4a2b, 6); pole.position.y = 1.7; g.add(pole);
  return g;
}
export function makeCrate(color = 0x9b7a4b, label = null, size = 0.7) {
  const g = new THREE.Group(); const b = box(size, size, size, color, { flat: true }); b.position.y = size / 2; g.add(b);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(b.geometry), new THREE.LineBasicMaterial({ color: 0x3a2a14 })); edge.position.y = size / 2; g.add(edge);
  if (label) { const t = makeTextBoard(label, { w: size * 0.9, h: size * 0.4, bg: '#f5f1e8', fg: '#222', fontSize: 60 }); t.position.set(0, size / 2, size / 2 + 0.01); g.add(t); }
  return g;
}
export function makeTable(w = 1.6, d = 0.8, h = 0.75, color = 0x7a5230) {
  const g = new THREE.Group(); const top = box(w, 0.06, d, color); top.position.y = h; g.add(top);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = box(0.06, h, 0.06, 0x3a3a3a); l.position.set(sx * (w / 2 - 0.08), h / 2, sz * (d / 2 - 0.08)); g.add(l); }
  return g;
}
export function makeDesk(color = 0xd8d2c4, withMonitor = true) {
  const g = makeTable(1.6, 0.8, 0.74, color);
  if (withMonitor) {
    const stand = box(0.08, 0.25, 0.08, 0x222222); stand.position.set(0, 0.9, -0.2); g.add(stand);
    const screen = box(0.9, 0.5, 0.04, mat(0x9fd3ff, { emissive: 0x3a86c8, emissiveIntensity: 0.6 })); screen.position.set(0, 1.12, -0.2); g.add(screen);
    const frame = box(0.96, 0.56, 0.02, 0x1a1a1a); frame.position.set(0, 1.12, -0.22); g.add(frame);
    const kb = box(0.5, 0.03, 0.18, 0x2c2c2c); kb.position.set(0, 0.78, 0.1); g.add(kb);
    g.userData.screen = screen;
  }
  return g;
}
export function makeChair(color = 0x2d4a7a) {
  const g = new THREE.Group(); const seat = box(0.5, 0.06, 0.5, color); seat.position.y = 0.45; g.add(seat);
  const back = box(0.5, 0.5, 0.06, color); back.position.set(0, 0.72, -0.22); g.add(back);
  const post = cyl(0.03, 0.03, 0.42, 0x333333, 6); post.position.y = 0.22; g.add(post);
  const base = cyl(0.3, 0.3, 0.04, 0x333333, 8); base.position.y = 0.02; g.add(base); return g;
}
export function makeCabinet(color = 0x8f9499, drawers = 4) {
  const g = new THREE.Group(); const b = box(0.9, 1.4, 0.5, color); b.position.y = 0.7; g.add(b);
  for (let i = 0; i < drawers; i++) { const h = box(0.3, 0.04, 0.04, 0x222222); h.position.set(0, 0.25 + i * (1.2 / drawers), 0.26); g.add(h); const line = box(0.86, 0.01, 0.02, 0x555555); line.position.set(0, 0.1 + i * (1.2 / drawers) + 0.3, 0.255); g.add(line); }
  return g;
}
export function makeWhiteboard(w = 2.4, h = 1.3, lines = ['PROJECT BOARD']) {
  const g = new THREE.Group(); const frame = box(w + 0.1, h + 0.1, 0.06, 0x8a8a8a); g.add(frame);
  const board = makeTextBoard('', { w, h, bg: '#f7f7f2', fg: '#1b2a4a', lines, fontSize: 40, font: '{s}px "Segoe UI", Arial, sans-serif' }); board.position.z = 0.035; g.add(board);
  g.userData.board = board; return g;
}
export function makeBigScreen(w = 3.2, h = 1.8, lines = ['PRESENTATION']) {
  const g = new THREE.Group(); const frame = box(w + 0.1, h + 0.1, 0.08, 0x111111); g.add(frame);
  const scr = makeTextBoard('', { w, h, bg: '#13224a', fg: '#f1c75b', lines, fontSize: 56 }); scr.position.z = 0.045; scr.material.emissive = new THREE.Color(0x2a3d7a); scr.material.emissiveIntensity = 0.5; g.add(scr);
  g.userData.board = scr; return g;
}
export function makeDoor(color = 0x6b4a2b, w = 1.0, h = 2.1) { const g = new THREE.Group(); const d = box(w, h, 0.08, color); d.position.y = h / 2; g.add(d); const k = sphere(0.04, 0xd4a63a, 6); k.position.set(w * 0.35, h * 0.48, 0.06); g.add(k); return g; }
export function makeRoom(w, d, h = 3.2, { wall = 0xe9e4d8, floor = 0xb8ad98, openings = [] } = {}) {
  const g = new THREE.Group();
  const f = box(w, 0.1, d, floor, { roughness: 1 }); f.position.y = -0.05; f.castShadow = false; g.add(f);
  const walls = [[0, -d / 2, w, 0], [0, d / 2, w, 0], [-w / 2, 0, d, Math.PI / 2], [w / 2, 0, d, Math.PI / 2]];
  walls.forEach(([x, z, len, ry], i) => {
    if (openings.includes(i)) return;
    const m = box(len, h, 0.2, wall, { roughness: 1 }); m.position.set(x, h / 2, z); m.rotation.y = ry; m.castShadow = false; g.add(m);
  });
  const ceil = box(w, 0.1, d, 0xf2efe6); ceil.position.y = h; ceil.castShadow = false; ceil.receiveShadow = false; g.add(ceil);
  for (let i = 0; i < Math.max(1, Math.round(w * d / 40)); i++) {
    const l = box(1.2, 0.05, 0.3, mat(0xffffff, { emissive: 0xfff6dd, emissiveIntensity: 1 })); l.position.set(-w / 2 + ((i + 0.5) / Math.max(1, Math.round(w * d / 40))) * w, h - 0.05, 0); l.castShadow = false; g.add(l);
  }
  return g;
}
export function makeWindowPane(w = 1.6, h = 1.2) { const m = box(w, h, 0.05, mat(0x9fd3ff, { transparent: true, opacity: 0.45, emissive: 0x6aa6d8, emissiveIntensity: 0.3 })); m.castShadow = false; return m; }
export function makePlant() { const g = new THREE.Group(); const pot = cyl(0.2, 0.15, 0.3, 0xa0522d, 8); pot.position.y = 0.15; g.add(pot); for (let i = 0; i < 5; i++) { const l = box(0.08, 0.6, 0.02, 0x3f8f3b); l.position.set(0, 0.55, 0); l.rotation.z = (i - 2) * 0.35; l.rotation.y = i * 1.2; g.add(l); } return g; }
export function makeFountain() {
  const g = new THREE.Group(); const basin = cyl(2.4, 2.6, 0.5, 0xb9b3a8, 20); basin.position.y = 0.25; g.add(basin);
  const water = cyl(2.2, 2.2, 0.1, mat(0x3aa0d8, { transparent: true, opacity: 0.8, roughness: 0.2 }), 20); water.position.y = 0.5; g.add(water);
  const col = cyl(0.3, 0.4, 1.6, 0xb9b3a8, 10); col.position.y = 1.0; g.add(col);
  const top = cyl(0.8, 0.6, 0.2, 0xb9b3a8, 14); top.position.y = 1.8; g.add(top); return g;
}
export function makeNoticeBoard(lines) { const g = new THREE.Group(); for (const sx of [-1, 1]) { const p = box(0.1, 2.2, 0.1, 0x6b4a2b); p.position.set(sx * 1.1, 1.1, 0); g.add(p); } const b = makeTextBoard('', { w: 2.2, h: 1.4, bg: '#8a5a2b', fg: '#fff5e0', lines, fontSize: 36, font: '{s}px "Segoe UI", Arial, sans-serif' }); b.position.y = 1.5; g.add(b); return g; }
export function makeLifebuoy() { const r = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.12, 8, 18), mat(0xff5a2a)); r.castShadow = true; return r; }
export function makePole(len = 4) { const p = cyl(0.04, 0.05, len, 0xc9a86a, 7); p.rotation.z = Math.PI / 2; p.position.y = 0.1; return p; }
export function makeStall(label = 'TEA STALL') { const g = new THREE.Group(); const base = box(2.6, 1.0, 1.2, 0x8b5a2b); base.position.y = 0.5; g.add(base); for (const sx of [-1.2, 1.2]) { const p = box(0.08, 2.4, 0.08, 0x6b4a2b); p.position.set(sx, 1.2, -0.5); g.add(p); } const roof = box(3, 0.08, 1.8, 0xc8452c); roof.position.set(0, 2.4, -0.2); roof.rotation.x = 0.15; g.add(roof); const s = makeTextBoard(label, { w: 2.2, h: 0.5, bg: '#f1c75b', fg: '#222', fontSize: 60 }); s.position.set(0, 2.0, 0.42); g.add(s); return g; }
export function makeFlag(color = 0xd4a63a, height = 5) { const g = new THREE.Group(); const p = cyl(0.04, 0.05, height, 0x5a4632, 6); p.position.y = height / 2; g.add(p); const f = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), mat(color, { side: THREE.DoubleSide })); f.position.set(0.7, height - 0.5, 0); g.add(f); g.userData.flag = f; return g; }

// ---------------------------------------------------------------- water
export function makeWater(w, d, { color = 0x3a7fa8, opacity = 0.85, segments = 24, y = 0 } = {}) {
  const geo = new THREE.PlaneGeometry(w, d, segments, Math.max(2, Math.round(segments * d / w)));
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.25, metalness: 0.1, flatShading: true }));
  m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true;
  const pos = geo.attributes.position; const base = new Float32Array(pos.array);
  m.userData.update = (t, amp = 0.12, speed = 1.0) => {
    for (let i = 0; i < pos.count; i++) { const x = base[i * 3], yy = base[i * 3 + 1]; pos.array[i * 3 + 2] = Math.sin(x * 0.5 + t * 1.3 * speed) * amp + Math.cos(yy * 0.7 + t * 0.9 * speed) * amp * 0.7; }
    pos.needsUpdate = true; geo.computeVertexNormals();
  };
  return m;
}

// ---------------------------------------------------------------- particles
export function makeParticles({ count = 300, color = 0xf1c75b, size = 0.35, area = [60, 25, 60], center = [0, 10, 0], speed = 0.4, opacity = 0.8 } = {}) {
  const geo = new THREE.BufferGeometry(); const pos = new Float32Array(count * 3); const vel = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = center[0] + (Math.random() - 0.5) * area[0]; pos[i * 3 + 1] = center[1] + (Math.random() - 0.5) * area[1]; pos[i * 3 + 2] = center[2] + (Math.random() - 0.5) * area[2];
    vel[i * 3] = (Math.random() - 0.5) * speed; vel[i * 3 + 1] = (Math.random() * 0.5 + 0.2) * speed; vel[i * 3 + 2] = (Math.random() - 0.5) * speed;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const tex = canvasTexture(64, 64, (c) => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); });
  const matP = new THREE.PointsMaterial({ color, size, map: tex, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const pts = new THREE.Points(geo, matP); pts.frustumCulled = false;
  pts.userData.update = (dt, t) => {
    for (let i = 0; i < count; i++) {
      pos[i * 3] += (vel[i * 3] + Math.sin(t + i) * 0.1) * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      if (pos[i * 3 + 1] > center[1] + area[1] / 2) { pos[i * 3 + 1] = center[1] - area[1] / 2; pos[i * 3] = center[0] + (Math.random() - 0.5) * area[0]; pos[i * 3 + 2] = center[2] + (Math.random() - 0.5) * area[2]; }
    }
    geo.attributes.position.needsUpdate = true;
  };
  return pts;
}
export function makeRain({ count = 1500, area = [120, 40, 160], center = [0, 20, 80], speed = 28 } = {}) {
  const geo = new THREE.BufferGeometry(); const pos = new Float32Array(count * 6); const c = [...center];
  const reset = (i, top = false) => { const x = c[0] + (Math.random() - 0.5) * area[0]; const y = top ? c[1] + area[1] / 2 : c[1] + (Math.random() - 0.5) * area[1]; const z = c[2] + (Math.random() - 0.5) * area[2]; pos[i * 6] = x; pos[i * 6 + 1] = y; pos[i * 6 + 2] = z; pos[i * 6 + 3] = x; pos[i * 6 + 4] = y - 0.7; pos[i * 6 + 5] = z; };
  for (let i = 0; i < count; i++) reset(i);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xbcd4ea, transparent: true, opacity: 0.45 })); lines.frustumCulled = false;
  /** @param {number} dt @param {{x:number,z:number}} [follow] world position the rain volume should stay centred on */
  lines.userData.update = (dt, follow) => {
    if (follow) { c[0] = follow.x; c[2] = follow.z; }
    for (let i = 0; i < count; i++) { pos[i * 6 + 1] -= speed * dt; pos[i * 6 + 4] -= speed * dt; if (pos[i * 6 + 1] < 0 || Math.abs(pos[i * 6] - c[0]) > area[0] || Math.abs(pos[i * 6 + 2] - c[2]) > area[2]) reset(i, true); }
    geo.attributes.position.needsUpdate = true;
  };
  return lines;
}
export function makeClouds(count = 10, { radius = 200, height = 60, color = 0xffffff } = {}) {
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const c = new THREE.Group(); const n = 3 + Math.floor(Math.random() * 3);
    for (let j = 0; j < n; j++) { const s = new THREE.Mesh(new THREE.SphereGeometry(6 + Math.random() * 6, 7, 6), mat(color, { transparent: true, opacity: 0.85, flat: true })); s.position.set(j * 7 - n * 3, Math.random() * 2, (Math.random() - 0.5) * 6); s.castShadow = false; c.add(s); }
    const a = (i / count) * Math.PI * 2; c.position.set(Math.cos(a) * radius * (0.6 + Math.random() * 0.4), height + Math.random() * 20, Math.sin(a) * radius * (0.6 + Math.random() * 0.4));
    c.userData.speed = 0.5 + Math.random(); g.add(c);
  }
  g.userData.update = (dt) => { for (const c of g.children) { c.position.x += c.userData.speed * dt; if (c.position.x > radius * 1.2) c.position.x = -radius * 1.2; } };
  return g;
}

// ---------------------------------------------------------------- labels
export function makeLabel(text, { color = '#f5f1e8', bg = 'rgba(11,16,38,0.75)', scale = 1, fontSize = 48 } = {}) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const ctx = c.getContext('2d');
  ctx.font = `600 ${fontSize}px "Segoe UI", Arial, sans-serif`; const tw = Math.min(500, ctx.measureText(text).width + 50);
  ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect?.((512 - tw) / 2, 20, tw, 88, 20); if (!ctx.roundRect) ctx.rect((512 - tw) / 2, 20, tw, 88); ctx.fill();
  ctx.strokeStyle = 'rgba(212,166,58,0.8)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); s.scale.set(3 * scale, 0.75 * scale, 1); s.renderOrder = 5;
  return s;
}
export function makeMarker(color = 0xf1c75b, radius = 2) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 0.7, radius, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; g.add(ring);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.35, radius * 0.55, 10, 12, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })); beam.position.y = 5; g.add(beam);
  g.userData.update = (t) => { ring.scale.setScalar(1 + Math.sin(t * 3) * 0.08); beam.material.opacity = 0.12 + Math.sin(t * 2) * 0.06; };
  return g;
}
export function makeGlow(color = 0xf1c75b, size = 1.2) {
  const tex = canvasTexture(64, 64, (c) => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.5, 'rgba(255,255,255,0.25)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(size); return s;
}

// ---------------------------------------------------------------- humans
const SKINS = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xa9714b];
export function makeHuman({ shirt = 0x3a6fd8, pants = 0x2b2b3a, skin = null, hair = 0x1a1208, scale = 1, dress = false, hat = null } = {}) {
  const g = new THREE.Group(); const sk = skin ?? SKINS[Math.floor(Math.random() * SKINS.length)];
  const torso = box(0.46, 0.6, 0.26, shirt); torso.position.y = 1.15; g.add(torso);
  const head = box(0.3, 0.32, 0.3, sk); head.position.y = 1.65; g.add(head);
  const hairM = box(0.32, 0.12, 0.32, hair); hairM.position.y = 1.78; g.add(hairM);
  const neck = cyl(0.07, 0.07, 0.1, sk, 6); neck.position.y = 1.47; g.add(neck);
  const mk = (w, h, d, c, x, y, z) => { const p = new THREE.Group(); const m = box(w, h, d, c); m.position.y = -h / 2; p.add(m); p.position.set(x, y, z); g.add(p); return p; };
  const lArm = mk(0.13, 0.55, 0.13, shirt, -0.3, 1.42, 0); const rArm = mk(0.13, 0.55, 0.13, shirt, 0.3, 1.42, 0);
  const lHand = box(0.12, 0.12, 0.12, sk); lHand.position.y = -0.58; lArm.add(lHand); const rHand = lHand.clone(); rArm.add(rHand);
  let lLeg, rLeg;
  if (dress) { const skirt = box(0.5, 0.75, 0.3, pants); skirt.position.y = 0.5; g.add(skirt); lLeg = mk(0.12, 0.12, 0.12, sk, -0.12, 0.12, 0); rLeg = mk(0.12, 0.12, 0.12, sk, 0.12, 0.12, 0); }
  else { lLeg = mk(0.17, 0.85, 0.17, pants, -0.12, 0.85, 0); rLeg = mk(0.17, 0.85, 0.17, pants, 0.12, 0.85, 0); }
  if (hat) { const h = cyl(0.2, 0.2, 0.1, hat, 8); h.position.y = 1.88; g.add(h); }
  g.scale.setScalar(scale);
  g.userData.parts = { torso, head, lArm, rArm, lLeg, rLeg };
  g.userData.phase = Math.random() * 10;
  g.userData.animate = (t, moving, speed = 1) => {
    const p = g.userData.parts; const ph = g.userData.phase + t * 6 * speed;
    if (moving) { const s = Math.sin(ph) * 0.6; p.lArm.rotation.x = s; p.rArm.rotation.x = -s; p.lLeg.rotation.x = dress ? 0 : -s; p.rLeg.rotation.x = dress ? 0 : s; g.position.y = Math.abs(Math.sin(ph)) * 0.04; }
    else { const b = Math.sin(t * 1.5 + g.userData.phase) * 0.04; p.lArm.rotation.x = b; p.rArm.rotation.x = -b; p.lLeg.rotation.x = 0; p.rLeg.rotation.x = 0; g.position.y = 0; }
  };
  return g;
}
export function makeKrishnaFigure() {
  const h = makeHuman({ shirt: 0xf1c75b, pants: 0xf1c75b, skin: 0x2f5aa8, hair: 0x101010, dress: true });
  const crown = cyl(0.14, 0.18, 0.18, 0xd4a63a, 8); crown.position.y = 1.9; h.add(crown);
  const feather = box(0.05, 0.4, 0.02, 0x2fa36b); feather.position.set(0.06, 2.12, 0); feather.rotation.z = -0.3; h.add(feather);
  const garland = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 6, 12), mat(0xf7a04b)); garland.position.y = 1.3; garland.rotation.x = Math.PI / 2.4; h.add(garland);
  return h;
}
export function makeWarriorFigure({ color = 0xb0372a, skin = 0xc68642 } = {}) {
  const h = makeHuman({ shirt: color, pants: 0x4a3a2a, skin, hair: 0x101010 });
  const helm = cyl(0.19, 0.2, 0.2, 0xd4a63a, 8); helm.position.y = 1.86; h.add(helm);
  const plate = box(0.5, 0.4, 0.3, 0xd4a63a, { metalness: 0.6, roughness: 0.4 }); plate.position.y = 1.2; h.add(plate);
  return h;
}

// ---------------------------------------------------------------- vehicles
function wheel(r = 0.5, w = 0.35) { const g = new THREE.Group(); const t = cyl(r, r, w, 0x1b1b1b, 14); t.rotation.z = Math.PI / 2; g.add(t); const rim = cyl(r * 0.55, r * 0.55, w + 0.02, 0x9a9a9a, 10); rim.rotation.z = Math.PI / 2; g.add(rim); return g; }
export function makeTruck({ cab = 0xd9532b, cargo = 0xe9dcc0 } = {}) {
  const g = new THREE.Group();
  const chassis = box(2.4, 0.3, 6.8, 0x333333); chassis.position.y = 0.6; g.add(chassis);
  const cabM = box(2.5, 1.7, 2.1, cab); cabM.position.set(0, 1.6, 2.2); g.add(cabM);
  const glass = box(2.3, 0.7, 0.1, mat(0x9fd3ff, { transparent: true, opacity: 0.6 })); glass.position.set(0, 1.9, 3.28); g.add(glass);
  const bumper = box(2.5, 0.35, 0.3, 0x999999, { metalness: 0.5, roughness: 0.4 }); bumper.position.set(0, 0.75, 3.35); g.add(bumper);
  const cargoM = box(2.5, 2.3, 4.3, cargo); cargoM.position.set(0, 1.95, -1.0); g.add(cargoM);
  const stripe = box(2.52, 0.3, 4.3, 0x2a4a9a); stripe.position.set(0, 1.4, -1.0); g.add(stripe);
  for (const sx of [-0.9, 0.9]) { const l = box(0.4, 0.25, 0.1, mat(0xfff2c0, { emissive: 0xffe08a, emissiveIntensity: 0.8 })); l.position.set(sx, 1.1, 3.42); g.add(l); const tl = box(0.3, 0.2, 0.08, mat(0xff2a2a, { emissive: 0xaa0000, emissiveIntensity: 0.6 })); tl.position.set(sx, 0.9, -3.42); g.add(tl); }
  const wheels = []; const front = [];
  for (const [sx, sz, f] of [[-1.15, 2.3, true], [1.15, 2.3, true], [-1.15, -1.0, false], [1.15, -1.0, false], [-1.15, -2.3, false], [1.15, -2.3, false]]) { const w = wheel(0.55, 0.4); w.position.set(sx, 0.55, sz); g.add(w); wheels.push(w); if (f) front.push(w); }
  g.userData.wheels = wheels; g.userData.frontWheels = front; g.userData.length = 7.0; g.userData.width = 2.6;
  return g;
}
export function makeCar(color = 0x3a6fd8) {
  const g = new THREE.Group();
  const body = box(1.9, 0.6, 4.2, color); body.position.y = 0.6; g.add(body);
  const top = box(1.7, 0.6, 2.2, color); top.position.set(0, 1.2, -0.2); g.add(top);
  const glass = box(1.6, 0.45, 2.25, mat(0x9fd3ff, { transparent: true, opacity: 0.55 })); glass.position.set(0, 1.22, -0.2); g.add(glass);
  for (const sx of [-0.6, 0.6]) { const l = box(0.35, 0.2, 0.08, mat(0xfff2c0, { emissive: 0xffe08a, emissiveIntensity: 0.6 })); l.position.set(sx, 0.65, 2.12); g.add(l); const tl = box(0.3, 0.18, 0.06, mat(0xff2a2a, { emissive: 0x880000, emissiveIntensity: 0.6 })); tl.position.set(sx, 0.65, -2.12); g.add(tl); }
  const wheels = []; const front = [];
  for (const [sx, sz, f] of [[-0.9, 1.4, true], [0.9, 1.4, true], [-0.9, -1.4, false], [0.9, -1.4, false]]) { const w = wheel(0.38, 0.28); w.position.set(sx, 0.38, sz); g.add(w); wheels.push(w); if (f) front.push(w); }
  g.userData.wheels = wheels; g.userData.frontWheels = front; g.userData.length = 4.3; g.userData.width = 1.95;
  return g;
}
export function makeAmbulance() {
  const g = new THREE.Group();
  const body = box(2.2, 1.6, 5.4, 0xf4f4f0); body.position.y = 1.2; g.add(body);
  const cab = box(2.2, 1.1, 1.4, 0xf4f4f0); cab.position.set(0, 0.95, 3.0); g.add(cab);
  const glass = box(2.0, 0.6, 0.1, mat(0x9fd3ff, { transparent: true, opacity: 0.6 })); glass.position.set(0, 1.2, 3.72); g.add(glass);
  const stripe = box(2.22, 0.3, 5.4, 0xd32f2f); stripe.position.y = 0.9; g.add(stripe);
  const crossV = box(0.25, 0.9, 0.05, 0xd32f2f); crossV.position.set(1.12, 1.5, -0.5); crossV.rotation.y = Math.PI / 2; g.add(crossV);
  const crossH = box(0.9, 0.25, 0.05, 0xd32f2f); crossH.position.set(1.12, 1.5, -0.5); crossH.rotation.y = Math.PI / 2; g.add(crossH);
  const crossV2 = crossV.clone(); crossV2.position.x = -1.12; g.add(crossV2); const crossH2 = crossH.clone(); crossH2.position.x = -1.12; g.add(crossH2);
  const barBase = box(1.4, 0.15, 0.4, 0x333333); barBase.position.set(0, 2.08, 1.2); g.add(barBase);
  const lightR = box(0.6, 0.22, 0.4, mat(0xff3030, { emissive: 0xff0000, emissiveIntensity: 1.2, noCache: true })); lightR.position.set(-0.4, 2.25, 1.2); g.add(lightR);
  const lightB = box(0.6, 0.22, 0.4, mat(0x4f8cff, { emissive: 0x2050ff, emissiveIntensity: 1.2, noCache: true })); lightB.position.set(0.4, 2.25, 1.2); g.add(lightB);
  for (const sx of [-0.7, 0.7]) { const l = box(0.4, 0.22, 0.08, mat(0xfff2c0, { emissive: 0xffe08a, emissiveIntensity: 0.6 })); l.position.set(sx, 0.75, 3.72); g.add(l); }
  const wheels = []; const front = [];
  for (const [sx, sz, f] of [[-1.0, 2.4, true], [1.0, 2.4, true], [-1.0, -1.8, false], [1.0, -1.8, false]]) { const w = wheel(0.45, 0.3); w.position.set(sx, 0.45, sz); g.add(w); wheels.push(w); if (f) front.push(w); }
  g.userData.wheels = wheels; g.userData.frontWheels = front; g.userData.length = 7.0; g.userData.width = 2.3; g.userData.lights = [lightR, lightB];
  return g;
}
export function makeJeep(color = 0x5a6b3a) {
  const g = new THREE.Group();
  const body = box(2.0, 0.7, 4.0, color); body.position.y = 0.75; g.add(body);
  const hood = box(1.9, 0.4, 1.2, color); hood.position.set(0, 1.0, 1.3); g.add(hood);
  const cabin = box(1.9, 0.8, 2.0, color); cabin.position.set(0, 1.5, -0.3); g.add(cabin);
  const glass = box(1.8, 0.5, 0.1, mat(0x9fd3ff, { transparent: true, opacity: 0.6 })); glass.position.set(0, 1.55, 0.72); g.add(glass);
  const roof = box(2.0, 0.08, 2.1, 0x3a3a3a); roof.position.set(0, 1.92, -0.3); g.add(roof);
  for (const sx of [-0.6, 0.6]) { const l = box(0.3, 0.2, 0.08, mat(0xfff2c0, { emissive: 0xffe08a, emissiveIntensity: 0.6 })); l.position.set(sx, 0.9, 2.02); g.add(l); }
  const wheels = []; const front = [];
  for (const [sx, sz, f] of [[-1.0, 1.3, true], [1.0, 1.3, true], [-1.0, -1.3, false], [1.0, -1.3, false]]) { const w = wheel(0.45, 0.32); w.position.set(sx, 0.45, sz); g.add(w); wheels.push(w); if (f) front.push(w); }
  g.userData.wheels = wheels; g.userData.frontWheels = front; g.userData.length = 4.2; g.userData.width = 2.1;
  return g;
}
export function makeBicycle() { const g = new THREE.Group(); for (const z of [-0.5, 0.5]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.03, 6, 14), mat(0x222222)); w.position.set(0, 0.33, z); w.rotation.y = Math.PI / 2; g.add(w); } const frame = box(0.05, 0.05, 1.0, 0xc8452c); frame.position.y = 0.55; g.add(frame); const seat = box(0.15, 0.05, 0.25, 0x222222); seat.position.set(0, 0.85, -0.2); g.add(seat); const post = box(0.04, 0.3, 0.04, 0xc8452c); post.position.set(0, 0.7, -0.2); g.add(post); const bars = box(0.4, 0.04, 0.04, 0x444444); bars.position.set(0, 0.9, 0.4); g.add(bars); return g; }

// ---------------------------------------------------------------- epic props
export function makeHorse(color = 0xf0ead6) {
  const g = new THREE.Group();
  const body = box(0.6, 0.7, 1.5, color); body.position.y = 1.1; g.add(body);
  const neck = box(0.3, 0.7, 0.4, color); neck.position.set(0, 1.6, 0.8); neck.rotation.x = -0.5; g.add(neck);
  const head = box(0.28, 0.3, 0.6, color); head.position.set(0, 1.95, 1.15); g.add(head);
  const mane = box(0.1, 0.5, 0.5, 0x3a2a1a); mane.position.set(0, 1.85, 0.75); mane.rotation.x = -0.5; g.add(mane);
  const legs = [];
  for (const [sx, sz] of [[-0.2, 0.55], [0.2, 0.55], [-0.2, -0.55], [0.2, -0.55]]) { const p = new THREE.Group(); const l = box(0.14, 0.8, 0.14, color); l.position.y = -0.4; p.add(l); p.position.set(sx, 0.8, sz); g.add(p); legs.push(p); }
  const tail = box(0.08, 0.6, 0.08, 0x3a2a1a); tail.position.set(0, 1.0, -0.8); tail.rotation.x = 0.3; g.add(tail);
  g.userData.legs = legs; return g;
}
export function makeChariot({ color = 0xd4a63a, canopy = 0xc8452c, flagColor = 0xf1c75b } = {}) {
  const g = new THREE.Group();
  const base = box(2.0, 0.25, 2.4, 0x6b4a2b); base.position.y = 0.9; g.add(base);
  const front = box(2.0, 0.9, 0.12, color, { metalness: 0.5, roughness: 0.5 }); front.position.set(0, 1.4, 1.2); g.add(front);
  for (const sx of [-1, 1]) { const side = box(0.12, 0.7, 2.4, color, { metalness: 0.5, roughness: 0.5 }); side.position.set(sx * 0.95, 1.3, 0); g.add(side); }
  for (const sx of [-1.2, 1.2]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.1, 8, 18), mat(0x6b4a2b)); w.position.set(sx, 0.75, -0.4); w.rotation.y = Math.PI / 2; g.add(w); for (let i = 0; i < 4; i++) { const sp = box(0.06, 1.4, 0.06, 0x8b6a3b); sp.position.set(sx, 0.75, -0.4); sp.rotation.x = i * Math.PI / 4; g.add(sp); } }
  const axle = cyl(0.07, 0.07, 2.6, 0x3a2a1a, 8); axle.rotation.z = Math.PI / 2; axle.position.set(0, 0.75, -0.4); g.add(axle);
  for (const sx of [-0.8, 0.8]) { const p = cyl(0.04, 0.04, 2.2, color, 6); p.position.set(sx, 2.1, -0.9); g.add(p); }
  const can = box(2.2, 0.1, 1.6, canopy); can.position.set(0, 3.2, -0.5); g.add(can);
  const shaft = box(0.15, 0.12, 3.5, 0x6b4a2b); shaft.position.set(0, 0.9, 2.8); g.add(shaft);
  const horses = []; for (const sx of [-0.7, 0.7]) { const h = makeHorse(sx < 0 ? 0xf0ead6 : 0xe6dccb); h.position.set(sx, 0, 4.0); g.add(h); horses.push(h); }
  const flag = makeFlag(flagColor, 4.5); flag.position.set(-0.9, 1.0, -1.1); g.add(flag);
  g.userData.horses = horses; g.userData.flag = flag; return g;
}
export function makeArmy({ rows = 6, cols = 30, spacing = 2.2, color = 0xb0372a, banner = 0xd4a63a, facing = 1 } = {}) {
  const g = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(0.5, 1.0, 0.3); const headGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3); const spearGeo = new THREE.CylinderGeometry(0.02, 0.02, 2.4, 4);
  const n = rows * cols;
  const body = new THREE.InstancedMesh(bodyGeo, mat(color, { flat: true }), n); const head = new THREE.InstancedMesh(headGeo, mat(0xc68642), n); const spear = new THREE.InstancedMesh(spearGeo, mat(0x6b4a2b), n);
  const d = new THREE.Object3D(); let i = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = (c - cols / 2) * spacing + (Math.random() - 0.5) * 0.4; const z = r * spacing * 1.3 * facing + (Math.random() - 0.5) * 0.4;
    d.position.set(x, 1.1, z); d.rotation.set(0, 0, 0); d.updateMatrix(); body.setMatrixAt(i, d.matrix);
    d.position.set(x, 1.75, z); d.updateMatrix(); head.setMatrixAt(i, d.matrix);
    d.position.set(x + 0.35, 1.6, z); d.updateMatrix(); spear.setMatrixAt(i, d.matrix); i++;
  }
  body.castShadow = true; g.add(body, head, spear);
  for (let c = 0; c < cols; c += 6) { const f = makeFlag(banner, 5); f.position.set((c - cols / 2) * spacing, 0, -spacing * facing); g.add(f); }
  return g;
}
