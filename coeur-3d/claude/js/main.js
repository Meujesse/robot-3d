import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ELEMENTS, ORDER, GROUPS, PHASES, STEPS } from './data.js';
import * as HM from './heart-model.js';

/* ================================================================
   Réglages généraux
   ================================================================ */
const W = 1920, H = 1080;
const VIEW_X = 590, VIEW_Y = 615;        // centre de la zone 3D (à gauche de la fiche)
const params = new URLSearchParams(location.search);
const CAPTURE = params.has('capture');
let INSTANT = false;

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const VA = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const C = (hex) => new THREE.Color(hex);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
const easeInOut = (k) => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const $ = (s) => document.querySelector(s);

const stage = $('#stage');
const canvas = $('#scene');

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: CAPTURE });
} catch (e) {
  $('#loading p').textContent = "La 3D n'est pas disponible sur cet appareil.";
  throw e;
}
renderer.setClearColor(0x000000, 0);
renderer.setSize(W, H, false);
renderer.localClippingEnabled = true;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 200);

/* --- Mise à l'échelle 16:9 (letterbox) --- */
let stageScale = 1, fitW = -1, fitH = -1;
function fit() {
  // Genially crée parfois l'iframe à taille nulle puis l'agrandit sans événement resize
  const w = document.documentElement.clientWidth || innerWidth;
  const h = document.documentElement.clientHeight || innerHeight;
  if (w === fitW && h === fitH) return;
  fitW = w; fitH = h;
  if (!w || !h) return;
  const s = Math.min(w / W, h / H);
  stageScale = s;
  stage.style.transform = `translate(${(w - W * s) / 2}px, ${(h - H * s) / 2}px) scale(${s})`;
  renderer.setPixelRatio(clamp(s * (devicePixelRatio || 1), 0.75, 2));
  renderer.setSize(W, H, false);
}
addEventListener('resize', fit);
if ('ResizeObserver' in window) new ResizeObserver(fit).observe(document.documentElement);
setInterval(fit, 500);
fit();

/* --- Lumières --- */
scene.add(new THREE.HemisphereLight(0xffffff, 0xc9d2de, 1.05));
const key = new THREE.DirectionalLight(0xffffff, 2.1);
key.position.set(-7, 6, 7);
scene.add(key);
const rim = new THREE.DirectionalLight(0xe4f2ff, 0.8);
rim.position.set(7, 1, -5);
scene.add(rim);
// les lumières suivent la caméra (éclairage constant quand on tourne le cœur)
const lightRig = new THREE.Group();
scene.add(lightRig);
lightRig.add(key, rim, key.target, rim.target);

/* ================================================================
   Matériaux « illustration »
   ================================================================ */
const gradientMap = new THREE.DataTexture(new Uint8Array([105, 160, 210, 245, 255]), 5, 1, THREE.RedFormat);
gradientMap.minFilter = gradientMap.magFilter = THREE.LinearFilter;
gradientMap.needsUpdate = true;

const BEAT = { uAtr: { value: 0 }, uVen: { value: 0 } };
const BEAT_DECL = 'attribute vec2 aW;\nattribute vec3 aTa;\nattribute vec3 aTv;\nuniform float uAtr;\nuniform float uVen;\n';
const BEAT_GLSL = 'transformed += (aTa - transformed) * (aW.x * uAtr * 0.12) + (aTv - transformed) * (aW.y * uVen * 0.14);';

// plan de coupe (désactivé = rejeté très loin)
const cutPlane = new THREE.Plane(V(0, 0, -1), 100);
const vesselPlane = new THREE.Plane(V(0, 0, -1), 100);
const CLIP = [cutPlane], CLIP_V = [vesselPlane];

function heartMat(color, { vertexColors = false, cap = '#C9505C', clip = true, beat = true, planes = CLIP } = {}) {
  const m = new THREE.MeshToonMaterial({ color: vertexColors ? 0xffffff : color, gradientMap, vertexColors, side: THREE.DoubleSide });
  m.emissive = C('#FFE2A0');
  m.emissiveIntensity = 0;
  if (clip) m.clippingPlanes = planes;
  const capC = C(cap);
  m.onBeforeCompile = (s) => {
    s.uniforms.uCap = { value: capC };
    if (beat) {
      s.uniforms.uAtr = BEAT.uAtr; s.uniforms.uVen = BEAT.uVen;
      s.vertexShader = BEAT_DECL + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + BEAT_GLSL);
    }
    s.fragmentShader = 'uniform vec3 uCap;\n' + s.fragmentShader.replace('#include <tonemapping_fragment>',
      'if (!gl_FrontFacing) gl_FragColor.rgb = uCap;\n#include <tonemapping_fragment>');
  };
  m.customProgramCacheKey = () => 'heart' + (beat ? 'b' : '') + (vertexColors ? 'v' : '');
  return m;
}
function outlineMat(color, thick, { clip = true, beat = true, planes = CLIP } = {}) {
  const m = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
  if (clip) m.clippingPlanes = planes;
  m.onBeforeCompile = (s) => {
    s.uniforms.uThick = { value: thick };
    if (beat) { s.uniforms.uAtr = BEAT.uAtr; s.uniforms.uVen = BEAT.uVen; }
    s.vertexShader = (beat ? BEAT_DECL : '') + 'uniform float uThick;\n' + s.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n' + (beat ? BEAT_GLSL + '\n' : '') + 'transformed += normalize(normal) * uThick;');
  };
  m.customProgramCacheKey = () => 'outline' + (beat ? 'b' : '');
  return m;
}
function darker(hex, k = 0.55) {
  const c = C(hex), hsl = {};
  c.getHSL(hsl);
  return new THREE.Color().setHSL(hsl.h, clamp(hsl.s * 0.9, 0, 1), hsl.l * k);
}

/* ================================================================
   Éléments cliquables
   ================================================================ */
class El {
  constructor(id) {
    this.id = id; this.data = ELEMENTS[id];
    this.meshes = []; this.outlines = [];
    this.hover = 0; this.glow = 0; this.glowTarget = 0;
    this.anchor = V(0, 0, 0); this.anchorN = null;
  }
  applyLook() {
    const g = Math.max(this.glow, this.hover);
    for (const m of this.meshes) if (m.material.emissive) m.material.emissiveIntensity = g * 0.3;
  }
}
const els = Object.fromEntries(ORDER.map((id) => [id, new El(id)]));
const pickables = [];
const heart = new THREE.Group();     // repère du cœur
scene.add(heart);

function addMesh(el, geom, mat, { outline = null, pick = true, parent = heart, clip = true } = {}) {
  const m = new THREE.Mesh(geom, mat);
  m.userData.el = el; m.userData.clip = clip;
  parent.add(m);
  if (el) el.meshes.push(m);
  if (outline) {
    const om = new THREE.Mesh(geom, outline);
    om.raycast = () => {};
    m.add(om);
    if (el) el.outlines.push(om);
  }
  if (pick && el) pickables.push(m);
  return m;
}
// attributs de battement pour une géométrie quelconque (repère du cœur)
function setBeatAttrs(g) {
  const p = g.attributes.position, n = p.count;
  const aW = new Float32Array(n * 2), aTa = new Float32Array(n * 3), aTv = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const b = HM.beatAttrs(p.getX(i), p.getY(i), p.getZ(i));
    aW[i * 2] = b.wa; aW[i * 2 + 1] = b.wv;
    aTa.set(b.ta, i * 3); aTv.set(b.tv, i * 3);
  }
  g.setAttribute('aW', new THREE.BufferAttribute(aW, 2));
  g.setAttribute('aTa', new THREE.BufferAttribute(aTa, 3));
  g.setAttribute('aTv', new THREE.BufferAttribute(aTv, 3));
}
function displaced(p) {   // même déplacement que le shader (pour les valves)
  const b = HM.beatAttrs(p.x, p.y, p.z);
  const a = BEAT.uAtr.value * 0.12 * b.wa, v = BEAT.uVen.value * 0.14 * b.wv;
  return V(p.x + (b.ta[0] - p.x) * a + (b.tv[0] - p.x) * v, p.y + (b.ta[1] - p.y) * a + (b.tv[1] - p.y) * v, p.z + (b.ta[2] - p.z) * a + (b.tv[2] - p.z) * v);
}

/* ================================================================
   Construction du cœur
   ================================================================ */
const WALL = { vg: '#E57373', vd: '#F3A097', od: '#EE9AA3', og: '#E68A98', aorte: '#E8505B' };
const LINING = { vg: '#F6B7B4', og: '#F6B7B4', aorte: '#F6B7B4', vd: '#B9C6EF', od: '#B9C6EF' };
const RED = '#E63946', BLUE = '#5B7FD6', PV_RED = '#E8505B', COR = '#D62839';
const OBST = C('#8E80A8');
let wallGeo = null, baseColors = null, territory = null;

function buildWalls() {
  const M = HM.buildMesh(params.get('res') ? +params.get('res') : 0.024);
  const n = M.pos.length / 3;
  const pos = new THREE.BufferAttribute(M.pos, 3);
  const nor = new THREE.BufferAttribute(M.nor, 3);
  const col = new Float32Array(n * 3);
  baseColors = new Float32Array(n * 3);
  territory = new Array(n);
  const tmp = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const id = M.lab[i];
    tmp.set(M.cavFlag[i] ? LINING[id] : WALL[id]);
    const o = 0.7 + 0.3 * M.occl[i];
    tmp.multiplyScalar(o);
    baseColors.set([tmp.r, tmp.g, tmp.b], i * 3);
    territory[i] = HM.territoryAt(M.pos[i * 3], M.pos[i * 3 + 1], M.pos[i * 3 + 2], id);
  }
  col.set(baseColors);
  const colAttr = new THREE.BufferAttribute(col, 3);
  const geoAll = new THREE.BufferGeometry();
  geoAll.setAttribute('position', pos);
  setBeatAttrs(geoAll);
  for (const [id, idx] of Object.entries(M.groups)) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', pos);
    g.setAttribute('normal', nor);
    g.setAttribute('color', colAttr);
    for (const k of ['aW', 'aTa', 'aTv']) g.setAttribute(k, geoAll.attributes[k]);
    g.setIndex(idx);
    g.computeBoundingSphere();
    const el = els[id];
    const m = addMesh(el, g, heartMat(WALL[id], { vertexColors: true, cap: id === 'aorte' ? '#D9525C' : '#CF5865' }),
      { outline: outlineMat(darker(WALL[id], 0.42), 0.014) });
    m.userData.walls = true;
  }
  wallGeo = { colAttr, n, cav: M.cavFlag, lab: M.lab };
  console.info('[coeur] maillage', n, 'sommets en', M.ms.toFixed(0), 'ms');
}

/* --- Tubes (vaisseaux, coronaires) --- */
function tubeGeo(pts, r, { seg = 120, rad = 20, tension = 0.5 } = {}) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => (p.isVector3 ? p : VA(p))), false, 'catmullrom', tension);
  const g = new THREE.TubeGeometry(curve, seg, r, rad, false);
  g.userData.curve = curve;
  return g;
}
function vesselTube(el, pts, r, color, opts = {}) {
  const g = tubeGeo(pts, r, opts);
  setBeatAttrs(g);
  const m = addMesh(el, g, heartMat(color, { cap: opts.cap || darker(color, 0.78).getStyle(), planes: CLIP_V }), { outline: outlineMat(darker(color, 0.45), opts.thick || 0.014, { planes: CLIP_V }) });
  m.userData.vessel = true;
  return m;
}

const VES = {};
function buildVessels() {
  const aoPts = [HM.AO_B.map((v, i) => v - [-0.23, 0.96, 0.15][i] * 0.1), [-0.15, 1.12, 0.06], [-0.13, 1.48, 0.0], [0.04, 1.73, -0.2], [0.3, 1.72, -0.5], [0.46, 1.46, -0.82], [0.52, 0.98, -1.04], [0.53, 0.5, -1.12]];
  const ao = vesselTube(els.aorte, aoPts, 0.2, RED, { seg: 160 });
  VES.aorta = ao.geometry.userData.curve;
  const ac = VES.aorta;
  let uTop = 0, yTop = -9;
  for (let i = 0; i <= 200; i++) { const y = ac.getPointAt(i / 200).y; if (y > yTop) { yTop = y; uTop = i / 200; } }
  // branches de la crosse : tronc brachiocéphalique, carotide commune gauche, subclavière gauche
  const br = [[uTop - 0.045, [-0.14, 2.02, -0.1], [-0.24, 2.3, -0.08], 0.095], [uTop + 0.01, [0.14, 2.05, -0.34], [0.15, 2.32, -0.36], 0.072], [uTop + 0.06, [0.42, 1.98, -0.58], [0.52, 2.26, -0.62], 0.078]];
  VES.branches = br.map(([u, mid, end, r]) => {
    const s = ac.getPointAt(u);
    vesselTube(els.aorte, [s, VA(mid), VA(end)], r, RED, { seg: 30, rad: 14, thick: 0.012 });
    return [s, VA(mid), VA(end)];
  });
  // tronc pulmonaire et artères pulmonaires
  const BIF = [0.28, 1.2, -0.02];
  const trunk = [HM.PV_B.map((v, i) => v - [0.33, 0.93, -0.14][i] * 0.1), [0.25, 0.98, 0.2], BIF];
  vesselTube(els.ap, trunk, 0.19, BLUE, { seg: 40 });
  VES.lpa = [BIF, [0.62, 1.28, -0.2], [1.05, 1.26, -0.34]];
  VES.rpa = [BIF, [0.0, 1.25, -0.28], [-0.5, 1.21, -0.4], [-1.05, 1.17, -0.42]];
  vesselTube(els.ap, VES.lpa, 0.14, BLUE, { seg: 40 });
  vesselTube(els.ap, VES.rpa, 0.14, BLUE, { seg: 50 });
  const bif = addMesh(els.ap, new THREE.SphereGeometry(0.18, 24, 16), heartMat(BLUE, { beat: false, cap: darker(BLUE, 0.78).getStyle(), planes: CLIP_V }), { outline: outlineMat(darker(BLUE, 0.45), 0.014, { beat: false, planes: CLIP_V }) });
  bif.userData.vessel = true;
  bif.position.set(...BIF);
  // veines caves
  VES.svc = [[-0.8, 2.0, -0.02], [-0.81, 1.3, -0.03], [-0.82, 0.76, -0.04]];
  VES.ivc = [[-0.8, -1.02, -0.3], [-0.82, -0.7, -0.22], [-0.86, -0.38, -0.12]];
  vesselTube(els.vcs, VES.svc, 0.165, BLUE, { seg: 40 });
  vesselTube(els.vci, VES.ivc, 0.18, BLUE, { seg: 40 });
  // veines pulmonaires (2 droites, 2 gauches)
  VES.pv = [
    [[-0.16, 0.58, -0.8], [-0.55, 0.66, -0.9], [-0.98, 0.7, -0.92]],
    [[-0.14, 0.32, -0.8], [-0.55, 0.26, -0.9], [-0.95, 0.22, -0.94]],
    [[0.56, 0.58, -0.8], [0.95, 0.68, -0.88], [1.3, 0.72, -0.9]],
    [[0.58, 0.32, -0.8], [0.95, 0.26, -0.9], [1.28, 0.22, -0.94]]
  ];
  for (const p of VES.pv) vesselTube(els.vp, p, 0.095, PV_RED, { seg: 40, rad: 14, thick: 0.012 });
}

/* --- Coronaires --- */
const COR_MESH = {};
let corPaths = null;
function buildCoronaries() {
  corPaths = HM.coronaryPaths();
  const R = { cd: 0.028, tronc: 0.032, iva: 0.027, cx: 0.025 };
  for (const [id, pts] of Object.entries(corPaths)) {
    const el = els[id] || null;
    const g = tubeGeo(pts.map(VA), R[id], { seg: Math.max(40, pts.length * 3), rad: 10 });
    setBeatAttrs(g);
    const m = addMesh(el, g, heartMat(COR, { cap: '#A51D2B' }), { outline: outlineMat('#7A1420', 0.01), pick: false });
    m.userData.cor = id;
    COR_MESH[id] = m;
    if (el) {
      // tube invisible plus épais pour faciliter le clic
      const pg = tubeGeo(pts.map(VA), 0.085, { seg: 60, rad: 8 });
      const pm = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ visible: false }));
      pm.userData.el = el; pm.userData.clip = true; pm.userData.proxy = m;
      heart.add(pm); pickables.push(pm);
    }
  }
  // le tronc commun s'allume avec l'IVA et la circonflexe
  els.iva.meshes.push(COR_MESH.tronc); els.cx.meshes.push(COR_MESH.tronc);
}

/* --- Valves --- */
const VALVE_C = '#F7DFA6';
const valves = {};
function buildValve(id) {
  const spec = HM.VALVES[id];
  const el = els[id];
  const N = VA(spec.n).normalize(), Cc = VA(spec.c), r = spec.r;
  const e1 = new THREE.Vector3().crossVectors(N, Math.abs(N.y) < 0.9 ? V(0, 1, 0) : V(1, 0, 0)).normalize();
  const e2 = new THREE.Vector3().crossVectors(N, e1).normalize();
  const semi = id === 'pulmonaire' || id === 'aortique';
  const nLeaf = id === 'mitrale' ? 2 : 3;
  const S = 16, T = 9;
  const grp = new THREE.Group();
  heart.add(grp);
  const mat = heartMat(VALVE_C, { clip: false, beat: false, cap: '#E8BE62' });
  const leaves = [];
  for (let L = 0; L < nLeaf; L++) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((S + 1) * (T + 1) * 3), 3));
    const idx = [];
    for (let t = 0; t < T; t++) for (let s = 0; s < S; s++) {
      const a = t * (S + 1) + s, b = a + 1, c = a + S + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    g.setIndex(idx);
    const m = addMesh(el, g, mat, { parent: grp, clip: false });
    m.userData.valve = true;
    leaves.push({ g, a0: (L / nLeaf) * Math.PI * 2 + 0.4, a1: ((L + 1) / nLeaf) * Math.PI * 2 + 0.4 });
  }
  // anneau
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.02, r * 0.11, 10, 48), heartMat('#E9B95A', { clip: false, beat: false }));
  ring.material.emissive = C('#FFE2A0');
  ring.userData.el = el; ring.userData.clip = false;
  ring.lookAt(N); ring.position.copy(Cc);
  const ringO = new THREE.Mesh(ring.geometry, outlineMat('#9A6B1F', 0.012, { clip: false, beat: false }));
  ring.add(ringO);
  grp.add(ring); el.meshes.push(ring); pickables.push(ring);
  ring.position.set(0, 0, 0);
  grp.position.copy(Cc);
  const P = new THREE.Vector3(), Q = new THREE.Vector3(), dir = new THREE.Vector3();
  let chords = null;
  if (!semi) {
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nLeaf * 3 * 6), 3));
    chords = new THREE.LineSegments(cg, new THREE.LineBasicMaterial({ color: '#D9C089' }));
    chords.frustumCulled = false;
    grp.add(chords);
    // piliers
    const pm = heartMat('#E07B80', { clip: false, beat: false });
    for (let L = 0; L < nLeaf; L++) {
      const am = ((L + 0.5) / nLeaf) * Math.PI * 2 + 0.4;
      const pp = new THREE.Mesh(new THREE.SphereGeometry(r * 0.16, 14, 10), pm);
      pp.scale.set(1, 1, 1.8);
      pp.position.copy(e1).multiplyScalar(Math.cos(am) * r * 0.55).addScaledVector(e2, Math.sin(am) * r * 0.55).addScaledVector(N, r * 2.62);
      pp.lookAt(pp.position.clone().add(N));
      grp.add(pp);
    }
  }
  const v = { open: -1, grp, update(open) {
    open = clamp(open, 0, 1);
    if (Math.abs(open - v.open) < 0.002) return;
    v.open = open;
    const k = easeInOut(open);
    for (const lf of leaves) {
      const arr = lf.g.attributes.position.array;
      let i = 0;
      for (let t = 0; t <= T; t++) for (let s = 0; s <= S; s++) {
        const u = s / S, w = t / T;
        const ang = lf.a0 + (lf.a1 - lf.a0) * (0.035 + 0.93 * u);
        dir.copy(e1).multiplyScalar(Math.cos(ang)).addScaledVector(e2, Math.sin(ang));
        const bell = Math.sin(Math.PI * u);
        if (semi) {
          // fermée : poches qui se rejoignent au centre ; ouverte : plaquées contre la paroi
          P.copy(dir).multiplyScalar(r * (1 - w)).addScaledVector(N, -r * 0.5 * bell * Math.sin(Math.PI * Math.min(1, w * 1.05)) + r * 0.1 * w);
          const am = (lf.a0 + lf.a1) / 2, an = am + (ang - am) * (1 - 0.4 * w);
          Q.copy(e1).multiplyScalar(Math.cos(an)).addScaledVector(e2, Math.sin(an)).multiplyScalar(r * (1 - 0.1 * w * bell)).addScaledVector(N, r * 0.62 * w);
        } else {
          // fermée : voile légèrement bombé vers l'oreillette ; ouverte : feuillets qui pendent dans le ventricule
          P.copy(dir).multiplyScalar(r * (1 - w) * (1 - 0.06 * (1 - bell))).addScaledVector(N, -r * 0.22 * Math.sin(Math.PI * w) * (0.5 + 0.5 * bell) + r * 0.05 * w);
          const am = (lf.a0 + lf.a1) / 2, an = am + (ang - am) * (1 - 0.45 * w);
          Q.copy(e1).multiplyScalar(Math.cos(an)).addScaledVector(e2, Math.sin(an)).multiplyScalar(r * (1 - 0.3 * w * w - 0.1 * w * bell)).addScaledVector(N, r * (1.25 + 0.15 * bell) * w);
        }
        P.lerp(Q, k);
        arr[i++] = P.x; arr[i++] = P.y; arr[i++] = P.z;
      }
      lf.g.attributes.position.needsUpdate = true;
      lf.g.computeVertexNormals();
      lf.g.computeBoundingSphere();
    }
    if (chords) {
      // cordages : du bord libre des feuillets aux piliers (muscles papillaires)
      const ca = chords.geometry.attributes.position.array;
      let j = 0;
      leaves.forEach((lf, L) => {
        const arr = lf.g.attributes.position.array;
        const am = (lf.a0 + lf.a1) / 2;
        const pap = dir.copy(e1).multiplyScalar(Math.cos(am) * r * 0.55).addScaledVector(e2, Math.sin(am) * r * 0.55).addScaledVector(N, r * 2.5);
        for (const s of [3, 8, 13]) {
          const vi = (T * (S + 1) + s) * 3;
          ca[j++] = arr[vi]; ca[j++] = arr[vi + 1]; ca[j++] = arr[vi + 2];
          ca[j++] = pap.x; ca[j++] = pap.y; ca[j++] = pap.z;
        }
      });
      chords.geometry.attributes.position.needsUpdate = true;
    }
  } };
  v.base = Cc.clone();
  valves[id] = v;
  v.update(semi ? 0 : 1);
  el.anchor.copy(Cc);
}

/* --- Poumons schématiques (mode circulation) --- */
const lungs = new THREE.Group();
lungs.visible = false;
heart.add(lungs);
const LUNG = { r: V(-2.28, 1.0, -0.75), l: V(2.32, 1.0, -0.75) };
function buildLungs() {
  const col = '#F7B9B1';
  for (const side of ['r', 'l']) {
    const sgn = side === 'r' ? -1 : 1;
    const g = new THREE.SphereGeometry(1, 64, 48);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const k = 1 - 0.45 * Math.pow(clamp((y + 0.2) / 1.2, 0, 1), 1.5);
      x *= k; z *= k;
      if (x * -sgn > 0) x *= 0.55;            // face médiale aplatie
      if (y < -0.5) y = -0.5 + (y + 0.5) * 0.6; // base plate (diaphragme)
      p.setXYZ(i, x * 0.78, y * 1.3, z * 0.62);
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, heartMat(col, { clip: false, beat: false }));
    const o = new THREE.Mesh(g, outlineMat(darker(col, 0.55), 0.018, { clip: false, beat: false }));
    m.add(o);
    m.position.copy(LUNG[side]);
    lungs.add(m);
  }
  // prolongements des vaisseaux vers les poumons
  const ext = (pts, r, color) => {
    const g = tubeGeo(pts, r, { seg: 40, rad: 12 });
    const m = new THREE.Mesh(g, heartMat(color, { clip: false, beat: false }));
    m.add(new THREE.Mesh(g, outlineMat(darker(color, 0.45), 0.012, { clip: false, beat: false })));
    lungs.add(m);
    return g.userData.curve;
  };
  const end = (arr) => VA(arr[arr.length - 1]);
  const lp = end(VES.lpa), rp = end(VES.rpa);
  VES.lpaExt = ext([lp.clone().add(V(-0.05, 0, 0)), V(1.5, 1.26, -0.5), V(2.0, 1.2, -0.62)], 0.11, BLUE);
  VES.rpaExt = ext([rp.clone().add(V(0.05, 0, 0)), V(-1.5, 1.2, -0.55), V(-1.95, 1.16, -0.65)], 0.11, BLUE);
  VES.pvExt = VES.pv.map((pv) => {
    const e = end(pv), s = Math.sign(e.x);
    return ext([e.clone().add(V(-s * 0.04, 0, 0)), V(s * 1.6, e.y + 0.12, -0.86), V(s * 2.02, e.y * 0.6 + 0.4, -0.76)], 0.075, PV_RED);
  });
}

/* --- Ancres des étiquettes --- */
function setAnchors() {
  const sp = (c, d) => { const p = HM.surfacePoint(c, new THREE.Vector3(...d).normalize().toArray()); return VA(p); };
  els.vd.anchor = sp(HM.CENTERS.vd, [-0.1, -0.2, 1]); els.vd.anchorN = V(0, 0, 1);
  els.vg.anchor = sp(HM.CENTERS.vg, [1, -0.3, 0.3]); els.vg.anchorN = V(1, 0, 0.3).normalize();
  els.od.anchor = sp(HM.CENTERS.od, [-1, 0.1, 0.3]); els.od.anchorN = V(-1, 0, 0.3).normalize();
  els.og.anchor = sp([0.62, 0.62, -0.3], [0.4, 0.2, 1]); els.og.anchorN = V(0.6, 0, 0.6).normalize();
  els.aorte.anchor = VES.aorta.getPointAt(0.22).add(V(0, 0, 0.18));
  els.ap.anchor = V(0.3, 1.1, 0.46);
  els.vcs.anchor = V(-0.74, 1.9, 0.12);
  els.vci.anchor = V(-0.68, -0.9, -0.22);
  els.vp.anchor = V(1.2, 0.76, -0.92); els.vp.anchorN = V(0.4, 0, -1).normalize();
  const mid = (id, u) => VA(corPaths[id][Math.floor(corPaths[id].length * u)]);
  els.cd.anchor = mid('cd', 0.35); els.iva.anchor = mid('iva', 0.5); els.cx.anchor = mid('cx', 0.45);
  els.cd.anchorN = V(-0.6, 0, 0.8).normalize(); els.iva.anchorN = V(0, 0, 1); els.cx.anchorN = V(0.7, 0, -0.2).normalize();
}

/* ================================================================
   Particules (circulation)
   ================================================================ */
const PART_GEO = new THREE.SphereGeometry(1, 12, 9);
class Flow {
  constructor(curve, { count, size = 0.062, colorAt, speed = 0.55 }) {
    this.curve = curve.isCurve ? curve : new THREE.CatmullRomCurve3(curve.map((p) => (p.isVector3 ? p : VA(p))), false, 'catmullrom', 0.5);
    const L = this.curve.getLength();
    this.count = count || Math.max(6, Math.round(L * 9));
    this.size = size; this.colorAt = colorAt; this.speed = speed / L;
    this.mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, depthWrite: true });
    this.mesh = new THREE.InstancedMesh(PART_GEO, this.mat, this.count);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 4;
    this.phase = 0; this.scale = 1;
    this.P = new THREE.Vector3(); this.M = new THREE.Matrix4(); this.c = new THREE.Color();
    this.seeds = Array.from({ length: this.count }, (_, i) => [Math.sin(i * 12.99) * 0.5, Math.cos(i * 7.31) * 0.5]);
    heart.add(this.mesh);
    this.update(0);
  }
  update(dt) {
    this.phase = (this.phase + dt * this.speed) % 1;
    for (let i = 0; i < this.count; i++) {
      const u = (i / this.count + this.phase) % 1;
      this.curve.getPointAt(u, this.P);
      const sd = this.seeds[i];
      this.P.x += sd[0] * 0.05; this.P.z += sd[1] * 0.05;
      const edge = Math.min(1, u / 0.05, (1 - u) / 0.05);
      const s = this.size * this.scale * edge;
      this.M.makeScale(s, s, s).setPosition(this.P);
      this.mesh.setMatrixAt(i, this.M);
      this.mesh.setColorAt(i, this.c.set(this.colorAt(u)));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor.needsUpdate = true;
  }
}
const flows = [];   // { step, flow }
const BL = '#4F72C9', RD = '#E63946';
const mixCol = (a, b, k) => '#' + C(a).lerp(C(b), clamp(k, 0, 1)).getHexString();
function buildFlows() {
  const c = HM.CENTERS;
  const blue = () => BL, red = () => RD;
  const T = HM.VALVES.tricuspide, Pv = HM.VALVES.pulmonaire, Mi = HM.VALVES.mitrale, Ao = HM.VALVES.aortique;
  const add = (step, pts, colorAt, o = {}) => flows.push({ step, f: new Flow(pts, { colorAt, ...o }) });
  // 1. veines caves → OD
  add(0, [VA(VES.svc[0]), VA(VES.svc[1]), VA(VES.svc[2]), VA(c.od).add(V(0, 0.08, 0))], blue);
  add(0, [VA(VES.ivc[0]), VA(VES.ivc[1]), VA(VES.ivc[2]), VA(c.od).add(V(0, -0.06, 0))], blue);
  // 2. OD → valve tricuspide → VD
  add(1, [VA(c.od), VA(T.c).addScaledVector(VA(T.n), -0.15), VA(T.c), VA(T.c).addScaledVector(VA(T.n), 0.3), VA(c.vd).add(V(0.1, -0.1, 0))], blue);
  // 3. VD → valve pulmonaire → tronc → artères pulmonaires → poumons
  const rvOut = [VA(c.vd).add(V(0.1, -0.1, 0)), V(0.0, 0.2, 0.45), VA(Pv.c), V(0.27, 1.12, 0.28), V(0.29, 1.36, 0.02)];
  add(2, [...rvOut, ...VES.lpa.slice(1).map(VA), ...VES.lpaExt.points.slice(1)], blue);
  add(2, [...rvOut, ...VES.rpa.slice(1).map(VA), ...VES.rpaExt.points.slice(1)], blue);
  // 4. poumons : boucle dans chaque poumon, du bleu au rouge
  for (const side of ['r', 'l']) {
    const s = side === 'r' ? -1 : 1, L = LUNG[side];
    const pts = [V(L.x - s * 0.55, 1.22, L.z + 0.1), V(L.x - s * 0.1, 1.9, L.z + 0.15), V(L.x + s * 0.32, 1.2, L.z + 0.2), V(L.x + s * 0.2, 0.3, L.z + 0.15), V(L.x - s * 0.2, 0.05, L.z + 0.1), V(L.x - s * 0.55, 0.75, L.z + 0.1)];
    add(3, pts, (u) => (u < 0.3 ? BL : u > 0.7 ? RD : mixCol(BL, RD, (u - 0.3) / 0.4)));
  }
  // 5. veines pulmonaires → OG
  VES.pvExt.forEach((ext, i) => {
    const pv = VES.pv[i];
    add(4, [...[...ext.points].reverse(), VA(pv[1]), VA(pv[0]), VA(c.og)], red);
  });
  // 6. OG → valve mitrale → VG
  add(5, [VA(c.og), VA(Mi.c).addScaledVector(VA(Mi.n), -0.12), VA(Mi.c), VA(Mi.c).addScaledVector(VA(Mi.n), 0.35), VA(c.vg).add(V(0.1, -0.2, 0.05))], red);
  // 7. VG → valve aortique → aorte (crosse, branches, aorte descendante)
  const lvOut = [VA(c.vg).add(V(0.1, -0.2, 0.05)), V(0.25, 0.1, -0.05), VA(HM.AO_A), VA(Ao.c)];
  const aoPts = Array.from({ length: 30 }, (_, i) => VES.aorta.getPointAt(i / 29));
  add(6, [...lvOut, ...aoPts.slice(1)], red, { speed: 0.7 });
  for (const b of VES.branches) {
    const u = 0.25;
    add(6, [...lvOut, ...Array.from({ length: 8 }, (_, i) => VES.aorta.getPointAt(0.03 + i * (u - 0.03) / 7)), b[0].clone().add(V(0, 0.12, 0)), b[1], b[2]], red, { speed: 0.7 });
  }
  for (const f of flows) f.f.mesh.visible = false;
}

/* ================================================================
   Caméra et contrôles
   ================================================================ */
const controls = new OrbitControls(camera, canvas);
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.rotateSpeed = 0.75;
controls.autoRotateSpeed = 2.2;
controls.minPolarAngle = 0.12; controls.maxPolarAngle = Math.PI - 0.12;
const cam = { ox: 0, oy: 0 };
const HOME = { target: V(0.02, 0.55, -0.15), dist: 11.2, dir: V(-0.22, 0.14, 1) };
const VIEWS = {
  explorer: HOME,
  beat: { target: V(0.0, 0.42, -0.1), dist: 10.6, dir: V(-0.18, 0.18, 1) },
  circ: { target: V(0.02, 0.55, -0.4), dist: 14.2, dir: V(-0.08, 0.16, 1) },
  irrig: { target: V(0.05, 0.25, -0.1), dist: 11.2, dir: V(-0.15, 0.12, 1) }
};
let flySeq = 0;
function flyTo(target, dist, dir, dur = 1.2) {
  const seq = ++flySeq;
  const p0 = camera.position.clone(), t0 = controls.target.clone();
  const t1 = target.clone(), p1 = target.clone().add(dir.clone().normalize().multiplyScalar(dist));
  controls.enabled = false;
  return tween(dur, (k) => {
    if (seq !== flySeq) return;
    controls.target.lerpVectors(t0, t1, k);
    const a = p0.clone().sub(t0), b = p1.clone().sub(t1);
    const len = lerp(a.length(), b.length(), k);
    const d = a.normalize().lerp(b.normalize(), k);
    if (d.lengthSq() < 1e-6) d.copy(b.normalize());
    camera.position.copy(controls.target).add(d.normalize().multiplyScalar(len));
    camera.lookAt(controls.target);
  }, easeInOut, 'cam').then(() => {
    if (seq !== flySeq) return;
    controls.enabled = true;
    controls.minDistance = dist * 0.5; controls.maxDistance = dist * 1.7;
    controls.update();
  });
}
function setView(v, dur) { return flyTo(v.target, v.dist, v.dir, dur); }

/* --- Interpolations --- */
const tweens = new Map();
let tweenId = 0;
function tween(dur, fn, ease = easeInOut, keyName) {
  return new Promise((res) => {
    if (keyName && tweens.has(keyName)) { const old = tweens.get(keyName); tweens.delete(keyName); old.res(); }
    if (INSTANT || dur <= 0) { fn(1); res(); return; }
    tweens.set(keyName || 'tw' + (++tweenId), { t: 0, dur, fn, ease, res });
  });
}
function updateTweens(dt) {
  for (const [k, tw] of [...tweens]) {
    tw.t += dt;
    const p = Math.min(1, tw.t / tw.dur);
    tw.fn(tw.ease(p));
    if (p >= 1) { tweens.delete(k); tw.res(); }
  }
}

/* ================================================================
   Vue en coupe
   ================================================================ */
let CUT = null;          // { n (vers l'arrière), c }
const state = {
  mode: 'explorer', sel: null, hover: null, labels: false, cut: false, cutK: 0,
  beat: { playing: false, f: 0.78, bpm: 70 },
  circ: { step: -1, playing: false, moving: false, t: 0 },
  irrig: { art: null, occ: false }
};
function setCut(on, dur = 0.9) {
  if (state.cut === on && !INSTANT) return;
  state.cut = on;
  $('#btnCut').setAttribute('aria-pressed', on);
  const k0 = state.cutK, k1 = on ? 1 : 0;
  tween(dur, (k) => { state.cutK = lerp(k0, k1, k); applyCut(); }, easeInOut, 'cut');
}
function applyCut() {
  // le plan balaie le cœur d'avant en arrière
  const k = state.cutK;
  const n = CUT.n;
  cutPlane.normal.copy(n);
  if (k <= 0.001) cutPlane.constant = 100;
  else cutPlane.constant = lerp(-n.dot(CUT.c) - 1.6, -n.dot(CUT.c), k);  // le plan part de devant le cœur
  vesselPlane.normal.copy(n);
  vesselPlane.constant = state.mode === 'circ' ? 100 : cutPlane.constant;
}
// en mode circulation : vaisseaux entiers mais translucides (on voit le sang dedans)
function setVesselGhost(on) {
  for (const id of ['aorte', 'ap', 'vcs', 'vci', 'vp']) for (const m of els[id].meshes) {
    if (!m.userData.vessel) continue;
    for (const mat of [m.material, m.children[0] && m.children[0].material]) {
      if (!mat) continue;
      if (mat.transparent !== on) { mat.transparent = on; mat.needsUpdate = true; }
      mat.opacity = on ? (mat.side === THREE.BackSide ? 0.25 : 0.38) : 1;
      mat.depthWrite = !on;
    }
  }
  // parois translucides : on suit le sang à l'intérieur des cavités
  for (const id of ['od', 'vd', 'og', 'vg', 'aorte']) for (const m of els[id].meshes) {
    if (!m.userData.walls) continue;
    const mat = m.material, om = m.children[0].material;
    for (const x of [mat, om]) { if (x.transparent !== on) { x.transparent = on; x.needsUpdate = true; } x.depthWrite = !on; }
    mat.opacity = on ? 0.3 : 1; om.opacity = on ? 0.3 : 1;
  }
  for (const m of Object.values(COR_MESH)) m.visible = !on;
  for (const m of lungs.children) if (m.isMesh && m.geometry.type === 'TubeGeometry') {
    for (const mat of [m.material, m.children[0].material]) { if (mat.transparent !== on) { mat.transparent = on; mat.needsUpdate = true; } mat.opacity = on ? 0.4 : 1; mat.depthWrite = !on; }
  }
}

/* ================================================================
   Interface
   ================================================================ */
const card = $('#card'), tooltip = $('#tooltip');
const groupsEl = $('#eGroups');
groupsEl.innerHTML = GROUPS.map((g) => `<div><p class="grp-k">${g.name}</p><div class="chips">${ORDER.filter((id) => ELEMENTS[id].group === g.id)
  .map((id) => `<button class="chip" data-id="${id}"><i style="background:${ELEMENTS[id].group === 'coronaires' ? ELEMENTS[id].color : ELEMENTS[id].color}"></i>${ELEMENTS[id].short}</button>`).join('')}</div></div>`).join('');
groupsEl.addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (b) select(b.dataset.id === state.sel ? null : b.dataset.id); });
groupsEl.addEventListener('pointerover', (e) => { const b = e.target.closest('.chip'); if (b) setHover(b.dataset.id, false); });
groupsEl.addEventListener('pointerout', () => setHover(null));

/* --- Modes --- */
const modeBtns = [...document.querySelectorAll('.mode')];
modeBtns.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
const panes = Object.fromEntries([...document.querySelectorAll('.pane')].map((p) => [p.dataset.pane, p]));
function setMode(m, { keepView = false } = {}) {
  const prev = state.mode;
  state.mode = m;
  stage.dataset.mode = m;
  modeBtns.forEach((b) => b.classList.toggle('on', b.dataset.mode === m));
  for (const [k, p] of Object.entries(panes)) p.classList.toggle('on', k === m);
  // sortie des modes
  stopBeat(); stopCirc(); controls.autoRotate = false; setSpinUI(false);
  if (prev === 'irrig' || m !== 'irrig') resetIrrig();
  setHover(null);
  select(null, { noFly: true });
  lungs.visible = m === 'circ';
  setVesselGhost(m === 'circ');
  applyCut();
  for (const f of flows) f.f.mesh.visible = m === 'circ';
  setLabels(m === 'explorer' ? state.labels : false, true);
  $('#btnLabels').disabled = m !== 'explorer';
  if (m === 'beat') { setCut(true); enterBeat(); }
  else if (m === 'circ') { setCut(false); enterCirc(); }
  else if (m === 'irrig') { setCut(false); enterIrrig(); }
  else { setCut(false); setValvesRest(); }
  if (!keepView) setView(VIEWS[m]);
}

/* --- Explorer : sélection --- */
function select(id, { noFly = false } = {}) {
  state.sel = id;
  for (const e of Object.values(els)) e.glowTarget = e.id === id ? 1 : 0;
  for (const b of groupsEl.querySelectorAll('.chip')) b.classList.toggle('on', b.dataset.id === id);
  if (state.mode !== 'explorer') return;
  const d = id ? ELEMENTS[id] : null;
  $('#eKicker').textContent = d ? GROUPS.find((g) => g.id === d.group).kicker : 'Explorer';
  $('#eName').textContent = d ? d.name : 'Le cœur';
  $('#eDot').style.background = d ? (d.group === 'valves' ? '#E9B95A' : d.color) : 'var(--red)';
  $('#eText').textContent = d ? d.text : "Un muscle creux, gros comme un poing, qui fonctionne comme une double pompe : le cœur droit envoie le sang aux poumons, le cœur gauche l'envoie dans tout le corps. Survolez un élément pour lire son nom, cliquez pour sa fiche.";
  $('#eHint').textContent = d && d.inner ? 'Vue en coupe activée pour voir la valve.' : '';
  if (d && d.inner) setCut(true);
  if (!noFly && d) focusOn(id);
}
const FOCUS = {
  vci: V(-0.5, -0.45, 0.75), vp: V(0.35, 0.1, -1), og: V(0.35, 0.15, -1), cx: V(0.9, 0.1, -0.45), cd: V(-0.8, -0.35, 0.55)
};
function focusOn(id) {
  const dir = FOCUS[id];
  if (dir) { flyTo(V(0.05, 0.4, -0.2), 10.2, dir); return; }
  if (ELEMENTS[id].inner) { flyTo(V(0.0, 0.4, -0.1), 9.8, CUT.n.clone().negate().add(V(-0.15, 0, 0))); return; }
  // sinon : reste dans la vue actuelle si l'élément est visible de face
  const camDir = camera.position.clone().sub(controls.target).normalize();
  const n = els[id].anchorN || V(0, 0, 1);
  if (n.dot(camDir) < 0.1) setView(HOME);
}

/* --- Étiquettes --- */
const labelsEl = $('#labels'), leaders = $('#leaders');
const labelNodes = {};
for (const id of ORDER) {
  const d = ELEMENTS[id];
  const el = document.createElement('div');
  el.className = 'olabel';
  el.innerHTML = `<span class="sw" style="background:${d.group === 'valves' ? '#E9B95A' : d.color}"></span>${d.short}`;
  el.style.display = 'none';
  labelsEl.appendChild(el);
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); dot.setAttribute('r', 5);
  leaders.append(line, dot);
  labelNodes[id] = { el, line, dot };
}
function setLabels(on, silent) {
  if (!silent) state.labels = on;
  $('#btnLabels').setAttribute('aria-pressed', on);
  labelsEl.dataset.on = on ? '1' : '';
}
$('#btnLabels').addEventListener('click', () => setLabels(!state.labels));
const tmpV = new THREE.Vector3();
function toScreen(p) {
  tmpV.copy(p).applyMatrix4(heart.matrixWorld).project(camera);
  return { x: (tmpV.x + 1) / 2 * W, y: (1 - tmpV.y) / 2 * H, z: tmpV.z };
}
function updateLabels() {
  const show = labelsEl.dataset.on === '1' && state.mode === 'explorer';
  if (!show && !(state.mode === 'explorer' && state.sel)) { for (const id of ORDER) { const n = labelNodes[id]; n.el.style.display = 'none'; n.line.style.display = 'none'; n.dot.style.display = 'none'; } return; }
  const items = [];
  const camDir = camera.position.clone().sub(controls.target).normalize();
  for (const id of ORDER) {
    const n = labelNodes[id];
    const e = els[id];
    let vis = show || (state.mode === 'explorer' && state.sel === id);
    if (vis && ELEMENTS[id].inner && state.cutK < 0.9) vis = false;
    if (vis && !ELEMENTS[id].inner && e.anchorN && e.anchorN.dot(camDir) < -0.25) vis = false;
    if (vis && !ELEMENTS[id].inner && state.cutK > 0.5 && cutPlane.distanceToPoint(e.anchor) < 0) vis = false;
    if (!vis) { n.el.style.display = 'none'; n.line.style.display = 'none'; n.dot.style.display = 'none'; continue; }
    items.push({ id, s: toScreen(e.anchor) });
  }
  if (!items.length) return;
  const c = toScreen(V(0.1, 0.2, -0.1));
  const half = Math.abs(toScreen(controls.target.clone().add(V(1.55, 0, 0))).x - toScreen(controls.target).x);
  for (const it of items) it.left = it.s.x < c.x;
  for (const side of [true, false]) {
    const col = items.filter((i) => i.left === side).sort((a, b) => a.s.y - b.s.y);
    let lastY = -1e9;
    for (const it of col) { it.y = Math.max(it.s.y, lastY + 48, 250); lastY = it.y; }
    const over = lastY - (H - 130);
    if (over > 0) { for (const it of col) it.y -= over; }
    for (const it of col) {
      const n = labelNodes[it.id];
      const lx = side ? Math.max(260, c.x - half - 30) : Math.min(c.x + half + 30, 1170 - 290);
      n.el.className = 'olabel' + (side ? ' left' : '') + (state.sel === it.id ? ' sel' : '');
      n.el.style.display = ''; n.el.style.left = lx + 'px'; n.el.style.top = it.y + 'px';
      n.line.style.display = ''; n.dot.style.display = '';
      n.line.setAttribute('x1', it.s.x); n.line.setAttribute('y1', it.s.y);
      n.line.setAttribute('x2', lx); n.line.setAttribute('y2', it.y);
      n.dot.setAttribute('cx', it.s.x); n.dot.setAttribute('cy', it.s.y);
    }
  }
}

/* --- Survol et clic --- */
const raycaster = new THREE.Raycaster();
const mouse = { sx: 0, sy: 0, inside: false, moved: false };
function stageCoords(e) {
  const r = stage.getBoundingClientRect();
  return { x: (e.clientX - r.left) / stageScale, y: (e.clientY - r.top) / stageScale };
}
function pickHit() {
  raycaster.setFromCamera({ x: mouse.sx / W * 2 - 1, y: -(mouse.sy / H * 2 - 1) }, camera);
  const hits = raycaster.intersectObjects(pickables, false);
  for (const h of hits) {
    const m = h.object;
    if (!m.userData.el) continue;
    if (m.userData.proxy ? !m.userData.proxy.visible : !m.visible) continue;
    let o = m; let vis = true;
    while (o) { if (!o.visible) { vis = false; break; } o = o.parent; }
    if (!vis) continue;
    if (m.userData.clip && state.cutK > 0.02 && cutPlane.distanceToPoint(h.point) < 0) continue;
    return h;
  }
  return null;
}
function setHover(id, fromScene = true) {
  if (state.hover === id) return;
  state.hover = id;
  canvas.classList.toggle('hovering', !!id);
  if (id) {
    const d = ELEMENTS[id];
    tooltip.innerHTML = `<span class="sw" style="background:${d.group === 'valves' ? '#E9B95A' : d.color}"></span>${d.name}`;
    tooltip.classList.add('on');
    tooltip.dataset.scene = fromScene ? '1' : '';
  } else tooltip.classList.remove('on');
}
function hoverIdFromHit(h) {
  if (!h) return null;
  const id = h.object.userData.el.id;
  if (state.mode === 'irrig') {
    if (ELEMENTS[id].group === 'coronaires') return id;
    if (h.object.userData.walls && h.face) { const t = territory[h.face.a]; return t || null; }
    return null;
  }
  return state.mode === 'explorer' ? id : null;
}
canvas.addEventListener('pointermove', (e) => { const p = stageCoords(e); mouse.sx = p.x; mouse.sy = p.y; mouse.inside = true; mouse.moved = true; });
canvas.addEventListener('pointerleave', () => { mouse.inside = false; setHover(null); });
let downAt = null;
canvas.addEventListener('pointerdown', (e) => { downAt = stageCoords(e); });
canvas.addEventListener('pointerup', (e) => {
  if (!downAt) return;
  const p = stageCoords(e);
  const moved = Math.hypot(p.x - downAt.x, p.y - downAt.y);
  downAt = null;
  if (moved > 8) return;
  mouse.sx = p.x; mouse.sy = p.y;
  const id = hoverIdFromHit(pickHit());
  if (state.mode === 'explorer') select(id);
  else if (state.mode === 'irrig' && id) selectArtery(id);
});

/* --- Barre d'outils --- */
$('#btnCut').addEventListener('click', () => {
  setCut(!state.cut);
  if (state.cut && state.mode === 'explorer') flyTo(V(0.0, 0.45, -0.1), 10.4, CUT.n.clone().negate().add(V(-0.15, 0, 0)));
});
function setSpinUI(on) { $('#btnSpin').classList.toggle('on', on); $('#btnSpin span').textContent = on ? 'Arrêter' : 'Faire tourner'; }
$('#btnSpin').addEventListener('click', () => { controls.autoRotate = !controls.autoRotate; setSpinUI(controls.autoRotate); });
$('#btnFront').addEventListener('click', () => { controls.autoRotate = false; setSpinUI(false); setView(VIEWS[state.mode], 0.9); });

/* ================================================================
   Valves : état de repos
   ================================================================ */
function setValves(av, sl) {
  valves.tricuspide.update(av); valves.mitrale.update(av);
  valves.pulmonaire.update(sl); valves.aortique.update(sl);
}
function setValvesRest() { BEAT.uAtr.value = 0; BEAT.uVen.value = 0; setValves(1, 0); placeValves(); }
function placeValves() { for (const v of Object.values(valves)) v.grp.position.copy(displaced(v.base)); }

/* ================================================================
   Mode Battements
   ================================================================ */
const phasesEl = $('#phases');
phasesEl.innerHTML = PHASES.map((p) => `<div class="phase" data-id="${p.id}">${p.short}</div>`).join('');
const VALVE_ROWS = [['tricuspide', 'Tricuspide', 'av'], ['pulmonaire', 'Pulmonaire', 'sl'], ['mitrale', 'Mitrale', 'av'], ['aortique', 'Aortique', 'sl']];
$('#valveState').innerHTML = VALVE_ROWS.map(([id, n]) => `<div class="vs-row" data-id="${id}"><span>${n}</span><b>Fermée</b></div>`).join('');
const bpmEl = $('#bpm');
function setBpm(v) {
  state.beat.bpm = +v;
  $('#bpmVal').textContent = v;
  $('#cycleDur').textContent = (60 / v).toFixed(2).replace('.', ',');
  bpmEl.value = v;
  bpmEl.style.setProperty('--p', ((v - 40) / 80 * 100) + '%');
}
bpmEl.addEventListener('input', () => setBpm(bpmEl.value));
setBpm(70);
// cycle (fractions) : P ≈ 0.05, QRS ≈ 0.15, T ≈ 0.38
const bump = (f, a, b) => (f <= a || f >= b ? 0 : Math.pow(Math.sin(Math.PI * (f - a) / (b - a)), 2));
function cycle(f) {
  const atr = bump(f, 0.02, 0.18);
  let ven = 0;
  if (f > 0.15 && f < 0.3) ven = smooth((f - 0.15) / 0.15);
  else if (f >= 0.3 && f < 0.42) ven = 1;
  else if (f >= 0.42 && f < 0.58) ven = 1 - smooth((f - 0.42) / 0.16);
  let av;
  if (f < 0.135) av = 1; else if (f < 0.165) av = 1 - (f - 0.135) / 0.03; else if (f < 0.56) av = 0; else if (f < 0.61) av = (f - 0.56) / 0.05; else av = 1;
  let sl;
  if (f < 0.19) sl = 0; else if (f < 0.23) sl = (f - 0.19) / 0.04; else if (f < 0.46) sl = 1; else if (f < 0.5) sl = 1 - (f - 0.46) / 0.04; else sl = 0;
  const phase = f < 0.15 ? 'as' : f < 0.5 ? 'vs' : 'd';
  return { atr, ven, av, sl, phase };
}
function ecgY(f) {
  const g = (c, w, a) => a * Math.exp(-((f - c) ** 2) / (2 * w * w));
  return g(0.055, 0.018, 0.13) + g(0.142, 0.006, -0.12) + g(0.155, 0.007, 1) + g(0.17, 0.007, -0.28) + g(0.38, 0.035, 0.26);
}
// tracé ECG
(function drawEcg() {
  const svg = $('#ecg');
  const X = (f) => 20 + f * 560, Y = (v) => 108 - v * 74;
  const bands = [['as', 0, 0.15], ['vs', 0.15, 0.5], ['d', 0.5, 1]];
  let h = bands.map(([id, a, b]) => `<rect class="band" data-id="${id}" x="${X(a)}" y="8" width="${X(b) - X(a)}" height="134" rx="8" fill="#13315C" opacity="0"/>`).join('');
  let d = '';
  for (let i = 0; i <= 400; i++) { const f = i / 400; d += (i ? 'L' : 'M') + X(f).toFixed(1) + ' ' + Y(ecgY(f)).toFixed(1); }
  h += `<path d="${d}" fill="none" stroke="#E63946" stroke-width="3.2" stroke-linejoin="round"/>`;
  h += `<text x="${X(0.055)}" y="140" text-anchor="middle" font-family="Montserrat" font-weight="700" font-size="18" fill="#5B6B80">P</text>`;
  h += `<text x="${X(0.157)}" y="140" text-anchor="middle" font-family="Montserrat" font-weight="700" font-size="18" fill="#5B6B80">QRS</text>`;
  h += `<text x="${X(0.38)}" y="140" text-anchor="middle" font-family="Montserrat" font-weight="700" font-size="18" fill="#5B6B80">T</text>`;
  h += `<line id="ecgCur" x1="0" x2="0" y1="10" y2="122" stroke="#13315C" stroke-width="3"/><circle id="ecgDot" r="7" fill="#13315C"/>`;
  svg.innerHTML = h;
  svg.X = X; svg.Y = Y;
})();
let lastPhase = null;
function applyBeat() {
  const c = cycle(state.beat.f);
  BEAT.uAtr.value = c.atr; BEAT.uVen.value = c.ven;
  setValves(c.av, c.sl);
  placeValves();
  if (state.mode !== 'beat') return;
  if (c.phase !== lastPhase) {
    lastPhase = c.phase;
    for (const p of phasesEl.children) p.classList.toggle('on', p.dataset.id === c.phase);
    $('#phaseText').textContent = PHASES.find((p) => p.id === c.phase).text;
    for (const b of document.querySelectorAll('#ecg .band')) b.setAttribute('opacity', b.dataset.id === c.phase ? 0.07 : 0);
  }
  for (const row of document.querySelectorAll('.vs-row')) {
    const k = row.dataset.id === 'tricuspide' || row.dataset.id === 'mitrale' ? c.av : c.sl;
    const open = k > 0.5;
    if (row.classList.contains('open') !== open) { row.classList.toggle('open', open); row.querySelector('b').textContent = open ? 'Ouverte' : 'Fermée'; }
  }
  const svg = $('#ecg');
  const x = svg.X(state.beat.f);
  $('#ecgCur').setAttribute('x1', x); $('#ecgCur').setAttribute('x2', x);
  $('#ecgDot').setAttribute('cx', x); $('#ecgDot').setAttribute('cy', svg.Y(ecgY(state.beat.f)));
}
function setBeatUI() {
  const b = $('#btnBeat');
  b.classList.toggle('playing', state.beat.playing);
  b.querySelector('span').textContent = state.beat.playing ? 'Pause' : 'Lancer';
}
$('#btnBeat').addEventListener('click', () => { state.beat.playing = !state.beat.playing; setBeatUI(); });
function enterBeat() { state.beat.f = 0.78; lastPhase = null; applyBeat(); setBeatUI(); }
function stopBeat() { state.beat.playing = false; setBeatUI(); BEAT.uAtr.value = 0; BEAT.uVen.value = 0; }
function stepBeat(dt) {
  if (state.mode !== 'beat' || !state.beat.playing) return;
  state.beat.f = (state.beat.f + dt * state.beat.bpm / 60) % 1;
  applyBeat();
}

/* ================================================================
   Mode Circulation
   ================================================================ */
const stepsEl = $('#steps');
stepsEl.innerHTML = STEPS.map((s, i) => `<li data-i="${i}"><div class="t"><span class="n">${i + 1}</span>${s.title}</div><p class="x">${s.text}</p></li>`).join('');
stepsEl.addEventListener('click', (e) => { const li = e.target.closest('li'); if (li) { state.circ.playing = false; goStep(+li.dataset.i, true); } });
const STEP_VALVE = { 1: 'tricuspide', 2: 'pulmonaire', 5: 'mitrale', 6: 'aortique' };
function goStep(i, move) {
  const c = state.circ;
  c.step = clamp(i, 0, STEPS.length - 1);
  c.t = 0;
  if (move) c.moving = true;
  [...stepsEl.children].forEach((li, k) => { li.classList.toggle('on', k === c.step); li.classList.toggle('done', k < c.step); });
  $('#btnPrev').disabled = c.step <= 0;
  $('#btnNext').disabled = c.step >= STEPS.length - 1 && !c.playing;
  // valves : celle de l'étape s'ouvre
  const open = STEP_VALVE[c.step];
  valves.tricuspide.update(open === 'tricuspide' ? 1 : 0); valves.mitrale.update(open === 'mitrale' ? 1 : 0);
  valves.pulmonaire.update(open === 'pulmonaire' ? 1 : 0); valves.aortique.update(open === 'aortique' ? 1 : 0);
  styleFlows();
  setCircUI();
}
function styleFlows() {
  const c = state.circ;
  for (const { step, f } of flows) {
    const on = c.step < 0 || step === c.step;
    f.scale = on ? 1 : 0.62;
    f.mat.opacity = on ? 1 : 0.35;
    f.mat.depthWrite = on;
    f.update(0);
  }
}
function setCircUI() {
  const b = $('#btnCirc'), on = state.circ.moving;
  b.classList.toggle('playing', on);
  b.querySelector('span').textContent = on ? 'Pause' : 'Lancer';
}
$('#btnCirc').addEventListener('click', () => {
  const c = state.circ;
  if (c.moving) { c.moving = false; c.playing = false; }
  else { c.moving = true; c.playing = true; if (c.step < 0 || c.step >= STEPS.length - 1) goStep(0); }
  setCircUI();
  $('#btnNext').disabled = c.step >= STEPS.length - 1 && !c.playing;
});
$('#btnNext').addEventListener('click', () => { state.circ.playing = false; goStep(state.circ.step + 1, true); });
$('#btnPrev').addEventListener('click', () => { state.circ.playing = false; goStep(state.circ.step - 1, true); });
function enterCirc() {
  const c = state.circ;
  c.step = -1; c.playing = false; c.moving = false; c.t = 0;
  [...stepsEl.children].forEach((li) => li.classList.remove('on', 'done'));
  $('#btnPrev').disabled = true; $('#btnNext').disabled = false;
  BEAT.uAtr.value = 0; BEAT.uVen.value = 0;
  setValves(0, 0); placeValves();
  styleFlows(); setCircUI();
}
function stopCirc() { state.circ.moving = false; state.circ.playing = false; setCircUI(); }
const STEP_DUR = 4.2;
function stepCirc(dt) {
  const c = state.circ;
  if (state.mode !== 'circ' || !c.moving) return;
  for (const { step, f } of flows) if (c.playing || step === c.step) f.update(dt);
  if (c.playing) {
    c.t += dt;
    if (c.t > STEP_DUR) goStep((c.step + 1) % STEPS.length);
  }
}

/* ================================================================
   Mode Irrigation
   ================================================================ */
const ART = ['cd', 'iva', 'cx'];
$('#arteries').innerHTML = ART.map((id) => `<button class="art" data-id="${id}"><i style="background:${ELEMENTS[id].terr}"></i>${ELEMENTS[id].name}</button>`).join('');
$('#arteries').addEventListener('click', (e) => { const b = e.target.closest('.art'); if (b) selectArtery(b.dataset.id); });
const ART_VIEW = { cd: V(-0.85, -0.45, 0.45), iva: V(-0.05, 0.05, 1), cx: V(0.9, 0.15, -0.5) };
function selectArtery(id, { noFly = false } = {}) {
  const s = state.irrig;
  if (s.occ && s.art !== id) s.occ = false;
  s.art = id;
  for (const b of document.querySelectorAll('.art')) b.classList.toggle('on', b.dataset.id === id);
  for (const e of Object.values(els)) e.glowTarget = e.id === id ? 0.8 : 0;
  $('#zone').style.display = id ? '' : 'none';
  panes.irrig.classList.toggle('has-art', !!id);
  $('#zoneText').textContent = id ? ELEMENTS[id].zone : '';
  $('#btnOcc').style.display = id ? '' : 'none';
  updateIrrig();
  if (id && !noFly) flyTo(VIEWS.irrig.target, VIEWS.irrig.dist, ART_VIEW[id]);
}
$('#btnOcc').addEventListener('click', () => { state.irrig.occ = !state.irrig.occ; updateIrrig(); });
function updateIrrig() {
  const s = state.irrig;
  const b = $('#btnOcc');
  b.classList.toggle('restore', s.occ);
  b.querySelector('span').textContent = s.occ ? 'Rétablir la circulation' : 'Simuler une obstruction';
  $('#alert').classList.toggle('on', !!(s.occ && s.art));
  $('#alertText').textContent = s.art ? `Si ${ELEMENTS[s.art].the} se bouche, souvent par un caillot sur une plaque d'athérome, la zone qu'elle irrigue manque d'oxygène et souffre : c'est l'infarctus. ${ELEMENTS[s.art].infarct}` : '';
  paintTerritories();
  occluder.visible = !!(s.occ && s.art);
  if (occluder.visible) {
    const pts = corPaths[s.art];
    occluder.position.copy(VA(pts[Math.floor(pts.length * (s.art === 'cd' ? 0.18 : 0.12))]));
  }
  for (const id of ART) {
    const m = COR_MESH[id];
    const col = state.mode !== 'irrig' ? COR : (s.occ && s.art === id ? '#6F6680' : (!s.art || s.art === id) ? ELEMENTS[id].terr : '#C98A8F');
    m.material.color.set(col);
    m.children[0].material.color.copy(darker(col, 0.5));
  }
  const tr = COR_MESH.tronc, tc = state.mode !== 'irrig' ? COR : s.art === 'iva' || s.art === 'cx' ? ELEMENTS[s.art].terr : !s.art ? '#5E8C9A' : '#C98A8F';
  tr.material.color.set(tc); tr.children[0].material.color.copy(darker(tc, 0.5));
}
const occluder = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), new THREE.MeshToonMaterial({ color: '#3B3350', gradientMap }));
occluder.visible = false;
heart.add(occluder);
function paintTerritories() {
  if (!wallGeo) return;
  const arr = wallGeo.colAttr.array;
  const s = state.irrig, irr = state.mode === 'irrig';
  const tc = {}; for (const id of ART) tc[id] = C(ELEMENTS[id].terr);
  const c = new THREE.Color(), b = new THREE.Color();
  for (let i = 0; i < wallGeo.n; i++) {
    b.fromArray(baseColors, i * 3);
    const t = territory[i];
    if (irr && t && (!s.art || s.art === t)) {
      if (s.occ && s.art === t) c.copy(OBST).multiplyScalar(0.75 + 0.35 * (b.r + b.g + b.b) / 2.2);
      else c.copy(b).lerp(tc[t].clone().multiplyScalar(0.55 + 0.45 * b.r), s.art ? 0.72 : 0.55);
      c.toArray(arr, i * 3);
    } else if (irr && s.art) {
      c.copy(b).lerp(C('#F4E3E1'), 0.35).toArray(arr, i * 3);
    } else b.toArray(arr, i * 3);
  }
  wallGeo.colAttr.needsUpdate = true;
}
function enterIrrig() {
  setValvesRest();
  selectArtery(null, { noFly: true });
}
function resetIrrig() {
  state.irrig.art = null; state.irrig.occ = false;
  for (const b of document.querySelectorAll('.art')) b.classList.remove('on');
  if (wallGeo) { updateIrrig(); }
}

/* ================================================================
   Boucle de rendu
   ================================================================ */
let last = performance.now();
function update(dt) {
  updateTweens(dt);
  if (controls.enabled) controls.update(dt);
  camera.setViewOffset(W, H, W / 2 - VIEW_X, H / 2 - VIEW_Y, W, H);
  lightRig.quaternion.copy(camera.quaternion);
  if (mouse.inside && mouse.moved) { mouse.moved = false; setHover(hoverIdFromHit(pickHit())); }
  if (tooltip.classList.contains('on')) {
    if (tooltip.dataset.scene) { tooltip.style.left = mouse.sx + 'px'; tooltip.style.top = mouse.sy + 'px'; }
    else if (state.hover) { const s = toScreen(els[state.hover].anchor); tooltip.style.left = s.x + 'px'; tooltip.style.top = (s.y - 8) + 'px'; }
  }
  const k = INSTANT ? 1 : Math.min(1, dt * 6);
  for (const e of Object.values(els)) {
    e.glow += (e.glowTarget - e.glow) * k;
    const h = state.hover === e.id ? 1 : 0;
    e.hover += (h - e.hover) * (INSTANT ? 1 : Math.min(1, dt * 12));
    e.applyLook();
  }
  stepBeat(Math.min(dt, 0.05));
  stepCirc(Math.min(dt, 0.05));
  updateLabels();
}
function frame() {
  const now = performance.now();
  const dt = Math.min(0.25, (now - last) / 1000);
  last = now;
  update(dt);
  renderer.render(scene, camera);
  schedule();
}
function schedule() {
  if (document.hidden) setTimeout(frame, 120);
  else requestAnimationFrame(frame);
}

/* ================================================================
   Démarrage
   ================================================================ */
function build() {
  buildWalls();
  buildVessels();
  buildCoronaries();
  for (const id of ['tricuspide', 'mitrale', 'pulmonaire', 'aortique']) buildValve(id);
  buildLungs();
  buildFlows();
  setAnchors();
  if (params.get('hide') === 'vessels' || params.get('hide') === 'all') for (const id of ['aorte', 'ap', 'vcs', 'vci', 'vp']) for (const m of els[id].meshes) if (!m.userData.walls) m.visible = false;
  if (params.get('hide') === 'cor' || params.get('hide') === 'all') for (const m of Object.values(COR_MESH)) m.visible = false;
  const cp = HM.cutPlane();
  CUT = { c: VA(cp.c), n: VA(cp.n).negate().normalize() };
  applyCut();
  camera.position.copy(HOME.target).add(HOME.dir.clone().normalize().multiplyScalar(HOME.dist));
  controls.target.copy(HOME.target);
  controls.update();
  select(null, { noFly: true });
  setValvesRest();
  updateIrrig();
}

function applyCaptureState() {
  INSTANT = true;
  const mode = params.get('mode') || 'explorer';
  setMode(mode);
  if (params.get('labels') === '1') { setLabels(true); }
  if (params.get('cut') === '1') setCut(true); else if (params.get('cut') === '0') setCut(false);
  const el = params.get('el');
  if (el && els[el]) { if (mode === 'explorer') select(el); }
  if (mode === 'beat' && params.get('t')) {
    // t en secondes depuis le début du cycle (fréquence bpm)
    if (params.get('bpm')) setBpm(+params.get('bpm'));
    state.beat.f = ((+params.get('t')) * state.beat.bpm / 60) % 1;
    lastPhase = null; applyBeat();
  }
  if (mode === 'circ' && params.get('step')) {
    goStep(+params.get('step') - 1, false);
    const T = +(params.get('t') || 0);
    for (let t = 0; t < T; t += 1 / 30) for (const { step, f } of flows) if (step === state.circ.step) f.update(1 / 30);
    state.circ.moving = false; setCircUI();
  }
  if (mode === 'irrig' && params.get('artery')) {
    selectArtery(params.get('artery'));
    if (params.get('occlude') === '1') { state.irrig.occ = true; updateIrrig(); }
  }
  const view = params.get('view');
  const dirs = { front: V(0, 0.05, 1), back: V(0, 0.1, -1), left: V(1, 0.1, 0), right: V(-1, 0.1, 0), below: V(0.1, -1, 0.25), above: V(0, 1, 0.2), cut: CUT.n.clone().negate().add(V(-0.15, 0, 0)) };
  if (view && dirs[view]) {
    const v = VIEWS[mode];
    flyTo(v.target, +(params.get('dist') || v.dist), dirs[view]);
  }
  const hov = params.get('hover');
  if (hov && els[hov]) setHover(hov, false);
  update(0.016);
  INSTANT = false;
}

let started = false;
function start() {
  if (started) return;
  started = true;
  fit();
  build();
  if (CAPTURE) applyCaptureState();
  else setMode('explorer', { keepView: true });
  $('#loading').classList.add('done');
  schedule();
}
// laisser le message de chargement s'afficher avant le calcul du maillage
requestAnimationFrame(() => setTimeout(start, 30));
setTimeout(start, 1500); // rAF peut rester bloqué dans un iframe que l'hôte n'affiche pas encore

window.__coeur = { pickAt(x, y) { raycaster.setFromCamera({ x: x / W * 2 - 1, y: -(y / H * 2 - 1) }, camera); return raycaster.intersectObjects(scene.children, true).filter((h) => h.object.visible).slice(0, 4).map((h) => [h.object.type, h.object.userData.el && h.object.userData.el.id, h.object.material.type, h.object.material.side, h.point.toArray().map((v) => v.toFixed(2)).join(','), h.face && h.face.a]); }, els, state, camera, controls, setMode, select, setCut, goStep, selectArtery, HM };
