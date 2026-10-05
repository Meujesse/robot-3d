import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ORGANS, ORDER, GREFFE_STEPS } from './data.js';

/* ================================================================
   Réglages généraux
   ================================================================ */
const W = 1920, H = 1080;
const CARD_OFFSET = 410;          // décalage de la vue quand la fiche est ouverte
const params = new URLSearchParams(location.search);
const CAPTURE = params.has('capture') || params.has('labels') || params.has('hover');
let INSTANT = false;              // transitions immédiates (mode capture)

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const C = (hex) => new THREE.Color(hex);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (k) => k * k * (3 - 2 * k);
const easeInOut = (k) => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

const stage = document.getElementById('stage');
const canvas = document.getElementById('scene');

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: CAPTURE });
} catch (e) {
  document.querySelector('#loading p').textContent = "La 3D n'est pas disponible sur cet appareil.";
  throw e;
}
renderer.setClearColor(0x000000, 0);
renderer.setSize(W, H, false);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 200);
camera.position.set(0, 0.2, 19.5);

/* --- Mise à l'échelle 16:9 --- */
let stageScale = 1;
let fitW = -1, fitH = -1;
function fit() {
  // Genially (et d'autres hôtes) peut créer l'iframe à taille nulle puis l'agrandir sans événement resize
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
scene.add(new THREE.HemisphereLight(0xffffff, 0xd4dde8, 1.55));
const key = new THREE.DirectionalLight(0xffffff, 1.9);
key.position.set(-4, 6, 10);
scene.add(key);
const rim = new THREE.DirectionalLight(0xdff3ff, 0.7);
rim.position.set(5, 3, -8);
scene.add(rim);

/* --- Matériaux "illustration" --- */
const gradientMap = new THREE.DataTexture(new Uint8Array([150, 205, 255]), 3, 1, THREE.RedFormat);
gradientMap.minFilter = gradientMap.magFilter = THREE.NearestFilter;
gradientMap.needsUpdate = true;

const WAVE_GLSL = 'transformed += normal * uWaveAmp * pow(0.5 + 0.5 * sin(aU * uWaveK - uWaveTime), 3.0);';
const WAVE_DECL = 'attribute float aU;\nuniform float uWaveAmp;\nuniform float uWaveTime;\nuniform float uWaveK;\n';

function makeToon(color, { wave = null, vertexColors = false } = {}) {
  const m = new THREE.MeshToonMaterial({ color: vertexColors ? 0xffffff : color, gradientMap, vertexColors });
  m.emissive = C(color);
  m.emissiveIntensity = 0;
  if (wave) {
    m.onBeforeCompile = (s) => {
      Object.assign(s.uniforms, wave);
      s.vertexShader = WAVE_DECL + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + WAVE_GLSL);
    };
    m.customProgramCacheKey = () => 'toon-wave';
  }
  return m;
}
function makeOutline(color, thick, wave) {
  const m = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
  m.onBeforeCompile = (s) => {
    s.uniforms.uThick = { value: thick };
    if (wave) Object.assign(s.uniforms, wave);
    s.vertexShader = (wave ? WAVE_DECL : '') + 'uniform float uThick;\n' + s.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n' + (wave ? WAVE_GLSL + '\n' : '') + 'transformed += normalize(normal) * uThick;'
    );
  };
  m.customProgramCacheKey = () => (wave ? 'outline-wave' : 'outline');
  return m;
}
function darker(hex, k = 0.55) {
  const c = C(hex);
  const hsl = {}; c.getHSL(hsl);
  return new THREE.Color().setHSL(hsl.h, clamp(hsl.s * 0.9, 0, 1), hsl.l * k);
}

/* ================================================================
   Géométries procédurales
   ================================================================ */
// Sphère déformée : shape(v, u) modifie v (coordonnées unitaires), color(u, v) -> THREE.Color
function blob({ rx = 1, ry = 1, rz = 1, ws = 72, hs = 54, shape, color }) {
  let g = new THREE.SphereGeometry(1, ws, hs);
  g.deleteAttribute('uv'); g.deleteAttribute('normal');
  g = mergeVertices(g);
  const p = g.attributes.position;
  const v = new THREE.Vector3(), u = new THREE.Vector3();
  const cols = color ? new Float32Array(p.count * 3) : null;
  for (let i = 0; i < p.count; i++) {
    u.fromBufferAttribute(p, i); v.copy(u);
    if (shape) shape(v, u);
    if (cols) { const c = color(u, v); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
    p.setXYZ(i, v.x * rx, v.y * ry, v.z * rz);
  }
  if (cols) g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  g.computeVertexNormals();
  return g;
}

// Profil de rayon par paliers lissés : [[u, r], ...]
function profile(pts) {
  return (u) => {
    if (u <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (u <= pts[i][0]) {
        const k = (u - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]);
        return lerp(pts[i - 1][1], pts[i][1], smooth(k));
      }
    }
    return pts[pts.length - 1][1];
  };
}

// Tube à rayon variable, avec attribut aU (0→1 le long du tube) pour les ondes
function varTube(points, { segments = 220, radial = 28, radius = () => 0.1, tension = 0.5, curve } = {}) {
  curve = curve || new THREE.CatmullRomCurve3(points, false, 'catmullrom', tension);
  const frames = curve.computeFrenetFrames(segments, false);
  const pos = [], nor = [], aU = [], idx = [];
  const P = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    curve.getPointAt(u, P);
    const N = frames.normals[i], B = frames.binormals[i];
    const r = radius(u);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const s = Math.sin(a), c = -Math.cos(a);
      n.set(c * N.x + s * B.x, c * N.y + s * B.y, c * N.z + s * B.z).normalize();
      pos.push(P.x + r * n.x, P.y + r * n.y, P.z + r * n.z);
      nor.push(n.x, n.y, n.z);
      aU.push(u);
    }
  }
  for (let i = 1; i <= segments; i++) {
    for (let j = 1; j <= radial; j++) {
      const a = (radial + 1) * (i - 1) + (j - 1), b = (radial + 1) * i + (j - 1);
      const c = (radial + 1) * i + j, d = (radial + 1) * (i - 1) + j;
      idx.push(a, b, d, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aU', new THREE.Float32BufferAttribute(aU, 1));
  g.setIndex(idx);
  g.userData.curve = curve;
  g.userData.r0 = radius(0); g.userData.r1 = radius(1);
  return g;
}
function capSphere(r) {
  const g = new THREE.SphereGeometry(r, 24, 16);
  g.setAttribute('aU', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count), 1));
  return g;
}

/* ================================================================
   Organes
   ================================================================ */
class Organ {
  constructor(id) {
    this.id = id;
    this.data = ORGANS[id];
    this.group = new THREE.Group();
    this.group.name = id;
    this.meshes = [];
    this.outlines = [];
    this.wave = { uWaveAmp: { value: 0 }, uWaveTime: { value: 0 }, uWaveK: { value: 18 } };
    this.op = 1; this.opTarget = 1;
    this.glow = 0; this.glowTarget = 0; this.hover = 0;
  }
  add(geom, color, { wave = false, outline = true, vertexColors = false, pick = true, thick = 0.018, parent, outlineColor } = {}) {
    const mat = makeToon(color, { wave: wave ? this.wave : null, vertexColors });
    const m = new THREE.Mesh(geom, mat);
    m.userData.organ = this;
    m.userData.pick = pick;
    (parent || this.group).add(m);
    this.meshes.push(m);
    if (outline) {
      const om = new THREE.Mesh(geom, makeOutline(outlineColor || darker(color), thick, wave ? this.wave : null));
      om.raycast = () => {};
      m.add(om);
      this.outlines.push(om);
    }
    return m;
  }
  tube(points, color, opts = {}) {
    const g = varTube(points, opts);
    const m = this.add(g, color, opts);
    if (opts.caps !== false) {
      const curve = g.userData.curve;
      const ends = opts.caps === 'end' ? [1] : opts.caps === 'start' ? [0] : [0, 1];
      for (const u of ends) {
        const r = u ? g.userData.r1 : g.userData.r0;
        const cm = this.add(capSphere(r), color, { ...opts, parent: opts.parent });
        cm.position.copy(curve.getPointAt(u));
      }
    }
    return m;
  }
  // Recentre le groupe sur son volume (pour les mises à l'échelle / déplacements)
  recenter() {
    this.group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.group);
    const c = box.getCenter(new THREE.Vector3());
    const lc = this.group.worldToLocal(c.clone());
    for (const ch of this.group.children) ch.position.sub(lc);
    this.group.position.copy(c);
    this.base = c.clone();
    this.radius = box.getSize(new THREE.Vector3()).length() / 2;
    this.size = box.getSize(new THREE.Vector3());
  }
  applyLook() {
    const o = this.op;
    const transparent = o < 0.995;
    for (const m of this.meshes) {
      const mat = m.material;
      if (mat.transparent !== transparent) { mat.transparent = transparent; mat.needsUpdate = true; }
      mat.opacity = o;
      mat.depthWrite = !transparent;
      mat.emissiveIntensity = Math.max(this.glow, this.hover) * 0.42;
    }
    for (const m of this.outlines) {
      const mat = m.material;
      if (mat.transparent !== transparent) { mat.transparent = transparent; mat.needsUpdate = true; }
      mat.opacity = o * o;
      mat.depthWrite = !transparent;
      m.visible = o > 0.02;
    }
    for (const m of this.meshes) m.visible = o > 0.01;
    if (this.halo) {
      this.halo.material.opacity = this.glow * 0.85 * o;
      this.halo.visible = this.glow > 0.01;
    }
  }
}

const body = new THREE.Group();   // donneur
scene.add(body);
const organs = {};
const pickables = [];

/* --- Torse translucide --- */
function torsoGeometry() {
  const prof = [[0, -4.45], [0.95, -4.38], [1.55, -4.12], [1.86, -3.6], [1.94, -2.95], [1.82, -2.15], [1.66, -1.25],
    [1.63, -0.45], [1.76, 0.55], [1.93, 1.55], [2.04, 2.45], [2.05, 3.0], [1.9, 3.42], [1.42, 3.74], [0.74, 3.92],
    [0.57, 4.12], [0.55, 4.55], [0.47, 4.82], [0, 4.9]];
  const sp = new THREE.SplineCurve(prof.map((p) => new THREE.Vector2(p[0], p[1])));
  const pts = sp.getPoints(140);
  pts[0].x = 0; pts[pts.length - 1].x = 0;
  const g = new THREE.LatheGeometry(pts, 110);
  g.scale(1.12, 1, 0.62);
  return g;
}
function skinMaterial(side, base) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uOpacity: { value: 1 }, uBase: { value: base },
      uSkin: { value: C('#F4CFAE') }, uRim: { value: C('#D9906C') }
    },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float uOpacity; uniform float uBase; uniform vec3 uSkin; uniform vec3 uRim; varying vec3 vN; varying vec3 vV;
      void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n;
        float f = 1.0 - abs(dot(n, normalize(vV))); f = pow(f, 2.1);
        vec3 c = mix(uSkin, uRim, f) * (0.9 + 0.1*n.y);
        gl_FragColor = vec4(c, (uBase + 0.6*f) * uOpacity);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, side
  });
}
function makeTorso() {
  const g = torsoGeometry();
  const grp = new THREE.Group();
  const back = new THREE.Mesh(g, skinMaterial(THREE.BackSide, 0.05));
  back.renderOrder = 5;
  const front = new THREE.Mesh(g, skinMaterial(THREE.FrontSide, 0.07));
  front.renderOrder = 6;
  grp.add(back, front);
  grp.userData.mats = [back.material, front.material];
  grp.userData.op = 1; grp.userData.opTarget = 1;
  return grp;
}
const torso = makeTorso();
body.add(torso);

/* --- Cœur --- */
const HP = V(0.28, 0.95, 0.5), HS = 0.8;
const Hw = (x, y, z) => V(HP.x + HS * x, HP.y + HS * y, HP.z + HS * z);
function buildHeart() {
  const o = new Organ('coeur');
  const model = new THREE.Group();
  o.group.add(model);
  o.model = model;
  const grooveX = (y) => -0.05 + 0.172 * (y + 1);
  const g = blob({
    rx: 0.62, ry: 0.8, rz: 0.56,
    shape: (v, u) => {
      let { x, y, z } = u;
      const t = (1 - y) / 2;
      const k = 1 - 0.6 * Math.pow(t, 1.7);
      x *= k; z *= k;
      if (y > 0.45) y = 0.45 + (y - 0.45) * 0.55;
      if (z > 0) z *= 0.86;
      const gx = x - grooveX(u.y);
      if (z > 0.08) {
        const gg = Math.exp(-(gx * gx) / 0.005) * Math.min(1, (z - 0.08) * 3);
        x *= 1 - 0.05 * gg; z *= 1 - 0.09 * gg;
      }
      v.set(x, y, z);
    },
    color: (u) => C('#EC5860').lerp(C('#D8343F'), smooth(clamp((u.x - grooveX(u.y) + 0.07) / 0.14, 0, 1)))
  });
  const bodyMesh = o.add(g, '#E63946', { vertexColors: true, parent: model, thick: 0.022 });
  bodyMesh.rotation.set(0, -0.25, 0.5);
  o.ventricles = bodyMesh;
  // oreillettes
  const ra = o.add(blob({ rx: 0.3, ry: 0.33, rz: 0.3 }), '#D24657', { parent: model, thick: 0.02 });
  ra.position.set(-0.52, 0.32, 0.02);
  const la = o.add(blob({ rx: 0.21, ry: 0.12, rz: 0.15 }), '#D24657', { parent: model, thick: 0.018 });
  la.position.set(0.42, 0.52, 0.22); la.rotation.z = -0.45;
  // aorte et ses branches
  const red = '#EE5D66', blue = '#5B7FD6', dblue = '#4F72C9';
  o.tube([V(-0.12, 0.3, 0.05), V(-0.08, 0.85, 0.08), V(0.0, 1.2, 0.05), V(0.25, 1.33, -0.08), V(0.48, 1.15, -0.22), V(0.55, 0.75, -0.35), V(0.55, 0.25, -0.42)],
    red, { radius: profile([[0, 0.17], [1, 0.15]]), parent: model, caps: 'end', thick: 0.02 });
  for (const [a, b] of [[V(0.0, 1.2, 0.04), V(-0.06, 1.62, 0.04)], [V(0.16, 1.3, -0.04), V(0.17, 1.68, -0.04)], [V(0.32, 1.28, -0.12), V(0.38, 1.62, -0.12)]]) {
    o.tube([a, a.clone().lerp(b, 0.5).add(V(0, 0, 0.01)), b], red, { radius: () => 0.055, parent: model, segments: 24, radial: 14, thick: 0.014 });
  }
  // tronc pulmonaire
  o.tube([V(0.12, 0.28, 0.3), V(0.18, 0.7, 0.32), V(0.22, 0.95, 0.2)], blue, { radius: profile([[0, 0.15], [1, 0.13]]), parent: model, caps: false, thick: 0.02 });
  o.tube([V(0.22, 0.95, 0.2), V(0.5, 1.0, 0.05), V(0.78, 0.95, -0.05)], blue, { radius: () => 0.1, parent: model, caps: 'end', segments: 40, thick: 0.016 });
  o.tube([V(0.22, 0.95, 0.2), V(0.1, 1.0, -0.15), V(-0.2, 1.0, -0.3), V(-0.5, 0.98, -0.25)], blue, { radius: () => 0.1, parent: model, caps: 'end', segments: 50, thick: 0.016 });
  // veines caves
  o.tube([V(-0.55, 0.45, 0.0), V(-0.55, 0.95, -0.02), V(-0.52, 1.45, -0.05)], dblue, { radius: () => 0.12, parent: model, caps: 'end', segments: 40, thick: 0.018 });
  o.tube([V(-0.5, 0.1, -0.1), V(-0.5, -0.4, -0.18), V(-0.48, -0.7, -0.22)], dblue, { radius: () => 0.13, parent: model, caps: 'end', segments: 40, thick: 0.018 });
  // artères coronaires (fins traits)
  o.tube([V(-0.1, 0.36, 0.2), V(0.02, 0.15, 0.48), V(0.12, -0.25, 0.47), V(0.3, -0.6, 0.3)], '#C22C3A', { radius: () => 0.028, parent: model, segments: 60, radial: 10, outline: false });
  model.position.copy(HP);
  model.scale.setScalar(HS);
  o.anchor = Hw(0.25, -0.1, 0.55);
  return o;
}

/* --- Poumons --- */
function buildLung(id, side) {
  const o = new Organ(id);
  const medial = -side;
  const notch = side > 0;
  const lobe = { up: C('#F7AFA6'), mid: C('#F4BBAA'), low: C('#EF9F98') };
  const info = (x, y, z) => {
    const ob = 0.894 * y + 0.447 * z + 0.045;
    const hz = y - 0.12;
    return { ob, hz };
  };
  const g = blob({
    rx: side < 0 ? 0.98 : 0.9, ry: 1.65, rz: 0.82, ws: 128, hs: 96,
    shape: (v, u) => {
      let { x, y, z } = u;
      if (y > 0.15) { const t = (y - 0.15) / 0.85; const k = 1 - 0.5 * Math.pow(t, 1.4); x *= k; z *= k; }
      if (y < -0.2) { const t = (-y - 0.2) / 0.8; const k = 1 + 0.14 * t; x *= k; z *= k; }
      const mx = x * medial;
      if (mx > 0) x = medial * (mx - 0.55 * mx * smooth(clamp(mx / 0.4, 0, 1)));
      if (z < 0) z *= 1.12;
      const rr = x * x + z * z;
      if (y < -0.3) y += 0.36 * Math.max(0, 1 - rr / 0.8) * ((-y - 0.3) / 0.7);
      if (notch) {
        const nm = x * medial;
        if (nm > 0.02 && y < 0.15 && y > -1) {
          const gy = Math.sin(Math.PI * clamp((y + 0.95) / 1.1, 0, 1));
          const gz = clamp((z + 0.15) / 0.5, 0, 1);
          x -= medial * 0.32 * gy * gz * clamp(nm / 0.2, 0, 1);
        }
      }
      const { ob, hz } = info(x, y, z);
      let gr = Math.exp(-(ob * ob) / 0.0022);
      if (!notch && ob > 0) gr = Math.max(gr, Math.exp(-(hz * hz) / 0.0022) * (z > -0.25 ? 1 : 0));
      x *= 1 - 0.075 * gr; z *= 1 - 0.075 * gr;
      v.set(x, y, z);
    },
    color: (u, v) => {
      const { ob, hz } = info(v.x, v.y, v.z);
      let c = ob < 0 ? lobe.low : (!notch && hz < 0) ? lobe.mid : lobe.up;
      let gr = Math.exp(-(ob * ob) / 0.0012);
      if (!notch && ob > 0) gr = Math.max(gr, Math.exp(-(hz * hz) / 0.0012) * (v.z > -0.25 ? 1 : 0));
      return c.clone().lerp(C('#C9625E'), 0.75 * gr);
    }
  });
  o.add(g, '#F39C93', { vertexColors: true, thick: 0.022 });
  o.group.position.set(side * 1.08, 1.8, -0.05);
  o.anchor = V(side * 1.45, 2.35, 0.55);
  return o;
}

/* --- Foie (+ vésicule biliaire) --- */
function buildLiver() {
  const o = new Organ('foie');
  const g = blob({
    rx: 1.35, ry: 0.8, rz: 0.8,
    shape: (v, u) => {
      let { x, y, z } = u;
      const t = (x + 1) / 2; // 0 = lobe droit (à gauche de l'écran)
      const top = 0.85 + 0.16 * Math.sin(Math.PI * t * 0.9) - 0.6 * t * t;
      const bot = -0.95 + 1.05 * Math.pow(t, 0.9);
      const mid = (top + bot) / 2, half = (top - bot) / 2;
      y = mid + y * half;
      z *= (1 - 0.5 * t) * (0.55 + 0.45 * clamp((u.y + 1) / 1.4, 0, 1));
      const gg = Math.exp(-((t - 0.56) ** 2) / 0.0016) * (u.y > 0 && u.z > 0 ? 1 : 0);
      y -= 0.06 * gg; z *= 1 - 0.06 * gg;
      v.set(x, y, z);
    }
  });
  const m = o.add(g, '#C0664A', { thick: 0.022 });
  m.rotation.z = 0;
  const gb = o.add(blob({ rx: 0.13, ry: 0.24, rz: 0.13, shape: (v, u) => { if (u.y > 0) { v.x *= 1 - 0.3 * u.y; v.z *= 1 - 0.3 * u.y; } } }), '#86BD62', { thick: 0.016 });
  gb.position.set(-0.42, -0.5, 0.42); gb.rotation.z = 0.5; gb.rotation.x = -0.4;
  o.group.position.set(-0.5, -0.05, 0.3);
  o.anchor = V(-1.15, -0.05, 0.85);
  o.gallbladder = V(-0.8, -0.55, 0.85);
  return o;
}

/* --- Estomac (+ œsophage) --- */
const STOMACH_PTS = [V(0.42, 0.2, 0.1), V(0.74, 0.42, 0.12), V(1.08, 0.15, 0.2), V(1.12, -0.35, 0.3), V(0.85, -0.78, 0.4), V(0.45, -0.88, 0.44), V(0.12, -0.75, 0.42), V(-0.05, -0.62, 0.36)];
const ESO_PTS = [V(0.0, 4.55, -0.3), V(0.02, 3.2, -0.32), V(0.06, 1.6, -0.4), V(0.18, 0.75, -0.25), V(0.42, 0.2, 0.1)];
function buildStomach() {
  const o = new Organ('estomac');
  o.tube(STOMACH_PTS, '#EE8FA6', { wave: true, radius: profile([[0, 0.13], [0.12, 0.36], [0.35, 0.44], [0.55, 0.4], [0.8, 0.24], [1, 0.14]]), segments: 160, radial: 40, thick: 0.02 });
  o.tube(ESO_PTS, '#EFA0B0', { wave: true, radius: () => 0.085, segments: 120, radial: 16, caps: 'start', thick: 0.015 });
  o.anchor = V(1.05, -0.3, 0.7);
  return o;
}

/* --- Rate --- */
function buildSpleen() {
  const o = new Organ('rate');
  const g = blob({
    rx: 0.27, ry: 0.5, rz: 0.2,
    shape: (v, u) => { let { x, y, z } = u; if (x < 0) x *= 0.55; x -= 0.18 * (1 - y * y); v.set(x, y, z); }
  });
  const m = o.add(g, '#8E6BB0', { thick: 0.018 });
  m.rotation.set(0.2, 0.5, -0.45);
  o.group.position.set(1.58, -0.05, -0.42);
  o.anchor = V(1.75, 0.15, -0.2);
  return o;
}

/* --- Pancréas --- */
const PANC_PTS = [V(-0.28, -1.08, 0.05), V(0.1, -0.98, -0.05), V(0.55, -0.88, -0.2), V(1.0, -0.68, -0.32), V(1.32, -0.45, -0.38)];
function buildPancreas() {
  const o = new Organ('pancreas');
  o.tube(PANC_PTS, '#F2C14E', { radius: (u) => profile([[0, 0.2], [0.15, 0.16], [0.5, 0.13], [1, 0.08]])(u) * (1 + 0.08 * Math.sin(u * 60)), segments: 120, radial: 24, thick: 0.016 });
  o.anchor = V(0.6, -0.92, 0.0);
  return o;
}

/* --- Reins --- */
const KID = { 'rein-droit': { c: V(-0.95, -1.3, -0.6), side: -1 }, 'rein-gauche': { c: V(0.95, -1.1, -0.6), side: 1 } };
function buildKidney(id) {
  const { c, side } = KID[id];
  const medial = -side;
  const o = new Organ(id);
  const g = blob({
    rx: 0.34, ry: 0.55, rz: 0.27,
    shape: (v, u) => {
      let { x, y, z } = u;
      const mx = x * medial;
      if (mx > 0.25) { const gg = Math.exp(-(y * y) / 0.09) * (mx - 0.25) / 0.75; x -= medial * 0.55 * gg; }
      v.set(x, y, z);
    }
  });
  const m = o.add(g, '#C0485E', { thick: 0.02 });
  const adr = o.add(blob({ rx: 0.2, ry: 0.13, rz: 0.11, shape: (v, u) => { if (u.y > 0) { v.x *= 1 - 0.6 * u.y; v.z *= 1 - 0.5 * u.y; } } }), '#EDBB55', { thick: 0.014 });
  adr.position.set(medial * 0.06, 0.58, 0);
  o.group.position.copy(c);
  o.group.rotation.z = side < 0 ? -0.22 : 0.22;
  o.hilum = c.clone().add(V(medial * 0.24, -0.02, 0.05));
  o.anchor = c.clone().add(V(side * 0.15, 0.1, 0.3));
  return o;
}

/* --- Intestins --- */
function smallIntestinePts() {
  const pts = [V(-0.05, -0.62, 0.36), V(-0.38, -0.72, 0.25), V(-0.52, -1.0, 0.15), V(-0.42, -1.3, 0.12), V(0.0, -1.42, 0.12), V(0.45, -1.48, 0.18), V(0.72, -1.72, 0.3)];
  const rows = 6;
  for (let r = 0; r < rows; r++) {
    const y0 = -1.9 - r * 0.23;
    const dir = r % 2 === 0 ? -1 : 1;
    for (let k = 0; k <= 6; k++) {
      const t = k / 6;
      const x = dir * (0.78 - 1.56 * t) * (r % 2 === 0 ? 1 : 1);
      const xx = r % 2 === 0 ? 0.78 - 1.56 * t : -0.78 + 1.56 * t;
      const wob = 0.075 * Math.sin(t * Math.PI * 3 + r);
      pts.push(V(xx, y0 + wob, 0.34 + 0.12 * Math.sin(t * Math.PI * 2 + r * 1.3)));
      void x;
    }
  }
  pts.push(V(-0.95, -3.12, 0.3), V(-1.1, -3.05, 0.26));
  return pts;
}
const SI_PTS = smallIntestinePts();
const COLON_PTS = [V(-1.15, -3.05, 0.25), V(-1.3, -2.5, 0.25), V(-1.32, -1.8, 0.25), V(-1.2, -1.32, 0.35), V(-0.7, -1.3, 0.55), V(0, -1.45, 0.62), V(0.7, -1.3, 0.55),
  V(1.22, -1.08, 0.35), V(1.38, -1.6, 0.25), V(1.38, -2.4, 0.2), V(1.25, -3.0, 0.2), V(0.85, -3.25, 0.15), V(0.45, -3.05, 0.05), V(0.15, -3.25, -0.25), V(0.02, -3.7, -0.4), V(0, -4.12, -0.42)];
function buildIntestines() {
  const o = new Organ('intestins');
  o.wave.uWaveK.value = 60;
  o.tube(SI_PTS, '#F6B49A', { wave: true, radius: (u) => 0.135 * (u < 0.03 ? 1.05 : 1), segments: 700, radial: 18, thick: 0.016 });
  o.tube(COLON_PTS, '#DE9472', {
    wave: true, segments: 420, radial: 24, thick: 0.02,
    radius: (u) => 0.23 * (1 + 0.14 * Math.pow(Math.abs(Math.sin(u * Math.PI * 34)), 0.8)) * (u > 0.85 ? 1 - (u - 0.85) * 2.2 : 1)
  });
  o.tube([V(-1.08, -3.15, 0.25), V(-0.98, -3.38, 0.3), V(-0.86, -3.45, 0.36)], '#DE9472', { radius: () => 0.045, segments: 30, radial: 12, caps: 'end', thick: 0.012 });
  o.anchor = V(-0.45, -2.35, 0.6);
  return o;
}

/* --- Vessie --- */
function buildBladder() {
  const o = new Organ('vessie');
  o.add(blob({ rx: 0.45, ry: 0.38, rz: 0.38, shape: (v, u) => { if (u.y > 0) v.y *= 0.78; else v.y *= 1.05; } }), '#EFCB72', { thick: 0.02 });
  o.tube([V(0, -0.3, 0.02), V(0, -0.5, 0.0), V(0, -0.62, -0.02)], '#EFCB72', { radius: () => 0.05, segments: 20, radial: 12, caps: 'end', thick: 0.012 });
  o.group.position.set(0, -3.6, 0.32);
  o.anchor = V(0, -3.6, 0.72);
  return o;
}

/* --- Éléments de décor (non cliquables) --- */
const decor = {};
function decorTube(name, points, color, opts) {
  const o = new Organ(name);
  o.decor = true;
  o.tube(points, color, { pick: false, ...opts });
  for (const m of o.meshes) m.userData.pick = false;
  decor[name] = o;
  body.add(o.group);
  return o;
}

/* --- Construction --- */
const builders = {
  coeur: buildHeart, 'poumon-droit': () => buildLung('poumon-droit', -1), 'poumon-gauche': () => buildLung('poumon-gauche', 1),
  foie: buildLiver, estomac: buildStomach, rate: buildSpleen, pancreas: buildPancreas,
  'rein-droit': () => buildKidney('rein-droit'), 'rein-gauche': () => buildKidney('rein-gauche'),
  intestins: buildIntestines, vessie: buildBladder
};
for (const id of ORDER) {
  const o = builders[id]();
  body.add(o.group);
  o.recenter();
  organs[id] = o;
  for (const m of o.meshes) if (m.userData.pick !== false) pickables.push(m);
}
// trachée et bronches
const RING = (u) => 0.13 * (1 + 0.09 * Math.pow(Math.abs(Math.sin(u * Math.PI * 13)), 6));
decorTube('trachee', [V(0, 4.6, 0.02), V(0, 3.6, 0.03), V(0, 2.78, 0.02)], '#BBD4E6', { radius: RING, segments: 140, radial: 20, caps: 'start' });
decor.trachee.tube([V(0, 2.8, 0.02), V(-0.35, 2.5, 0.01), V(-0.66, 2.22, -0.02)], '#BBD4E6', { radius: () => 0.085, segments: 40, radial: 14, caps: 'end', pick: false });
decor.trachee.tube([V(0, 2.8, 0.02), V(0.35, 2.52, 0.01), V(0.62, 2.3, -0.02)], '#BBD4E6', { radius: () => 0.085, segments: 40, radial: 14, caps: 'end', pick: false });
// uretères
const URETER = {
  'rein-droit': [organs['rein-droit'].hilum, V(-0.5, -2.1, -0.52), V(-0.42, -3.0, -0.25), V(-0.24, -3.5, 0.12)],
  'rein-gauche': [organs['rein-gauche'].hilum, V(0.5, -2.0, -0.52), V(0.42, -3.0, -0.25), V(0.24, -3.5, 0.12)]
};
decorTube('ureteres', URETER['rein-droit'], '#E9C27A', { radius: () => 0.042, segments: 80, radial: 12, caps: false, thick: 0.012 });
decor.ureteres.tube(URETER['rein-gauche'], '#E9C27A', { radius: () => 0.042, segments: 80, radial: 12, caps: false, thick: 0.012, pick: false });

/* --- Grands vaisseaux (visibles pendant certaines animations) --- */
const AORTA_PTS = [Hw(0.55, 0.25, -0.42), V(0.55, 0.3, -0.25), V(0.25, -0.5, -0.5), V(0.12, -1.4, -0.5), V(0.08, -2.6, -0.45), V(0.04, -3.1, -0.38)];
const IVC_PTS = [V(-0.12, -3.1, -0.42), V(-0.26, -1.6, -0.5), V(-0.3, -0.5, -0.4), V(-0.22, 0.2, -0.05), Hw(-0.48, -0.7, -0.22)];
const vessels = new Organ('vaisseaux');
vessels.decor = true;
vessels.tube(AORTA_PTS, '#EE5D66', { radius: () => 0.1, segments: 120, radial: 16, caps: false, pick: false, thick: 0.012 });
vessels.tube([V(0.04, -3.1, -0.38), V(0.35, -3.5, -0.25), V(0.62, -4.0, -0.15)], '#EE5D66', { radius: () => 0.07, segments: 30, radial: 12, caps: false, pick: false, thick: 0.01 });
vessels.tube([V(0.04, -3.1, -0.38), V(-0.3, -3.5, -0.25), V(-0.58, -4.0, -0.15)], '#EE5D66', { radius: () => 0.07, segments: 30, radial: 12, caps: false, pick: false, thick: 0.01 });
vessels.tube(IVC_PTS, '#5B7FD6', { radius: () => 0.11, segments: 120, radial: 16, caps: false, pick: false, thick: 0.012 });
vessels.tube([Hw(0.0, 1.6, 0.04), V(0.26, 2.6, 0.3), V(0.2, 3.5, 0.15), V(0.22, 4.6, 0.05)], '#EE5D66', { radius: () => 0.06, segments: 60, radial: 12, caps: false, pick: false, thick: 0.01 });
vessels.tube([V(-0.28, 4.6, 0.05), V(-0.26, 3.5, 0.12), V(-0.18, 2.6, 0.35), Hw(-0.52, 1.45, -0.05)], '#5B7FD6', { radius: () => 0.07, segments: 60, radial: 12, caps: false, pick: false, thick: 0.01 });
for (const id of ['rein-droit', 'rein-gauche']) {
  const k = organs[id];
  const s = Math.sign(k.base.x);
  vessels.tube([V(0.1, k.base.y + 0.05, -0.5), V(s * 0.35, k.base.y + 0.02, -0.55), k.hilum.clone().add(V(0, 0.06, -0.02))], '#EE5D66', { radius: () => 0.05, segments: 30, radial: 12, caps: false, pick: false, thick: 0.01 });
  vessels.tube([k.hilum.clone().add(V(0, -0.06, 0.02)), V(s * 0.3, k.base.y - 0.06, -0.48), V(-0.26, k.base.y - 0.06, -0.45)], '#5B7FD6', { radius: () => 0.055, segments: 30, radial: 12, caps: false, pick: false, thick: 0.01 });
}
body.add(vessels.group);
vessels.op = vessels.opTarget = 0;
decor.vaisseaux = vessels;

/* --- Halos (lueur douce pour la greffe) --- */
function haloTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
const HALO_TEX = haloTexture();
for (const o of Object.values(organs)) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: HALO_TEX, color: C(o.data.color).lerp(C('#FFF3B0'), 0.35), transparent: true, depthWrite: false, opacity: 0 }));
  s.scale.setScalar(o.radius * 2.6);
  s.renderOrder = 8;
  s.visible = false;
  o.group.add(s);
  o.halo = s;
}

/* ================================================================
   Particules (flux)
   ================================================================ */
const PART_GEO = new THREE.SphereGeometry(1, 14, 10);
class Flow {
  constructor(points, { count = 20, size = 0.055, colors = ['#E63946'], speed = 0.15, colorAt = null, tension = 0.5, jitter = 0, trap = null } = {}) {
    this.curve = points instanceof THREE.Curve ? points : new THREE.CatmullRomCurve3(points, false, 'catmullrom', tension);
    this.count = count; this.size = size; this.speed = speed; this.colorAt = colorAt; this.jitter = jitter; this.trap = trap;
    this.mesh = new THREE.InstancedMesh(PART_GEO, new THREE.MeshBasicMaterial({ color: 0xffffff }), count);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    this.colors = colors.map(C);
    this.phase = 0; this.dir = 1;
    this.tmpM = new THREE.Matrix4(); this.tmpP = new THREE.Vector3(); this.tmpC = new THREE.Color();
    for (let i = 0; i < count; i++) this.mesh.setColorAt(i, this.colors[i % this.colors.length]);
    this.seeds = Array.from({ length: count }, (_, i) => ({ a: Math.sin(i * 12.9898) * 43758.5453 % 1, b: Math.sin(i * 78.233) * 12345.678 % 1 }));
    scene.add(this.mesh);
  }
  update(dt, mul = 1, opts = {}) {
    this.phase += dt * this.speed * mul;
    const n = this.count;
    for (let i = 0; i < n; i++) {
      let u = (i / n + this.phase) % 1; if (u < 0) u += 1;
      let s = this.size;
      if (this.trap && i % this.trap.every === 0) {
        if (u > this.trap.at) { s *= Math.max(0, 1 - (u - this.trap.at) * 6); u = this.trap.at; }
      }
      this.curve.getPointAt(u, this.tmpP);
      if (this.jitter) {
        const sd = this.seeds[i];
        this.tmpP.x += Math.sin(sd.a * 40 + u * 25) * this.jitter;
        this.tmpP.y += Math.cos(sd.b * 40 + u * 21) * this.jitter;
        this.tmpP.z += Math.sin(sd.b * 30 + u * 17) * this.jitter * 0.6;
      }
      const edge = Math.min(1, u / 0.04, (1 - u) / 0.04);
      s *= edge * (opts.scale || 1);
      this.tmpM.makeScale(s, s, s).setPosition(this.tmpP);
      this.mesh.setMatrixAt(i, this.tmpM);
      if (this.colorAt) { this.mesh.setColorAt(i, this.tmpC.set(this.colorAt(u, i))); }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
  show(v) { this.mesh.visible = v; }
  recolor(hex) { const c = C(hex); for (let i = 0; i < this.count; i++) this.mesh.setColorAt(i, c); }
}

/* --- Chemins anatomiques (coordonnées du monde) --- */
const LV = Hw(0.15, -0.2, 0.0), RV = Hw(-0.2, -0.05, 0.15), RA = Hw(-0.52, 0.32, 0.02), LA = Hw(0.3, 0.45, -0.25);
const AORTA_ROOT = [Hw(-0.12, 0.3, 0.05), Hw(-0.08, 0.85, 0.08), Hw(0.0, 1.2, 0.05), Hw(0.25, 1.33, -0.08), Hw(0.48, 1.15, -0.22), Hw(0.55, 0.75, -0.35)];
const P = {
  aortaOut: [LV, ...AORTA_ROOT, ...AORTA_PTS, V(0.35, -3.5, -0.25), V(0.62, -4.0, -0.15)],
  carotid: [LV, Hw(-0.12, 0.3, 0.05), Hw(-0.08, 0.85, 0.08), Hw(0.0, 1.2, 0.05), Hw(0.0, 1.6, 0.04), V(0.26, 2.6, 0.3), V(0.2, 3.5, 0.15), V(0.22, 4.6, 0.05)],
  ivc: [V(-0.58, -4.0, -0.15), V(-0.3, -3.5, -0.25), ...IVC_PTS, RA, RV],
  svc: [V(-0.28, 4.6, 0.05), V(-0.26, 3.5, 0.12), V(-0.18, 2.6, 0.35), Hw(-0.52, 1.45, -0.05), RA, RV],
  pulmR: [RV, Hw(0.12, 0.28, 0.3), Hw(0.2, 0.75, 0.3), Hw(0.22, 0.95, 0.2), Hw(-0.2, 1.0, -0.3), V(-0.75, 1.85, 0.05), V(-1.2, 2.0, 0.15), V(-1.3, 1.5, 0.1), V(-0.8, 1.25, -0.05), LA, LV],
  pulmL: [RV, Hw(0.12, 0.28, 0.3), Hw(0.2, 0.75, 0.3), Hw(0.22, 0.95, 0.2), Hw(0.5, 1.0, 0.05), V(1.0, 1.9, 0.05), V(1.3, 2.1, 0.15), V(1.35, 1.5, 0.1), V(0.95, 1.2, -0.05), LA, LV],
  airR: [V(0, 4.75, 0.02), V(0, 3.6, 0.03), V(0, 2.8, 0.02), V(-0.35, 2.5, 0.01), V(-0.7, 2.2, -0.02), V(-1.0, 1.8, 0.0), V(-1.15, 1.2, 0.05)],
  airL: [V(0, 4.75, 0.02), V(0, 3.6, 0.03), V(0, 2.8, 0.02), V(0.35, 2.52, 0.01), V(0.66, 2.25, -0.02), V(0.95, 1.85, 0.0), V(1.1, 1.25, 0.05)],
  airR2: [V(0, 4.75, 0.02), V(0, 3.0, 0.03), V(-0.5, 2.35, 0.0), V(-1.05, 2.6, 0.1), V(-1.3, 2.9, 0.05)],
  airL2: [V(0, 4.75, 0.02), V(0, 3.0, 0.03), V(0.5, 2.4, 0.0), V(1.0, 2.6, 0.1), V(1.2, 2.95, 0.05)],
  portal: [V(0.0, -2.3, 0.3), V(0.05, -1.6, 0.1), V(-0.05, -0.95, 0.15), V(-0.35, -0.45, 0.25), V(-0.75, -0.1, 0.35), V(-1.1, 0.05, 0.3)],
  hepatic: [V(-1.0, 0.1, 0.25), V(-0.6, 0.15, 0.1), V(-0.25, 0.25, -0.05), Hw(-0.48, -0.7, -0.22), RA],
  bile: [V(-0.9, 0.0, 0.4), V(-0.8, -0.35, 0.65), V(-0.8, -0.55, 0.85), V(-0.55, -0.7, 0.5), V(-0.42, -0.85, 0.25), V(-0.5, -1.0, 0.15)],
  esoph: ESO_PTS,
  stomach: STOMACH_PTS,
  duo: [V(-0.05, -0.62, 0.36), V(-0.38, -0.72, 0.25), V(-0.52, -1.0, 0.15), V(-0.42, -1.3, 0.12)],
  si: SI_PTS, colon: COLON_PTS,
  pancDuct: [...PANC_PTS].reverse().concat([V(-0.45, -1.02, 0.12)]),
  insulin: [V(0.55, -0.88, -0.2), V(0.4, -0.75, 0.0), V(0.05, -0.85, 0.12), V(-0.35, -0.45, 0.25), V(-0.75, -0.1, 0.35)],
  splenicIn: [V(0.12, -0.6, -0.5), V(0.6, -0.45, -0.55), V(1.1, -0.3, -0.55), V(1.45, -0.1, -0.45), V(1.6, 0.1, -0.4)],
  splenicOut: [V(1.55, -0.25, -0.4), V(1.1, -0.55, -0.4), V(0.55, -0.75, -0.25), V(0.05, -0.85, 0.12), V(-0.35, -0.45, 0.25), V(-0.75, -0.1, 0.35)]
};
for (const id of ['rein-droit', 'rein-gauche']) {
  const k = organs[id]; const s = Math.sign(k.base.x);
  P['renalA_' + id] = [V(0.12, 0.6, -0.4), V(0.25, -0.5, -0.5), V(0.12, k.base.y + 0.3, -0.5), V(0.1, k.base.y + 0.05, -0.5), V(s * 0.35, k.base.y + 0.02, -0.55), k.base.clone().add(V(-s * 0.05, 0.05, 0))];
  P['renalV_' + id] = [k.base.clone().add(V(-s * 0.05, -0.08, 0)), V(s * 0.3, k.base.y - 0.06, -0.48), V(-0.26, k.base.y - 0.06, -0.45), V(-0.3, -0.5, -0.4), V(-0.22, 0.2, -0.05), Hw(-0.48, -0.7, -0.22)];
  P['urine_' + id] = [k.base.clone().add(V(-s * 0.05, 0, 0)), ...URETER[id], V(s * 0.08, -3.6, 0.3)];
}

/* ================================================================
   Animations « Comment il fonctionne »
   ================================================================ */
const flows = [];
function flow(pts, opts) { const f = new Flow(pts, opts); flows.push(f); return f; }
const BLUE = '#4F72C9', REDP = '#E63946';
const pulmColor = (u) => (u < 0.42 ? BLUE : u < 0.62 ? (u < 0.52 ? '#8F6FC0' : '#D9506A') : REDP);

const ANIM = {
  coeur: {
    view: { target: V(0, 0.4, 0), dist: 16.5 }, involved: ['coeur', 'poumon-droit', 'poumon-gauche'], semi: ['poumon-droit', 'poumon-gauche'], decor: ['vaisseaux'],
    make() {
      return [
        flow(P.aortaOut, { count: 46, colors: [REDP], speed: 0.07, size: 0.06 }),
        flow(P.carotid, { count: 22, colors: [REDP], speed: 0.1, size: 0.055 }),
        flow(P.ivc, { count: 40, colors: [BLUE], speed: 0.07, size: 0.06 }),
        flow(P.svc, { count: 22, colors: [BLUE], speed: 0.1, size: 0.055 }),
        flow(P.pulmR, { count: 30, speed: 0.09, size: 0.055, colorAt: pulmColor }),
        flow(P.pulmL, { count: 30, speed: 0.09, size: 0.055, colorAt: pulmColor })
      ];
    },
    update(t, dt, fl) {
      const p = (t % 0.9) / 0.9;
      const pulse = Math.exp(-(((p - 0.1) / 0.06) ** 2)) + 0.65 * Math.exp(-(((p - 0.34) / 0.06) ** 2));
      organs.coeur.model.scale.setScalar(HS * (1 - 0.075 * pulse));
      for (const f of fl) f.update(dt, 0.35 + 2.1 * pulse);
      return Math.floor(t / 4.2) % 3;
    },
    reset() { organs.coeur.model.scale.setScalar(HS); }
  },
  poumons: {
    view: { target: V(0, 2.1, 0), dist: 10.5 }, involved: ['poumon-droit', 'poumon-gauche'], decor: ['trachee'],
    make() {
      return [flow(P.airR, { count: 26, colors: ['#7CC4F0'], speed: 0.16, size: 0.06 }), flow(P.airL, { count: 26, colors: ['#7CC4F0'], speed: 0.16, size: 0.06 }),
        flow(P.airR2, { count: 16, colors: ['#7CC4F0'], speed: 0.16, size: 0.055 }), flow(P.airL2, { count: 16, colors: ['#7CC4F0'], speed: 0.16, size: 0.055 })];
    },
    breath(t) {
      const c = t % 6.4;
      if (c < 2.6) return { s: easeInOut(c / 2.6), d: 1, ph: 0 };
      if (c < 3.3) return { s: 1, d: 0, ph: 1 };
      if (c < 5.9) return { s: 1 - easeInOut((c - 3.3) / 2.6), d: -1, ph: 2 };
      return { s: 0, d: 0, ph: 2 };
    },
    update(t, dt, fl) {
      const b = this.breath(t);
      for (const id of ['poumon-droit', 'poumon-gauche']) {
        const g = organs[id].group;
        g.scale.set(1 + 0.08 * b.s, 1 + 0.06 * b.s, 1 + 0.08 * b.s);
        g.position.y = organs[id].base.y - 0.06 * b.s;
      }
      for (const f of fl) {
        if (b.d !== 0 && f.dir !== b.d) { f.dir = b.d; f.recolor(b.d > 0 ? '#7CC4F0' : '#A99BCB'); }
        f.update(dt, b.d * 1.4);
      }
      return b.ph;
    },
    reset() { for (const id of ['poumon-droit', 'poumon-gauche']) { organs[id].group.scale.setScalar(1); organs[id].group.position.copy(organs[id].base); } }
  },
  foie: {
    view: { target: V(-0.3, -0.5, 0), dist: 10.5 }, involved: ['foie', 'intestins'], semi: ['intestins'], decor: ['vaisseaux'],
    make() {
      return [flow(P.portal, { count: 30, colors: ['#C9A227', '#8E6BB0', '#9C6B4E', '#C9A227'], speed: 0.12, size: 0.06 }),
        flow(P.hepatic, { count: 18, colors: [BLUE], speed: 0.12, size: 0.055 }),
        flow(P.bile, { count: 14, colors: ['#7CB66A'], speed: 0.08, size: 0.05 })];
    },
    update(t, dt, fl) { for (const f of fl) f.update(dt); return Math.floor(t / 4) % 3; },
    reset() {}
  },
  estomac: {
    view: { target: V(0.4, 0.7, 0), dist: 12 }, involved: ['estomac'], decor: [],
    make() {
      return [flow(P.esoph, { count: 10, colors: ['#E3B26B'], speed: 0.09, size: 0.07 }),
        flow(P.stomach, { count: 44, colors: ['#E3B26B', '#D9A05B', '#EBC27E'], speed: 0.03, size: 0.075, jitter: 0.16 }),
        flow(P.duo, { count: 8, colors: ['#D9A05B'], speed: 0.07, size: 0.05 })];
    },
    update(t, dt, fl) {
      const o = organs.estomac;
      o.wave.uWaveAmp.value = 0.06; o.wave.uWaveTime.value += dt * 4.2; o.wave.uWaveK.value = 22;
      fl[0].update(dt); fl[1].update(dt, 1 + 0.8 * Math.sin(t * 2.2)); fl[2].update(dt);
      return Math.floor(t / 4) % 3;
    },
    reset() { organs.estomac.wave.uWaveAmp.value = 0; }
  },
  rate: {
    view: { target: V(1.0, -0.3, 0), dist: 8 }, involved: ['rate'], decor: ['vaisseaux'],
    make() {
      return [flow(P.splenicIn, { count: 24, colors: [REDP, REDP, '#6B2A2A'], speed: 0.1, size: 0.055, trap: { every: 3, at: 0.86 } }),
        flow(P.splenicOut, { count: 20, colors: [BLUE], speed: 0.1, size: 0.05 })];
    },
    update(t, dt, fl) { for (const f of fl) f.update(dt); return Math.floor(t / 4) % 3; },
    reset() {}
  },
  pancreas: {
    view: { target: V(0.45, -0.8, 0), dist: 8 }, involved: ['pancreas'], decor: [],
    make() {
      return [flow(P.pancDuct, { count: 22, colors: ['#9BC53D'], speed: 0.09, size: 0.05 }),
        flow(P.insulin, { count: 16, colors: ['#1B998B'], speed: 0.1, size: 0.05 })];
    },
    update(t, dt, fl) { fl[0].update(dt); fl[1].update(dt); return Math.floor(t / 4.5) % 2; },
    reset() {}
  },
  reins: {
    view: { target: V(0, -2.3, 0), dist: 11 }, involved: ['rein-droit', 'rein-gauche', 'vessie'], decor: ['vaisseaux', 'ureteres'],
    make() {
      const f = [];
      for (const id of ['rein-droit', 'rein-gauche']) {
        f.push(flow(P['renalA_' + id], { count: 18, colors: [REDP], speed: 0.1, size: 0.05 }));
        f.push(flow(P['renalV_' + id], { count: 14, colors: [BLUE], speed: 0.1, size: 0.05 }));
        f.push(flow(P['urine_' + id], { count: 7, colors: ['#E9B949'], speed: 0.06, size: 0.06 }));
      }
      return f;
    },
    update(t, dt, fl) {
      for (const f of fl) f.update(dt);
      organs.vessie.group.scale.setScalar(1 + 0.12 * ((t % 12) / 12));
      return Math.floor(t / 4) % 3;
    },
    reset() { organs.vessie.group.scale.setScalar(1); }
  },
  intestins: {
    view: { target: V(0, -2.3, 0), dist: 10 }, involved: ['intestins'], decor: [],
    make() {
      return [flow(P.si, { count: 70, colors: ['#E3B26B', '#EBC27E'], speed: 0.018, size: 0.065, tension: 0.5 }),
        flow(P.colon, { count: 36, colors: ['#9C6B4E', '#B07A55'], speed: 0.022, size: 0.08 })];
    },
    update(t, dt, fl) {
      const o = organs.intestins;
      o.wave.uWaveAmp.value = 0.04; o.wave.uWaveTime.value += dt * 3.2; o.wave.uWaveK.value = 60;
      for (const f of fl) f.update(dt);
      return Math.floor(t / 4) % 3;
    },
    reset() { organs.intestins.wave.uWaveAmp.value = 0; }
  },
  vessie: {
    view: { target: V(0, -2.5, 0), dist: 10 }, involved: ['vessie', 'rein-droit', 'rein-gauche'], semi: ['rein-droit', 'rein-gauche'], decor: ['ureteres'],
    make() {
      return [flow(P['urine_rein-droit'], { count: 8, colors: ['#E9B949'], speed: 0.07, size: 0.065 }),
        flow(P['urine_rein-gauche'], { count: 8, colors: ['#E9B949'], speed: 0.07, size: 0.065 })];
    },
    update(t, dt, fl) {
      const c = t % 12;
      const fill = c < 10.5 ? c / 10.5 : 1 - (c - 10.5) / 1.5;
      organs.vessie.group.scale.set(1 + 0.32 * fill, 1 + 0.42 * fill, 1 + 0.32 * fill);
      for (const f of fl) f.update(dt, c < 10.5 ? 1 : 0.2);
      return fill < 0.38 ? 0 : fill < 0.82 || c > 10.5 ? (c > 10.5 ? 2 : 1) : 2;
    },
    reset() { organs.vessie.group.scale.setScalar(1); }
  }
};
const animKey = (id) => (id.startsWith('poumon') ? 'poumons' : id.startsWith('rein') ? 'reins' : id);

/* ================================================================
   Greffe : glacière et receveur
   ================================================================ */
const COOLER_POS = V(5.1, -0.9, 0.4);
const RECEIVER_POS = V(9.7, 0, 0);
function labelTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#ffffff';
  x.beginPath(); x.roundRect(8, 8, 1008, 240, 60); x.fill();
  // flocon
  x.save(); x.translate(128, 128); x.strokeStyle = '#1B998B'; x.lineWidth = 14; x.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    x.rotate(Math.PI / 3);
    x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -82); x.stroke();
    x.beginPath(); x.moveTo(0, -50); x.lineTo(-22, -70); x.moveTo(0, -50); x.lineTo(22, -70); x.stroke();
  }
  x.restore();
  x.fillStyle = '#13315C';
  x.font = '800 74px Montserrat, Arial, sans-serif';
  x.textBaseline = 'middle';
  x.fillText('Organe', 250, 92);
  x.fillText('pour greffe', 250, 172);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const cooler = new THREE.Group();
{
  const bodyMat = new THREE.MeshToonMaterial({ color: '#6FB3EA', gradientMap, transparent: true, opacity: 0.3, depthWrite: false });
  const box = new THREE.Mesh(new RoundedBoxGeometry(2.0, 1.3, 1.3, 5, 0.16), bodyMat);
  box.renderOrder = 4;
  const edge = new THREE.Mesh(new RoundedBoxGeometry(2.0, 1.3, 1.3, 5, 0.16), makeOutline('#1E5E99', 0.03));
  const base = new THREE.Mesh(new RoundedBoxGeometry(2.04, 0.22, 1.34, 4, 0.08), new THREE.MeshToonMaterial({ color: '#2C6FB0', gradientMap }));
  base.position.y = -0.6;
  // glaçons
  const iceMat = new THREE.MeshToonMaterial({ color: '#DDF1FB', gradientMap, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 9; i++) {
    const ice = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.22, 0.28, 2, 0.06), iceMat);
    ice.position.set(-0.7 + (i % 5) * 0.35, -0.4 + (i > 4 ? 0.12 : 0), -0.35 + ((i * 7) % 3) * 0.32);
    ice.rotation.set(i, i * 2, i * 0.5);
    cooler.add(ice);
  }
  const hinge = new THREE.Group(); hinge.position.set(0, 0.65, -0.65);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(2.12, 0.28, 1.42, 4, 0.1), new THREE.MeshToonMaterial({ color: '#F4F8FB', gradientMap }));
  lid.position.set(0, 0.1, 0.65);
  const lidO = new THREE.Mesh(lid.geometry, makeOutline('#9FB3C8', 0.025)); lid.add(lidO);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.06, 10, 30, Math.PI), new THREE.MeshToonMaterial({ color: '#13315C', gradientMap }));
  handle.position.set(0, 0.24, 0.65);
  hinge.add(lid, handle);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.375), new THREE.MeshBasicMaterial({ map: labelTexture(), transparent: true }));
  label.position.set(0, -0.38, 0.665);
  label.renderOrder = 9;
  cooler.add(box, edge, base, hinge, label);
  cooler.userData = { hinge, label };
  cooler.position.copy(COOLER_POS);
  cooler.visible = false;
  scene.add(cooler);
}
const receiver = new THREE.Group();
const receiverTorso = makeTorso();
receiver.add(receiverTorso);
receiver.position.copy(RECEIVER_POS);
receiver.visible = false;
scene.add(receiver);
// position du greffon chez le receveur (rein et pancréas : dans le bas du ventre)
const graftSpot = (o) => {
  if (o.id.startsWith('rein')) return RECEIVER_POS.clone().add(V(-0.95, -2.85, 0.35));
  if (o.id === 'pancreas') return RECEIVER_POS.clone().add(V(0.9, -2.7, 0.35));
  return RECEIVER_POS.clone().add(o.base);
};

/* ================================================================
   Caméra et contrôles
   ================================================================ */
const controls = new OrbitControls(camera, canvas);
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.rotateSpeed = 0.7;
controls.autoRotateSpeed = 2.4;
controls.target.set(0, 0.2, 0);
const cam = { offset: 0 };
const LIMITS = {
  body: { az: [-0.65, 0.65], pol: [1.15, 1.95] },
  free: { az: [-Infinity, Infinity], pol: [0.12, Math.PI - 0.12] },
  soft: { az: [-0.7, 0.7], pol: [1.0, 2.1] }
};
function setLimits(kind, dist) {
  const L = LIMITS[kind];
  controls.minAzimuthAngle = L.az[0]; controls.maxAzimuthAngle = L.az[1];
  controls.minPolarAngle = L.pol[0]; controls.maxPolarAngle = L.pol[1];
  controls.minDistance = dist * 0.55; controls.maxDistance = dist * 1.6;
}
function unlimit() {
  controls.minAzimuthAngle = -Infinity; controls.maxAzimuthAngle = Infinity;
  controls.minPolarAngle = 0; controls.maxPolarAngle = Math.PI;
  controls.minDistance = 0; controls.maxDistance = Infinity;
}
const BODY_VIEW = { target: V(0, 0.22, 0), dist: 19.5 };
let flySeq = 0;
function flyTo(target, dist, offset, limits = 'body', dir = V(0, 0.02, 1), dur = 1.3) {
  const seq = ++flySeq;
  const p0 = camera.position.clone(), t0 = controls.target.clone(), o0 = cam.offset;
  const t1 = target.clone(), p1 = target.clone().add(dir.clone().normalize().multiplyScalar(dist));
  controls.enabled = false;
  controls.autoRotate = false;
  unlimit();
  return tween(dur, (k) => {
    if (seq !== flySeq) return;
    controls.target.lerpVectors(t0, t1, k);
    // trajectoire en arc (rayon interpolé) pour éviter de traverser le corps
    const a = p0.clone().sub(t0), b = p1.clone().sub(t1);
    const len = lerp(a.length(), b.length(), k);
    const d = a.normalize().lerp(b.normalize(), k).normalize().multiplyScalar(len);
    camera.position.copy(controls.target).add(d);
    camera.lookAt(controls.target);
    cam.offset = lerp(o0, offset, k);
  }, easeInOut, 'cam').then(() => {
    if (seq !== flySeq) return;
    setLimits(limits, dist);
    controls.enabled = true;
    controls.update();
  });
}

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
   Interface
   ================================================================ */
const $ = (s) => document.querySelector(s);
const card = $('#card'), tooltip = $('#tooltip');
const state = { mode: 'body', organ: null, tab: null, labels: false, hover: null, playing: false, animT: 0, flows: [], greffeStep: 1, greffeSeq: 0 };

// Liste des organes
const listEl = $('#organList ul');
for (const id of ORDER) {
  const d = ORGANS[id];
  const li = document.createElement('li');
  li.innerHTML = `<button data-id="${id}"><span class="sw" style="background:${d.color}"></span>${d.short}</button>`;
  listEl.appendChild(li);
}
listEl.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) openCard(b.dataset.id); });
listEl.addEventListener('pointerover', (e) => { const b = e.target.closest('button'); if (b && state.mode === 'body') setHover(b.dataset.id, false); });
listEl.addEventListener('pointerout', () => { if (state.mode === 'body') setHover(null); });

// Étiquettes
const labelsEl = $('#labels'), leaders = $('#leaders');
const labelNodes = {};
for (const id of ORDER) {
  const d = ORGANS[id];
  const el = document.createElement('div');
  el.className = 'olabel';
  el.innerHTML = `<span class="sw" style="background:${d.color}"></span>${d.short}`;
  el.style.opacity = 0;
  labelsEl.appendChild(el);
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); dot.setAttribute('r', 6);
  leaders.append(line, dot);
  labelNodes[id] = { el, line, dot };
}
function setLabels(on) {
  state.labels = on;
  $('#btnLabels').setAttribute('aria-pressed', on);
}
$('#btnLabels').addEventListener('click', () => setLabels(!state.labels));
$('#btnReset').addEventListener('click', () => flyTo(BODY_VIEW.target, BODY_VIEW.dist, 0, 'body'));

const tmpV = new THREE.Vector3();
function toScreen(p) { tmpV.copy(p).project(camera); return { x: (tmpV.x + 1) / 2 * W, y: (1 - tmpV.y) / 2 * H, z: tmpV.z }; }
function updateLabels() {
  const show = state.labels && state.mode === 'body';
  const items = [];
  for (const id of ORDER) {
    const n = labelNodes[id];
    if (!show) { n.el.style.opacity = 0; n.line.style.display = 'none'; n.dot.style.display = 'none'; continue; }
    const s = toScreen(organs[id].anchor);
    items.push({ id, s, left: organs[id].anchor.x < -0.01 || id === 'vessie' || id === 'intestins' });
  }
  if (!show) return;
  const cx = toScreen(V(0, 0, 0)).x;
  const half = Math.abs(toScreen(V(2.45, 0.6, 0)).x - toScreen(V(0, 0.6, 0)).x);
  for (const side of [true, false]) {
    const col = items.filter((i) => i.left === side).sort((a, b) => a.s.y - b.s.y);
    let lastY = -1e9;
    for (const it of col) { it.y = Math.max(it.s.y, lastY + 58); lastY = it.y; }
    const over = lastY - (H - 40);
    if (over > 0) for (const it of col) it.y -= over;
    for (const it of col) {
      const n = labelNodes[it.id];
      const lx = side ? cx - half - 40 : cx + half + 40;
      n.el.className = 'olabel' + (side ? ' left' : '');
      n.el.style.left = lx + 'px'; n.el.style.top = it.y + 'px'; n.el.style.opacity = 1;
      n.line.style.display = ''; n.dot.style.display = '';
      n.line.setAttribute('x1', it.s.x); n.line.setAttribute('y1', it.s.y);
      n.line.setAttribute('x2', lx); n.line.setAttribute('y2', it.y);
      n.dot.setAttribute('cx', it.s.x); n.dot.setAttribute('cy', it.s.y);
    }
  }
}

// Tags greffe (Donneur / Glacière / Receveur)
const tagsEl = $('#tags');
const TAGS = [
  { text: 'Donneur', p: V(0, -4.6, 0), cls: '' },
  { text: 'Transport au froid', p: COOLER_POS.clone().add(V(0, -1.05, 0)), cls: 'teal' },
  { text: 'Receveur', p: RECEIVER_POS.clone().add(V(0, -4.6, 0)), cls: '' }
].map((t) => { const el = document.createElement('div'); el.className = 'tag ' + t.cls; el.textContent = t.text; tagsEl.appendChild(el); return { ...t, el }; });
function updateTags() {
  const step = state.tab === 'greffe' && ORGANS[state.organ]?.greffe.ok ? state.greffeStep : 0;
  const vis = [step === 3, step >= 3, step >= 4];
  TAGS.forEach((t, i) => {
    t.el.classList.toggle('on', vis[i]);
    if (vis[i]) { const s = toScreen(t.p); t.el.style.left = s.x + 'px'; t.el.style.top = s.y + 'px'; }
  });
}

/* --- Survol --- */
const raycaster = new THREE.Raycaster();
const mouse = { x: 0, y: 0, sx: 0, sy: 0, inside: false, moved: false };
function stageCoords(e) {
  const r = stage.getBoundingClientRect();
  return { x: (e.clientX - r.left) / stageScale, y: (e.clientY - r.top) / stageScale };
}
function pick() {
  raycaster.setFromCamera({ x: mouse.sx / W * 2 - 1, y: -(mouse.sy / H * 2 - 1) }, camera);
  const hits = raycaster.intersectObjects(pickables, false);
  for (const h of hits) {
    const o = h.object.userData.organ;
    if (o && o.op > 0.5 && h.object.visible) return o.id;
  }
  return null;
}
function setHover(id, fromScene = true) {
  if (state.hover === id) return;
  state.hover = id;
  canvas.classList.toggle('hovering', !!id);
  for (const b of listEl.querySelectorAll('button')) b.classList.toggle('hl', b.dataset.id === id);
  if (id) {
    const d = ORGANS[id];
    tooltip.innerHTML = `<span class="sw" style="background:${d.color}"></span>${d.short}`;
    tooltip.classList.add('on');
    tooltip.dataset.scene = fromScene ? '1' : '';
  } else tooltip.classList.remove('on');
}
canvas.addEventListener('pointermove', (e) => { const p = stageCoords(e); mouse.sx = p.x; mouse.sy = p.y; mouse.inside = true; mouse.moved = true; });
canvas.addEventListener('pointerleave', () => { mouse.inside = false; if (state.mode === 'body') setHover(null); });
let downAt = null;
canvas.addEventListener('pointerdown', (e) => { downAt = stageCoords(e); });
canvas.addEventListener('pointerup', (e) => {
  if (!downAt) return;
  const p = stageCoords(e);
  const moved = Math.hypot(p.x - downAt.x, p.y - downAt.y);
  downAt = null;
  if (moved > 8 || state.mode !== 'body') return;
  mouse.sx = p.x; mouse.sy = p.y;
  const id = pick();
  if (id) openCard(id);
});
addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.mode === 'card') closeCard(); });

/* --- Opacités --- */
function setOpacities(fn, skin = 1) {
  for (const o of Object.values(organs)) o.opTarget = fn(o.id);
  for (const [k, o] of Object.entries(decor)) o.opTarget = fn(k);
  torso.userData.opTarget = skin;
}
function bodyOpacities() { setOpacities((id) => (id === 'vaisseaux' ? 0 : 1), 1); }

/* --- Fiche --- */
const tabs = [...document.querySelectorAll('.tab')];
const panes = Object.fromEntries([...document.querySelectorAll('.pane')].map((p) => [p.dataset.pane, p]));
tabs.forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));
$('#btnBack').addEventListener('click', () => closeCard());

function openCard(id, tab = '3d') {
  const d = ORGANS[id];
  setHover(null);
  state.mode = 'card'; state.organ = id;
  stage.classList.add('card-open');
  $('#cName').textContent = d.name;
  $('#cDot').style.background = d.color;
  $('#cRole').textContent = d.role;
  $('#cFact').textContent = d.fact;
  state.tab = null;
  setTab(tab);
}
function closeCard() {
  leaveTab();
  state.mode = 'body'; state.organ = null; state.tab = null;
  stage.classList.remove('card-open');
  bodyOpacities();
  for (const o of Object.values(organs)) o.glowTarget = 0;
  flyTo(BODY_VIEW.target, BODY_VIEW.dist, 0, 'body');
}
function leaveTab() {
  controls.autoRotate = false;
  setSpinUI(false);
  stopAnim(true);
  resetGreffe();
}
function setTab(tab) {
  if (state.tab === tab) return;
  leaveTab();
  state.tab = tab;
  tabs.forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  for (const [k, p] of Object.entries(panes)) p.classList.toggle('on', k === tab);
  const o = organs[state.organ];
  if (tab === '3d') {
    const comp = o.id.startsWith('poumon') ? ['trachee'] : [];
    setOpacities((id) => (id === o.id ? 1 : comp.includes(id) ? 0.5 : id === 'vaisseaux' ? 0 : 0.035), 0.12);
    const dist = Math.max(3.2, o.radius * 4.3);
    flyTo(o.group.position.clone(), dist, CARD_OFFSET, 'free', V(0.12, 0.08, 1));
  } else if (tab === 'fonction') {
    enterFonction(o);
  } else if (tab === 'greffe') {
    enterGreffe(o);
  }
}

/* --- Onglet 3D --- */
function setSpinUI(on) { $('#btnSpin').classList.toggle('on', on); $('#btnSpin span').textContent = on ? 'Arrêter' : 'Faire tourner'; }
$('#btnSpin').addEventListener('click', () => { controls.autoRotate = !controls.autoRotate; setSpinUI(controls.autoRotate); });
$('#btnFront').addEventListener('click', () => {
  const o = organs[state.organ];
  controls.autoRotate = false; setSpinUI(false);
  flyTo(o.group.position.clone(), camera.position.distanceTo(controls.target), CARD_OFFSET, 'free', V(0.12, 0.08, 1), 0.9);
});

/* --- Onglet fonctionnement --- */
const capList = $('#captions');
function enterFonction(o) {
  const A = ANIM[animKey(o.id)];
  const d = ORGANS[o.id];
  capList.innerHTML = d.captions.map((c, i) => `<li><span class="n">${i + 1}</span><span>${c}</span></li>`).join('');
  capList.classList.add('idle');
  $('#fLegend').innerHTML = d.legend.map(([c, l]) => `<span><i style="background:${c}"></i>${l}</span>`).join('');
  const semi = A.semi || [];
  setOpacities((id) => (A.involved.includes(id) ? (semi.includes(id) ? 0.45 : 1) : A.decor.includes(id) ? 0.9 : id === 'vaisseaux' ? 0 : id === 'trachee' && A.involved.some((x) => x.startsWith('poumon')) ? 0.9 : 0.12), 0.45);
  flyTo(A.view.target, A.view.dist, CARD_OFFSET, 'soft');
  state.anim = A;
  state.flows = A.make();
  state.animT = 0;
  setPlayUI(false);
}
function setPlayUI(on) {
  const b = $('#btnPlay');
  b.classList.toggle('playing', on);
  b.querySelector('span').textContent = on ? 'Pause' : state.animT > 0 ? "Reprendre l'animation" : "Lancer l'animation";
}
$('#btnPlay').addEventListener('click', () => {
  if (!state.anim) return;
  state.playing = !state.playing;
  for (const f of state.flows) f.show(true);
  capList.classList.remove('idle');
  setPlayUI(state.playing);
});
function stopAnim(destroy) {
  state.playing = false;
  if (state.anim) state.anim.reset();
  if (destroy) {
    for (const f of state.flows) { scene.remove(f.mesh); f.mesh.dispose(); const i = flows.indexOf(f); if (i >= 0) flows.splice(i, 1); }
    state.flows = []; state.anim = null;
  }
}
function stepAnim(dt) {
  if (!state.playing || !state.anim) return;
  state.animT += dt;
  const idx = state.anim.update(state.animT, dt, state.flows);
  [...capList.children].forEach((li, i) => li.classList.toggle('on', i === idx));
}

/* --- Onglet greffe --- */
const stepper = $('#stepper');
const ICONS = [
  // 1. le don : ruban vert + cœur dans les mains
  `<svg viewBox="0 0 120 120"><path d="M60 22c-9-12-30-8-30 9 0 14 18 25 30 35 12-10 30-21 30-35 0-17-21-21-30-9z" fill="#E63946"/><path d="M14 78c10-6 22-6 30 0l12 9c4 3 3 9-2 9H38" fill="none" stroke="#13315C" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M106 78c-10-6-22-6-30 0l-12 9c-4 3-3 9 2 9h16" fill="none" stroke="#13315C" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M50 100l10-14 10 14" fill="none" stroke="#1B998B" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  // 2. le prélèvement : organe qui s'élève, étincelles
  `<svg viewBox="0 0 120 120"><ellipse cx="60" cy="96" rx="40" ry="10" fill="#CFE6E2"/><path d="M60 30c-8-11-27-7-27 8 0 12 16 22 27 31 11-9 27-19 27-31 0-15-19-19-27-8z" fill="#E63946"/><path d="M60 78v10M48 82l-4 6M72 82l4 6" stroke="#1B998B" stroke-width="5" stroke-linecap="round"/><path d="M96 22l3 7 7 3-7 3-3 7-3-7-7-3 7-3zM22 40l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#F2C14E"/></svg>`,
  // 3. le transport : glacière
  `<svg viewBox="0 0 120 120"><rect x="18" y="44" width="84" height="56" rx="10" fill="#3D8FD6"/><rect x="14" y="34" width="92" height="16" rx="6" fill="#F4F8FB" stroke="#9FB3C8" stroke-width="3"/><path d="M48 34c0-8 24-8 24 0" fill="none" stroke="#13315C" stroke-width="5"/><g stroke="#fff" stroke-width="4" stroke-linecap="round"><path d="M60 58v30M47 65l26 16M47 81l26-16"/></g></svg>`,
  // 4. la greffe : deux silhouettes reliées
  `<svg viewBox="0 0 120 120"><circle cx="34" cy="38" r="12" fill="#13315C"/><path d="M14 92c0-18 9-30 20-30s20 12 20 30z" fill="#13315C"/><circle cx="86" cy="38" r="12" fill="#1B998B"/><path d="M66 92c0-18 9-30 20-30s20 12 20 30z" fill="#1B998B"/><path d="M86 66c-3-4-10-3-10 3 0 5 6 8 10 11 4-3 10-6 10-11 0-6-7-7-10-3z" fill="#E63946"/><path d="M50 30c6-6 14-6 20 0" fill="none" stroke="#F2C14E" stroke-width="5" stroke-linecap="round"/><path d="M66 24l4 6-7 1" fill="none" stroke="#F2C14E" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
];
stepper.innerHTML = '<span class="bar"></span>' + GREFFE_STEPS.map((s, i) => `<li data-step="${i + 1}"><b>${i + 1}</b><span>${s.title}</span></li>`).join('');
stepper.addEventListener('click', (e) => { const li = e.target.closest('li'); if (li) goStep(+li.dataset.step); });
$('#btnPrev').addEventListener('click', () => goStep(state.greffeStep - 1));
$('#btnNext').addEventListener('click', () => goStep(state.greffeStep + 1));

function enterGreffe(o) {
  const d = ORGANS[o.id];
  const pane = panes.greffe;
  pane.classList.toggle('no-greffe', !d.greffe.ok);
  if (!d.greffe.ok) {
    $('#gNoText').textContent = d.greffe.note;
    setOpacities((id) => (id === o.id ? 1 : id === 'vaisseaux' ? 0 : 0.25), 0.6);
    flyTo(V(o.base.x * 0.5, o.base.y * 0.5 + 0.1, 0), 14, CARD_OFFSET, 'soft');
    return;
  }
  state.greffeStep = 0;
  goStep(1);
}
function stepUI(n) {
  const d = ORGANS[state.organ];
  const s = GREFFE_STEPS[n - 1];
  [...stepper.querySelectorAll('li')].forEach((li, i) => { li.classList.toggle('on', i + 1 === n); li.classList.toggle('done', i + 1 < n); });
  stepper.querySelector('.bar').style.width = `calc(${((n - 1) / 3) * 100}% - ${((n - 1) / 3) * 120}px)`;
  $('#gIco').innerHTML = ICONS[n - 1];
  $('#gTitle').textContent = `${n}. ${s.title}`;
  $('#gText').textContent = s.text(d);
  $('#gChip').textContent = s.chip ? s.chip(d) : '';
  $('#btnPrev').disabled = n <= 1;
  $('#btnNext').disabled = n >= 4;
}
function organTarget(o, n) {
  if (n <= 1) return { p: o.base.clone(), s: 1 };
  if (n === 2) return { p: V(2.3 + o.radius * 0.75, o.base.y * 0.4 + 0.5, 1.0), s: 1 };
  if (n === 3) return { p: COOLER_POS.clone().add(V(0, 0.12, 0.12)), s: Math.min(1, 0.66 / o.radius) };
  return { p: graftSpot(o), s: o.id === 'intestins' ? 0.9 : 1 };
}
function lid(open, dur = 0.6) {
  const h = cooler.userData.hinge;
  const a0 = h.rotation.x, a1 = open ? -1.25 : 0;
  return tween(dur, (k) => { h.rotation.x = lerp(a0, a1, k); }, easeInOut, 'lid');
}
function moveOrgan(o, to, dur = 1.6, lift = 1.2) {
  const g = o.group;
  const p0 = g.position.clone(), s0 = g.scale.x;
  const mid = p0.clone().lerp(to.p, 0.5).add(V(0, lift, 0.6));
  return tween(dur, (k) => {
    const a = p0.clone().lerp(mid, k), b = mid.clone().lerp(to.p, k);
    g.position.copy(a.lerp(b, k));
    g.scale.setScalar(lerp(s0, to.s, k));
  }, easeInOut, 'organ');
}
async function goStep(n) {
  n = clamp(n, 1, 4);
  const o = organs[state.organ];
  if (!o || !ORGANS[o.id].greffe.ok) return;
  const prev = state.greffeStep;
  if (n === prev) return;
  state.greffeStep = n;
  const seq = ++state.greffeSeq;
  stepUI(n);
  // visibilités et opacités
  cooler.visible = n >= 3;
  receiver.visible = n >= 4;
  const others = n <= 2 ? 0.28 : 0.14;
  setOpacities((id) => (id === o.id ? 1 : id === 'vaisseaux' ? 0 : others), n <= 2 ? 0.75 : 0.5);
  o.glowTarget = [0, 0.28, 0.55, 0.3, 0.6][n];
  // caméra
  const views = [null, { t: V(0, 0.25, 0), d: 17.5 }, { t: V(1.3, 0.3, 0.3), d: 18 }, { t: V(2.55, 0.2, 0), d: 20.5 }, { t: V(7.3, 0.2, 0), d: 20.5 }];
  flyTo(views[n].t, views[n].d, CARD_OFFSET, 'soft', V(0, 0.04, 1), 1.5);
  // déplacement de l'organe
  const to = organTarget(o, n);
  if (INSTANT) { o.group.position.copy(to.p); o.group.scale.setScalar(to.s); cooler.userData.hinge.rotation.x = 0; return; }
  if (n === 3 || (prev === 3 && n === 4) || (prev === 4 && n === 3)) {
    await lid(true);
    if (seq !== state.greffeSeq) return;
    await moveOrgan(o, to, 1.7, n === 3 && prev < 3 ? 1.4 : 1.8);
    if (seq !== state.greffeSeq) return;
    await lid(false);
  } else {
    if (prev === 3) lid(false, 0.4);
    await moveOrgan(o, to, prev === 0 ? 0.01 : 1.4, n === 2 ? 0.5 : 0.8);
  }
}
function resetGreffe() {
  state.greffeSeq++;
  state.greffeStep = 0;
  tweens.delete('organ'); tweens.delete('lid');
  for (const o of Object.values(organs)) {
    o.group.position.copy(o.base); o.group.scale.setScalar(1); o.glowTarget = 0;
  }
  cooler.visible = false; receiver.visible = false;
  cooler.userData.hinge.rotation.x = 0;
}

/* ================================================================
   Boucle de rendu
   ================================================================ */
let last = performance.now();
function update(dt) {
  updateTweens(dt);
  if (controls.enabled) controls.update(dt);
  camera.setViewOffset(W, H, cam.offset, 0, W, H);
  // survol
  if (state.mode === 'body' && mouse.inside && mouse.moved) {
    mouse.moved = false;
    setHover(pick());
  }
  if (tooltip.classList.contains('on') && tooltip.dataset.scene) {
    tooltip.style.left = mouse.sx + 'px'; tooltip.style.top = mouse.sy + 'px';
  } else if (tooltip.classList.contains('on') && state.hover) {
    const s = toScreen(organs[state.hover].anchor);
    tooltip.style.left = s.x + 'px'; tooltip.style.top = (s.y - 10) + 'px';
  }
  // opacités, lueurs
  const k = INSTANT ? 1 : Math.min(1, dt * 5);
  for (const o of [...Object.values(organs), ...Object.values(decor)]) {
    o.op += (o.opTarget - o.op) * k;
    o.glow += (o.glowTarget - o.glow) * k;
    const h = state.hover === o.id && state.mode === 'body' ? 1 : 0;
    o.hover += (h - o.hover) * (INSTANT ? 1 : Math.min(1, dt * 10));
    o.applyLook();
  }
  const tu = torso.userData;
  tu.op += (tu.opTarget - tu.op) * k;
  for (const m of tu.mats) m.uniforms.uOpacity.value = tu.op;
  stepAnim(Math.min(dt, 0.05));
  updateLabels();
  updateTags();
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
   Démarrage (+ états préchargés pour les captures)
   ================================================================ */
bodyOpacities();
setLimits('body', BODY_VIEW.dist);
controls.update();
for (const o of [...Object.values(organs), ...Object.values(decor)]) { o.op = o.opTarget; o.applyLook(); }

function applyCaptureState() {
  INSTANT = true;
  const alias = { heart: 'coeur', kidney: 'rein-gauche', lung: 'poumon-droit', liver: 'foie', stomach: 'estomac', bladder: 'vessie', intestine: 'intestins', spleen: 'rate' };
  if (params.get('labels') === '1') setLabels(true);
  let id = params.get('capture');
  if (id) id = alias[id] || id;
  const hov = params.get('hover');
  if (hov && organs[hov]) {
    const s = toScreen(organs[hov].anchor);
    setHover(hov, false);
    void s;
  }
  if (id && organs[id]) {
    const tab = params.get('tab') || '3d';
    openCard(id, tab);
    if (tab === 'greffe' && params.get('step')) goStep(+params.get('step'));
    if (tab === 'fonction' && params.get('t')) {
      $('#btnPlay').click();
      const T = +params.get('t');
      for (let t = 0; t < T; t += 1 / 60) { state.anim.update ? stepAnim(1 / 60) : 0; }
      state.playing = false; setPlayUI(true);
    }
    if (params.get('spin') === '1') $('#btnSpin').click();
  }
  update(0.016);
  INSTANT = false;
  // les tweens restants (aucun) — les fondus sont déjà appliqués
  if (id) { const s = $('#stage'); s.style.setProperty('--x', 0); }
  void card;
}

if (CAPTURE) applyCaptureState();
requestAnimationFrame(() => {
  $('#loading').classList.add('done');
  schedule();
});

// petit accès de débogage
window.__corps = { organs, state, camera, controls, openCard, closeCard, setTab, goStep };
