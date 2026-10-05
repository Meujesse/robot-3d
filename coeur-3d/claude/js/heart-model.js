// Anatomie du cœur : primitives, cavités, valves, sillons et coronaires.
// Toutes les coordonnées sont dans le repère du cœur (x = gauche du patient, y = haut, z = avant).
import { roundCone, ellipsoid, cylinder, smin, surfaceNets, grad, project, bisect, vec } from './heart-sdf.js';

const { norm, sub, add, mul, dot, cross, len3 } = vec;

/* ---------- Primitives ---------- */
export const LV_A = [0.34, -0.1, -0.15], LV_B = [0.92, -1.0, 0.2];
const LV = roundCone(LV_A, LV_B, 0.62, 0.3);
const RV = ellipsoid([0.06, -0.4, 0.24], [0.82, 0.52, 0.4], [0.85, -0.45, 0.12], [0, 0.3, 1]);
const RVIN = roundCone([-0.05, -0.38, 0.22], [-0.55, -0.04, -0.02], 0.44, 0.36);
const CONUS = roundCone([0.0, 0.05, 0.42], [0.18, 0.72, 0.3], 0.38, 0.25);
const RA = ellipsoid([-0.92, 0.18, -0.02], [0.62, 0.48, 0.44], [0.12, 1, 0.08], [0.1, 0, 1]);
const RAU = roundCone([-0.66, 0.6, 0.22], [-0.34, 0.74, 0.44], 0.19, 0.09);
const LA = ellipsoid([0.2, 0.4, -0.52], [0.6, 0.34, 0.36], [1, 0.05, 0.05], [0, 0, 1]);
const LAU = roundCone([0.58, 0.56, -0.22], [0.76, 0.62, 0.12], 0.17, 0.085);
export const AO_A = [0.04, 0.26, -0.08], AO_B = [-0.08, 0.76, -0.02];
const AO = roundCone(AO_A, AO_B, 0.29, 0.25);
// prolongements des cavités au-delà de la paroi (ouvertures vers l'aorte et le tronc pulmonaire)
const AO_DIR = norm(sub(AO_B, AO_A));
const AOH = roundCone(AO_A, add(AO_B, mul(AO_DIR, 0.35)), 0.2, 0.16);
export const PV_A = [0.0, 0.05, 0.42], PV_B = [0.18, 0.72, 0.3];
const PV_DIR = norm(sub(PV_B, PV_A));
const PAH = roundCone(add(PV_A, mul(PV_DIR, 0.2)), add(PV_B, mul(PV_DIR, 0.35)), 0.28, 0.16);

export const CENTERS = {
  vg: [0.6, -0.5, 0.0], vd: [0.0, -0.4, 0.3], od: [-0.92, 0.18, -0.02], og: [0.2, 0.4, -0.52]
};

const S = {};   // valeurs du dernier appel
function base(x, y, z) {
  const lv = LV(x, y, z);
  const rv = smin(smin(RV(x, y, z), RVIN(x, y, z), 0.2), CONUS(x, y, z), 0.24);
  const ra = smin(RA(x, y, z), RAU(x, y, z), 0.14);
  const la = smin(LA(x, y, z), LAU(x, y, z), 0.12);
  const ao = AO(x, y, z);
  const vent = smin(lv, rv, 0.16);
  const atr = smin(ra, la, 0.16);
  let outer = smin(vent, atr, 0.09);
  outer = smin(outer, ao, 0.09);
  S.lv = lv; S.rv = rv; S.ra = ra; S.la = la; S.ao = ao; S.vent = vent; S.atr = atr; S.outer = outer;
  return S;
}
export const outer = (x, y, z) => base(x, y, z).outer;
export const fVent = (x, y, z) => base(x, y, z).vent;
export const fAtr = (x, y, z) => base(x, y, z).atr;
export const fLV = (x, y, z) => base(x, y, z).lv;
export const fRV = (x, y, z) => base(x, y, z).rv;
export const fRA = (x, y, z) => base(x, y, z).ra;
export const fLA = (x, y, z) => base(x, y, z).la;

/* ---------- Valves auriculo-ventriculaires (positions calculées) ---------- */
const avValve = (atrC, ventC, fa, fv, r, shift = [0, 0, 0]) => {
  const c = add(bisect(atrC, ventC, fa, fv), shift);
  return { c, n: norm(sub(ventC, atrC)), r };
};
export const VALVES = {
  tricuspide: avValve([-0.92, 0.14, 0.0], [0.0, -0.4, 0.3], fRA, fVent, 0.23, [0.06, 0, -0.14]),
  mitrale: avValve([0.2, 0.38, -0.5], [0.6, -0.5, 0.0], fLA, fVent, 0.24),
  pulmonaire: { c: add(PV_B, mul(PV_DIR, 0.06)), n: PV_DIR, r: 0.165 },
  aortique: { c: add(AO_B, mul(AO_DIR, 0.05)), n: AO_DIR, r: 0.165 }
};
const OPEN_T = cylinder(add(VALVES.tricuspide.c, mul(VALVES.tricuspide.n, -0.1)), add(VALVES.tricuspide.c, mul(VALVES.tricuspide.n, 0.1)), 0.23);
const OPEN_M = cylinder(add(VALVES.mitrale.c, mul(VALVES.mitrale.n, -0.1)), add(VALVES.mitrale.c, mul(VALVES.mitrale.n, 0.1)), 0.24);

/* ---------- Champ complet (paroi + cavités) ---------- */
const CAV = {};
function full(x, y, z) {
  const s = base(x, y, z);
  const { lv, rv, ra, la, ao, vent, atr } = s;
  const cLV = Math.max(lv + 0.17, (lv - atr) * 0.5 + 0.035, -ao + 0.03);
  const cRV = Math.max(rv + 0.09, -lv + 0.005, (rv - atr) * 0.5 + 0.035, -ao + 0.04);
  const cRA = Math.max(ra + 0.085, (ra - vent) * 0.5 + 0.035, (ra - la) * 0.5 + 0.03, -ao + 0.04);
  const cLA = Math.max(la + 0.085, (la - vent) * 0.5 + 0.035, (la - ra) * 0.5 + 0.03, -ao + 0.04);
  const oT = Math.max(OPEN_T(x, y, z), -lv + 0.02);
  const oM = Math.max(OPEN_M(x, y, z), -rv + 0.02, -ao + 0.03);
  let cav = Math.min(cLV, cRV, cRA, cLA, oT, oM);
  cav = Math.max(cav, s.outer + 0.06);
  const cAO = Math.max(AOH(x, y, z), (ao - atr) * 0.5 + 0.03, -rv + 0.02);
  const cPA = Math.max(PAH(x, y, z), -lv + 0.02, -ao + 0.03);
  cav = Math.min(cav, cAO, cPA);
  CAV.cLV = cLV; CAV.cRV = Math.min(cRV, cPA); CAV.cRA = cRA; CAV.cLA = cLA; CAV.cAO = cAO; CAV.oT = oT; CAV.oM = oM; CAV.cav = cav;
  CAV.solid = -smin(-s.outer, cav, 0.02);
  return CAV;
}
export const solid = (x, y, z) => full(x, y, z).solid;

// Étiquette d'un point de surface : { id, cav }
export function labelAt(x, y, z) {
  const c = full(x, y, z);
  const s = S;
  if (Math.abs(c.cav) < Math.abs(s.outer)) {
    const cands = [['vg', c.cLV], ['vd', c.cRV], ['od', c.cRA], ['og', c.cLA], ['aorte', c.cAO],
      [s.ra < s.rv ? 'od' : 'vd', c.oT], [s.la < s.lv ? 'og' : 'vg', c.oM]];
    let best = cands[0];
    for (const k of cands) if (k[1] < best[1]) best = k;
    return { id: best[0], cav: true };
  }
  const cands = [['vg', s.lv], ['vd', s.rv], ['od', s.ra], ['og', s.la], ['aorte', s.ao]];
  let best = cands[0];
  for (const k of cands) if (k[1] < best[1]) best = k;
  return { id: best[0], cav: false };
}

/* ---------- Maillage ---------- */
export const BMIN = [-1.5, -1.4, -1.0], BMAX = [1.32, 1.08, 0.9];
export function buildMesh(h = 0.024) {
  const t0 = performance.now();
  const { pos, quads } = surfaceNets(solid, BMIN, BMAX, h);
  // recentrage sur la surface + normales par gradient
  const n = pos.length / 3;
  const nor = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    let x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    for (let it = 0; it < 2; it++) {
      const v = solid(x, y, z), g = grad(solid, x, y, z, h * 0.25);
      const l2 = g[0] * g[0] + g[1] * g[1] + g[2] * g[2] || 1;
      const k = Math.max(-h, Math.min(h, v / Math.sqrt(l2))) / Math.sqrt(l2);
      x -= k * g[0]; y -= k * g[1]; z -= k * g[2];
    }
    const g = grad(solid, x, y, z, h * 0.35);
    const l = Math.hypot(g[0], g[1], g[2]) || 1;
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    nor[i * 3] = g[0] / l; nor[i * 3 + 1] = g[1] / l; nor[i * 3 + 2] = g[2] / l;
  }
  // normales géométriques (plus régulières que le gradient sur les bords fins), mélangées au gradient
  const gn = new Float32Array(n * 3);
  const tri = (a, b, c) => {
    const ax = pos[a * 3], ay = pos[a * 3 + 1], az = pos[a * 3 + 2];
    const ux = pos[b * 3] - ax, uy = pos[b * 3 + 1] - ay, uz = pos[b * 3 + 2] - az;
    const vx = pos[c * 3] - ax, vy = pos[c * 3 + 1] - ay, vz = pos[c * 3 + 2] - az;
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const v of [a, b, c]) { gn[v * 3] += nx; gn[v * 3 + 1] += ny; gn[v * 3 + 2] += nz; }
  };
  for (let q = 0; q < quads.length; q += 4) { tri(quads[q], quads[q + 1], quads[q + 2]); tri(quads[q], quads[q + 2], quads[q + 3]); }
  for (let i = 0; i < n; i++) {
    const l = Math.hypot(gn[i * 3], gn[i * 3 + 1], gn[i * 3 + 2]) || 1;
    let x = gn[i * 3] / l + nor[i * 3] * 0.5, y = gn[i * 3 + 1] / l + nor[i * 3 + 1] * 0.5, z = gn[i * 3 + 2] / l + nor[i * 3 + 2] * 0.5;
    const m = Math.hypot(x, y, z) || 1;
    nor[i * 3] = x / m; nor[i * 3 + 1] = y / m; nor[i * 3 + 2] = z / m;
  }
  // étiquettes des faces
  const groups = {};
  for (let q = 0; q < quads.length; q += 4) {
    const a = quads[q], b = quads[q + 1], c = quads[q + 2], d = quads[q + 3];
    let x = 0, y = 0, z = 0;
    for (const v of [a, b, c, d]) { x += pos[v * 3]; y += pos[v * 3 + 1]; z += pos[v * 3 + 2]; }
    const L = labelAt(x / 4, y / 4, z / 4);
    (groups[L.id] ||= []).push(a, b, c, a, c, d);
  }
  // données par sommet
  const lab = new Array(n), cavFlag = new Uint8Array(n), occl = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const L = labelAt(x, y, z);
    lab[i] = L.id; cavFlag[i] = L.cav && outer(x, y, z) < -0.035 ? 1 : 0;
    const e = 0.13;
    const o = solid(x + nor[i * 3] * e, y + nor[i * 3 + 1] * e, z + nor[i * 3 + 2] * e) / e;
    occl[i] = Math.max(0, Math.min(1, o));
  }
  return { pos, nor, groups, lab, cavFlag, occl, ms: performance.now() - t0 };
}

/* ---------- Battements : poids et cibles de contraction par sommet ---------- */
const LV_AXIS = norm(sub(LV_B, LV_A));
const LV_LEN = len3(...sub(LV_B, LV_A));
export function beatAttrs(x, y, z) {
  const s = base(x, y, z);
  const wa = 1 / (1 + Math.exp(-(s.vent - s.atr) / 0.05));
  const prox = 1 - Math.min(1, Math.max(0, s.outer / 0.3));
  const wRA = 1 / (1 + Math.exp(-(s.la - s.ra) / 0.06));
  const cra = CENTERS.od, cla = CENTERS.og;
  const ta = [cla[0] + (cra[0] - cla[0]) * wRA, cla[1] + (cra[1] - cla[1]) * wRA, cla[2] + (cra[2] - cla[2]) * wRA];
  // point de l'axe du VG le plus proche, décalé vers la pointe (raccourcissement)
  const t = Math.max(0, Math.min(LV_LEN, dot(sub([x, y, z], LV_A), LV_AXIS)));
  const q = add(LV_A, mul(LV_AXIS, t));
  const tv = add(q, mul(sub(LV_B, q), 0.32));
  return { wa: wa * prox, wv: (1 - wa) * prox, ta, tv };
}

/* ---------- Territoires coronaires (sommets des ventricules) ---------- */
// angle autour de l'axe du VG, mesuré depuis la direction du septum (vers le VD)
const SEPT = (() => {
  const q = add(LV_A, mul(LV_AXIS, 0.6));
  const d = sub(CENTERS.vd, q);
  return norm(sub(d, mul(LV_AXIS, dot(d, LV_AXIS))));
})();
const ANT = norm(cross(LV_AXIS, SEPT)); // perpendiculaire : orientée vers l'avant ou l'arrière
const ANT_SIGN = ANT[2] > 0 ? 1 : -1;
export function territoryAt(x, y, z, label) {
  if (label !== 'vg' && label !== 'vd') return null;
  const s = base(x, y, z);
  const p = sub([x, y, z], LV_A);
  const t = dot(p, LV_AXIS) / LV_LEN;
  const r = sub(p, mul(LV_AXIS, dot(p, LV_AXIS)));
  const ang = Math.atan2(dot(r, ANT) * ANT_SIGN, dot(r, SEPT)) * 180 / Math.PI; // + = avant
  if (label === 'vd' && s.lv > 0.04) return 'cd';
  if (t > 0.86) return 'iva';
  if (ang > -25 && ang <= 115) return 'iva';
  if (ang > 115 || ang <= -150) return 'cx';
  return 'cd';
}

/* ---------- Sillons et coronaires ---------- */
function catmull(pts, n) {
  const out = [];
  const P = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let s = 0; s < pts.length - 1; s++) {
    const p0 = P(s - 1), p1 = P(s), p2 = P(s + 1), p3 = P(s + 2);
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map((i) => 0.5 * ((2 * p1[i]) + (-p0[i] + p2[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
const dAV = (x, y, z) => { const s = base(x, y, z); return s.atr - s.vent; };
const dIV = (x, y, z) => { const s = base(x, y, z); return s.lv - s.rv; };
// segs : [{ pts:[...], g: fonction de sillon ou null }]
function onSurface(segs, r, n = 10) {
  let pts = [];
  for (const sg of segs) {
    const raw = catmull(sg.pts, n);
    for (const p of raw) pts.push(project(p, outer, sg.g, 40));
  }
  // lissage + décollement de la surface
  for (let it = 0; it < 4; it++) {
    pts = pts.map((p, i) => (i === 0 || i === pts.length - 1 ? p : mul(add(add(pts[i - 1], pts[i + 1]), mul(p, 2)), 0.25)));
    pts = pts.map((p) => project(p, outer, null, 6));
  }
  return pts.map((p) => {
    const g = norm(grad(outer, ...p));
    return add(p, mul(g, r * 0.55));
  });
}
export function coronaryPaths() {
  const ao = AO_B;
  return {
    cd: onSurface([
      { pts: [[-0.16, 0.64, 0.18], [-0.3, 0.6, 0.36], [-0.42, 0.46, 0.48]], g: null },
      { pts: [[-0.5, 0.36, 0.5], [-0.72, 0.08, 0.42], [-0.86, -0.22, 0.2], [-0.82, -0.4, -0.12], [-0.55, -0.48, -0.42], [-0.25, -0.5, -0.6]], g: dAV },
      { pts: [[-0.12, -0.62, -0.58], [0.1, -0.9, -0.45], [0.36, -1.1, -0.25]], g: dIV }
    ], 0.035),
    tronc: onSurface([{ pts: [[0.1, 0.62, -0.12], [0.3, 0.66, -0.06], [0.42, 0.6, 0.06]], g: null }], 0.04, 8),
    iva: onSurface([
      { pts: [[0.42, 0.6, 0.06], [0.42, 0.42, 0.42]], g: null },
      { pts: [[0.4, 0.3, 0.55], [0.38, -0.1, 0.72], [0.45, -0.55, 0.62], [0.62, -0.95, 0.45], [0.78, -1.18, 0.32]], g: dIV }
    ], 0.032),
    cx: onSurface([
      { pts: [[0.42, 0.6, 0.06], [0.62, 0.44, -0.02]], g: null },
      { pts: [[0.74, 0.32, -0.1], [0.98, 0.1, -0.28], [1.0, -0.02, -0.55], [0.82, 0.0, -0.85], [0.5, 0.0, -0.98]], g: dAV }
    ], 0.03)
  };
}

/* ---------- Ancres d'étiquettes (points de surface) ---------- */
export function surfacePoint(p, dir) {
  // marche le long de dir depuis p jusqu'à la surface extérieure
  let a = p;
  for (let i = 0; i < 200; i++) { if (outer(...a) > 0) break; a = add(a, mul(dir, 0.02)); }
  return project(a, outer, null, 8);
}

/* ---------- Plan de coupe (ajusté sur les cavités et les valves) ---------- */
export function cutPlane() {
  const pts = [CENTERS.vg, CENTERS.vd, CENTERS.od, CENTERS.og, VALVES.tricuspide.c, VALVES.mitrale.c, VALVES.aortique.c, VALVES.pulmonaire.c, LV_B];
  const c = pts.reduce((a, p) => add(a, p), [0, 0, 0]).map((v) => v / pts.length);
  let best = null, bestE = Infinity;
  for (let i = 0; i < 4000; i++) {
    const th = Math.acos(1 - 2 * (i + 0.5) / 4000), ph = Math.PI * (1 + Math.sqrt(5)) * i;
    const n = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
    if (n[2] < 0.35) continue; // garder un plan regardable de face
    let e = 0;
    for (const p of pts) { const d = dot(sub(p, c), n); e += d * d; }
    if (e < bestE) { bestE = e; best = n; }
  }
  return { c, n: best };
}
