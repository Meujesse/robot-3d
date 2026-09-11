// Contrôle automatique : pour chaque animation, applique le skinning sur un échantillon d'arêtes
// et mesure l'étirement maximal. Une arête étirée plus de 3x signale une animation cassée.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(process.argv[2]);
const root = doc.getRoot();
const scene = root.listScenes()[0];
const skin = root.listSkins()[0];
const joints = skin.listJoints();
const ibm = skin.getInverseBindMatrices().getArray();
const prim = root.listMeshes()[0].listPrimitives()[0];
const POS = prim.getAttribute('POSITION').getArray();
const JJ = prim.getAttribute('JOINTS_0').getArray(), WW = prim.getAttribute('WEIGHTS_0').getArray();
const idx = prim.getIndices().getArray();
const mMul = (a, b) => { const o = new Float64Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k*4+r]*b[c*4+k]; o[c*4+r] = s; } return o; };
const mTRS = (t, q, s) => { const [x,y,z,w] = q; return new Float64Array([
  (1-2*(y*y+z*z))*s[0], (2*(x*y+z*w))*s[0], (2*(x*z-y*w))*s[0], 0,
  (2*(x*y-z*w))*s[1], (1-2*(x*x+z*z))*s[1], (2*(y*z+x*w))*s[1], 0,
  (2*(x*z+y*w))*s[2], (2*(y*z-x*w))*s[2], (1-2*(x*x+y*y))*s[2], 0, t[0], t[1], t[2], 1]); };
// échantillon d'arêtes
const nTri = idx.length / 3, step = Math.max(1, Math.floor(nTri / 12000));
const edges = [];
for (let t = 0; t < nTri; t += step) { const a = idx[t*3], b = idx[t*3+1];
  const d = Math.hypot(POS[a*3]-POS[b*3], POS[a*3+1]-POS[b*3+1], POS[a*3+2]-POS[b*3+2]);
  if (d > 1e-6) edges.push([a, b, d]); }
const verts = new Set(); for (const [a, b] of edges) { verts.add(a); verts.add(b); }
const vlist = [...verts];
const nodes = [];
(function walk(n) { nodes.push(n); for (const c of n.listChildren()) walk(c); })(scene.listChildren()[0]);
for (const n of scene.listChildren().slice(1)) (function walk(x) { nodes.push(x); for (const c of x.listChildren()) walk(c); })(n);
const parentOf = new Map();
for (const n of nodes) for (const c of n.listChildren()) parentOf.set(c, n);
const jIndex = new Map(joints.map((j, i) => [j, i]));
function poseAt(anim, time) {
  const trs = new Map(nodes.map(n => [n, { t: [...n.getTranslation()], r: [...n.getRotation()], s: [...n.getScale()] }]));
  if (anim) for (const ch of anim.listChannels()) {
    const n = ch.getTargetNode(), path = ch.getTargetPath(), sp = ch.getSampler();
    const T = sp.getInput().getArray(), V = sp.getOutput().getArray();
    const nc = path === 'rotation' ? 4 : 3;
    let i = 0; while (i < T.length - 2 && time > T[i+1]) i++;
    const u = T[i+1] === T[i] ? 0 : Math.max(0, Math.min(1, (time - T[i]) / (T[i+1] - T[i])));
    const out = []; for (let k = 0; k < nc; k++) out.push(V[i*nc+k] * (1-u) + V[(i+1)*nc+k] * u);
    if (path === 'rotation') { const l = Math.hypot(...out); for (let k = 0; k < 4; k++) out[k] /= l || 1; trs.get(n).r = out; }
    else if (path === 'translation') trs.get(n).t = out; else trs.get(n).s = out;
  }
  const world = new Map();
  const calc = n => { if (world.has(n)) return world.get(n); const l = trs.get(n); const m = mTRS(l.t, l.r, l.s);
    const p = parentOf.get(n); const w = p ? mMul(calc(p), m) : m; world.set(n, w); return w; };
  const sk = joints.map((j, i) => { const w = calc(j); const b = new Float64Array(16); for (let k = 0; k < 16; k++) b[k] = ibm[i*16+k]; return mMul(w, b); });
  const out = new Map();
  for (const v of vlist) {
    const p = [POS[v*3], POS[v*3+1], POS[v*3+2]]; const o = [0,0,0];
    for (let k = 0; k < 4; k++) { const w = WW[v*4+k]; if (w < 1e-4) continue; const m = sk[JJ[v*4+k]];
      for (let d = 0; d < 3; d++) o[d] += w * (m[d]*p[0] + m[4+d]*p[1] + m[8+d]*p[2] + m[12+d]); }
    out.set(v, o);
  }
  return out;
}
console.log('arêtes testées', edges.length);
for (const anim of root.listAnimations()) {
  let dur = 0; for (const s of anim.listSamplers()) { const a = s.getInput().getArray(); dur = Math.max(dur, a[a.length-1]); }
  let worst = 0, worstT = 0, over = 0;
  for (let f = 0; f <= 16; f++) {
    const t = dur * f / 16; const P = poseAt(anim, t);
    const all = [];
    for (const [a, b, d0] of edges) { const A = P.get(a), B = P.get(b);
      all.push(Math.hypot(A[0]-B[0], A[1]-B[1], A[2]-B[2]) / d0); }
    all.sort((x, y) => x - y);
    const mx = all[Math.floor(all.length * 0.999)];
    if (mx > 2.2) over++;
    if (mx > worst) { worst = mx; worstT = t; }
  }
  console.log((anim.getName() + '                         ').slice(0, 26), 'durée', dur.toFixed(2), 'étirement p99,9', worst.toFixed(2), 'x à t=' + worstT.toFixed(2), over ? `  ⚠ ${over}/17 images suspectes` : '  ok');
}
