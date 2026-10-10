// Lightweight 2D (XZ-plane) collision helpers used by vehicles, characters and NPCs.
import * as THREE from 'three';

/** Axis-aligned box collider in XZ. */
export function aabb(minX, minZ, maxX, maxZ, tag = 'solid', data = {}) { return { type: 'aabb', minX, minZ, maxX, maxZ, tag, ...data }; }
/** Circle collider in XZ. */
export function circle(x, z, r, tag = 'solid', data = {}) { return { type: 'circle', x, z, r, tag, ...data }; }

const _box = new THREE.Box3();
/** Build an AABB collider from an object's world bounds (call after positioning). */
export function colliderFromObject(obj, tag = 'solid', pad = 0, data = {}) {
  obj.updateMatrixWorld(true);
  _box.setFromObject(obj);
  return aabb(_box.min.x - pad, _box.min.z - pad, _box.max.x + pad, _box.max.z + pad, tag, { object: obj, ...data });
}

/** Resolve a circle (x,z,r) against a list of colliders; returns { x, z, hits:[] }. */
export function resolveCircle(x, z, r, colliders, ignore = null) {
  const hits = [];
  for (let iter = 0; iter < 3; iter++) {
    let moved = false;
    for (const c of colliders) {
      if (c === ignore || c.disabled) continue;
      if (c.type === 'aabb') {
        const cx = Math.max(c.minX, Math.min(x, c.maxX)); const cz = Math.max(c.minZ, Math.min(z, c.maxZ));
        let dx = x - cx, dz = z - cz; let d2 = dx * dx + dz * dz;
        if (d2 < r * r) {
          if (c.trigger) { if (!hits.includes(c)) hits.push(c); continue; }
          if (d2 < 1e-8) { // center inside the box: push along the shallowest axis
            const left = x - c.minX, right = c.maxX - x, down = z - c.minZ, up = c.maxZ - z;
            const m = Math.min(left, right, down, up);
            if (m === left) x = c.minX - r; else if (m === right) x = c.maxX + r; else if (m === down) z = c.minZ - r; else z = c.maxZ + r;
          } else { const d = Math.sqrt(d2); const push = r - d; x += (dx / d) * push; z += (dz / d) * push; }
          if (!hits.includes(c)) hits.push(c); moved = true;
        }
      } else if (c.type === 'circle') {
        const dx = x - c.x, dz = z - c.z; const rr = r + c.r; const d2 = dx * dx + dz * dz;
        if (d2 < rr * rr) {
          if (c.trigger) { if (!hits.includes(c)) hits.push(c); continue; }
          const d = Math.sqrt(d2) || 0.0001; const push = rr - d; x += (dx / d) * push; z += (dz / d) * push;
          if (!hits.includes(c)) hits.push(c); moved = true;
        }
      }
    }
    if (!moved) break;
  }
  return { x, z, hits };
}

/** Oriented box (center x,z; half extents hl along heading, hw sideways; yaw) corners. */
export function obbCorners(x, z, yaw, hl, hw) {
  const fx = Math.sin(yaw), fz = Math.cos(yaw); const rx = fz, rz = -fx;
  return [
    [x + fx * hl + rx * hw, z + fz * hl + rz * hw], [x + fx * hl - rx * hw, z + fz * hl - rz * hw],
    [x - fx * hl - rx * hw, z - fz * hl - rz * hw], [x - fx * hl + rx * hw, z - fz * hl + rz * hw],
  ];
}

function projectPoly(pts, ax, az) { let min = Infinity, max = -Infinity; for (const [px, pz] of pts) { const p = px * ax + pz * az; if (p < min) min = p; if (p > max) max = p; } return [min, max]; }

/** SAT test between an OBB (as corners) and an AABB; returns MTV {x,z,depth} or null. */
export function obbVsAabb(corners, c) {
  const boxPts = [[c.minX, c.minZ], [c.maxX, c.minZ], [c.maxX, c.maxZ], [c.minX, c.maxZ]];
  const e1x = corners[1][0] - corners[0][0], e1z = corners[1][1] - corners[0][1]; const e2x = corners[3][0] - corners[0][0], e2z = corners[3][1] - corners[0][1];
  const l1 = Math.hypot(e1x, e1z) || 1, l2 = Math.hypot(e2x, e2z) || 1;
  const axes = [[1, 0], [0, 1], [e1x / l1, e1z / l1], [e2x / l2, e2z / l2]];
  let best = null;
  for (const [ax, az] of axes) {
    const [a0, a1] = projectPoly(corners, ax, az); const [b0, b1] = projectPoly(boxPts, ax, az);
    const overlap = Math.min(a1, b1) - Math.max(a0, b0);
    if (overlap <= 0) return null;
    if (!best || overlap < best.depth) {
      // direction from box to obb
      const ca = (a0 + a1) / 2, cb = (b0 + b1) / 2; const sign = ca < cb ? -1 : 1;
      best = { x: ax * sign, z: az * sign, depth: overlap };
    }
  }
  return best;
}

/** OBB vs circle: returns MTV {x,z,depth} or null. */
export function obbVsCircle(x, z, yaw, hl, hw, c) {
  const fx = Math.sin(yaw), fz = Math.cos(yaw); const rx = fz, rz = -fx;
  const dx = c.x - x, dz = c.z - z;
  const lf = dx * fx + dz * fz, lr = dx * rx + dz * rz; // local coords
  const cf = Math.max(-hl, Math.min(hl, lf)), cr = Math.max(-hw, Math.min(hw, lr));
  const ddf = lf - cf, ddr = lr - cr; const d2 = ddf * ddf + ddr * ddr;
  if (d2 >= c.r * c.r) return null;
  const d = Math.sqrt(d2) || 0.0001; const depth = c.r - d;
  const nx = (ddf * fx + ddr * rx) / d, nz = (ddf * fz + ddr * rz) / d; // from obb toward circle
  return { x: -nx, z: -nz, depth };
}

/** Distance from a point to an AABB (0 if inside). */
export function distToAabb(x, z, c) { const dx = Math.max(c.minX - x, 0, x - c.maxX); const dz = Math.max(c.minZ - z, 0, z - c.maxZ); return Math.hypot(dx, dz); }
export function dist2D(ax, az, bx, bz) { return Math.hypot(ax - bx, az - bz); }
export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function damp(a, b, lambda, dt) { return lerp(a, b, 1 - Math.exp(-lambda * dt)); }
export function angleLerp(a, b, t) { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * t; }

/** Distance from a point to an oriented box (0 if inside). */
export function obbDistanceToPoint(x, z, yaw, hl, hw, px, pz) {
  const fx = Math.sin(yaw), fz = Math.cos(yaw); const rx = fz, rz = -fx;
  const dx = px - x, dz = pz - z; const lf = dx * fx + dz * fz, lr = dx * rx + dz * rz;
  return Math.hypot(Math.max(0, Math.abs(lf) - hl), Math.max(0, Math.abs(lr) - hw));
}
