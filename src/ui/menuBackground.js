// Cinematic 3D background for the main menu: dusk sky, temple silhouettes, a chariot, clouds and golden particles.
import * as THREE from 'three';
import { makeSky, makeSun, makeHemi, makeGround, makeParticles, makeClouds, makeChariot, makeKrishnaFigure, makeHuman, makeFlag, mat, box, cyl } from '../engine/worldKit.js';

function temple(w, h, color) {
  const g = new THREE.Group();
  const base = box(w, h * 0.35, w, color); base.position.y = h * 0.175; g.add(base);
  const mid = box(w * 0.7, h * 0.3, w * 0.7, color); mid.position.y = h * 0.5; g.add(mid);
  const tower = new THREE.Mesh(new THREE.ConeGeometry(w * 0.4, h * 0.45, 4), mat(color, { flat: true })); tower.position.y = h * 0.87; tower.rotation.y = Math.PI / 4; g.add(tower);
  const finial = cyl(0.05, 0.15, h * 0.12, 0xd4a63a, 6); finial.position.y = h * 1.12; g.add(finial);
  for (let i = 0; i < 4; i++) { const p = cyl(0.12, 0.12, h * 0.35, color, 6); p.position.set(Math.cos(i * Math.PI / 2 + Math.PI / 4) * w * 0.55, h * 0.175, Math.sin(i * Math.PI / 2 + Math.PI / 4) * w * 0.55); g.add(p); }
  return g;
}

export class MenuBackground {
  constructor(settings) {
    this.settings = settings;
    this.scene = new THREE.Scene(); this.camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 1000);
    this.scene.fog = new THREE.Fog(0x2a2448, 40, 260);
    makeSky(this.scene, { top: 0x0b1026, bottom: 0xe59a4a, horizon: 0x6a3c6a });
    this.sun = makeSun(this.scene, { color: 0xffc98a, intensity: 1.6, position: [-40, 25, -80], shadowArea: 40 });
    makeHemi(this.scene, 0x3a4a8a, 0x2a1a10, 0.6);
    const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(14, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffd27a, fog: false })); sunDisc.position.set(-90, 22, -260); this.scene.add(sunDisc);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(22, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.25, fog: false })); halo.position.copy(sunDisc.position); this.scene.add(halo);
    const ground = makeGround(600, 0x2a2316); this.scene.add(ground);
    // river of light
    const river = new THREE.Mesh(new THREE.PlaneGeometry(40, 400), mat(0x3a4a7a, { roughness: 0.2, metalness: 0.4, emissive: 0x1a2440 })); river.rotation.x = -Math.PI / 2; river.position.set(-60, 0.05, -100); this.scene.add(river);
    // temples
    const temps = [[-30, 0, -70, 10, 22], [10, 0, -90, 14, 30], [45, 0, -60, 9, 18], [-70, 0, -130, 16, 34], [80, 0, -120, 12, 26], [25, 0, -140, 18, 40], [-15, 0, -170, 20, 46]];
    for (const [x, y, z, w, h] of temps) { const t = temple(w, h, 0x1a1a2e); t.position.set(x, y, z); this.scene.add(t); }
    // foreground chariot with Krishna and Arjuna
    this.chariot = makeChariot({ color: 0xd4a63a }); this.chariot.position.set(6, 0, -14); this.chariot.rotation.y = -0.6; this.scene.add(this.chariot);
    const krishna = makeKrishnaFigure(); krishna.position.set(0, 1.0, 0.5); this.chariot.add(krishna);
    const arjuna = makeHuman({ shirt: 0xb0372a, pants: 0xf0ead6, skin: 0xc68642 }); arjuna.position.set(0, 1.0, -0.6); this.chariot.add(arjuna); this.arjuna = arjuna; this.krishna = krishna;
    for (let i = 0; i < 6; i++) { const f = makeFlag(i % 2 ? 0xd4a63a : 0xb0372a, 6 + Math.random() * 2); f.position.set(-25 + i * 9, 0, -35 - Math.random() * 10); this.scene.add(f); }
    // torches
    for (const [x, z] of [[-6, -8], [14, -6]]) { const p = cyl(0.08, 0.1, 2.5, 0x3a2a1a, 6); p.position.set(x, 1.25, z); this.scene.add(p); const fl = new THREE.PointLight(0xffa040, 2.5, 18, 2); fl.position.set(x, 2.8, z); this.scene.add(fl); const flame = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffb060 })); flame.position.copy(fl.position); this.scene.add(flame); this.torches = this.torches || []; this.torches.push({ light: fl, flame }); }
    this.particles = makeParticles({ count: 420, color: 0xf1c75b, size: 0.5, area: [80, 30, 60], center: [0, 12, -30], speed: 0.6 }); this.scene.add(this.particles);
    this.clouds = makeClouds(12, { radius: 180, height: 55, color: 0x5a4a7a }); this.scene.add(this.clouds);
    this.t = 0; this.camera.position.set(-8, 5, 12);
  }
  update(dt) {
    this.t += dt; const reduced = this.settings.get('reducedMotion');
    const k = reduced ? 0 : 1;
    this.camera.position.set(-8 + Math.sin(this.t * 0.08) * 6 * k, 5 + Math.sin(this.t * 0.11) * 0.8 * k, 12 + Math.cos(this.t * 0.06) * 3 * k);
    this.camera.lookAt(2 + Math.sin(this.t * 0.05) * 3 * k, 6, -40);
    if (this.settings.get('particles')) { this.particles.visible = true; this.particles.userData.update(dt, this.t); } else this.particles.visible = false;
    this.clouds.userData.update(dt * 2);
    this.arjuna.userData.animate?.(this.t, false); this.krishna.userData.animate?.(this.t, false);
    const flag = this.chariot.userData.flag?.userData.flag; if (flag) flag.rotation.y = Math.sin(this.t * 2) * 0.3;
    for (const h of this.chariot.userData.horses) h.userData.legs.forEach((l, i) => { l.rotation.x = Math.sin(this.t * 1.2 + i) * 0.05; });
    for (const tr of this.torches || []) { tr.light.intensity = 2.2 + Math.sin(this.t * 9 + tr.light.position.x) * 0.5 + Math.random() * 0.3; tr.flame.scale.setScalar(0.9 + Math.random() * 0.3); }
  }
}
