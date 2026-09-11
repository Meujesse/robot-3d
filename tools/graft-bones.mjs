// Greffe des os supplémentaires (ailes…) sur un modèle DÉJÀ riggé par Tripo, et écrit des animations.
// Les poids du nouvel os sont transférés depuis le modèle « par parties » (même objet, autre maillage)
// via une grille de voxels floutée : la transition est lisse, donc aucune déchirure.
// Les animations sont exprimées en axes MONDE (X, Y, Z) et converties dans le repère local de chaque os.
import { NodeIO, Accessor } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import fs from 'node:fs';

const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

/* ---------- maths ---------- */
const qMul = (a, b) => [
  a[3]*b[0] + a[0]*b[3] + a[1]*b[2] - a[2]*b[1],
  a[3]*b[1] - a[0]*b[2] + a[1]*b[3] + a[2]*b[0],
  a[3]*b[2] + a[0]*b[1] - a[1]*b[0] + a[2]*b[3],
  a[3]*b[3] - a[0]*b[0] - a[1]*b[1] - a[2]*b[2]];
const qConj = q => [-q[0], -q[1], -q[2], q[3]];
const qAxis = (ax, deg) => { const h = deg * Math.PI / 360, s = Math.sin(h); return [ax[0]*s, ax[1]*s, ax[2]*s, Math.cos(h)]; };
const qRot = (q, v) => { const t = [2*(q[1]*v[2] - q[2]*v[1]), 2*(q[2]*v[0] - q[0]*v[2]), 2*(q[0]*v[1] - q[1]*v[0])];
  return [v[0] + q[3]*t[0] + q[1]*t[2] - q[2]*t[1], v[1] + q[3]*t[1] + q[2]*t[0] - q[0]*t[2], v[2] + q[3]*t[2] + q[0]*t[1] - q[1]*t[0]]; };
const mMul = (a, b) => { const o = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k*4+r]*b[c*4+k]; o[c*4+r] = s; } return o; };
function mFromTRS(t, q, s) { const [x,y,z,w] = q; return [
  (1-2*(y*y+z*z))*s[0], (2*(x*y+z*w))*s[0], (2*(x*z-y*w))*s[0], 0,
  (2*(x*y-z*w))*s[1], (1-2*(x*x+z*z))*s[1], (2*(y*z+x*w))*s[1], 0,
  (2*(x*z+y*w))*s[2], (2*(y*z-x*w))*s[2], (1-2*(x*x+y*y))*s[2], 0,
  t[0], t[1], t[2], 1]; }
function mInv(m) { // inverse générale 4x4 (affine)
  const r = [m[0],m[4],m[8], m[1],m[5],m[9], m[2],m[6],m[10]];
  const det = r[0]*(r[4]*r[8]-r[5]*r[7]) - r[1]*(r[3]*r[8]-r[5]*r[6]) + r[2]*(r[3]*r[7]-r[4]*r[6]);
  const i = [ (r[4]*r[8]-r[5]*r[7])/det, -(r[1]*r[8]-r[2]*r[7])/det, (r[1]*r[5]-r[2]*r[4])/det,
             -(r[3]*r[8]-r[5]*r[6])/det, (r[0]*r[8]-r[2]*r[6])/det, -(r[0]*r[5]-r[2]*r[3])/det,
              (r[3]*r[7]-r[4]*r[6])/det, -(r[0]*r[7]-r[1]*r[6])/det, (r[0]*r[4]-r[1]*r[3])/det ];
  const t = [m[12], m[13], m[14]];
  const ti = [-(i[0]*t[0]+i[1]*t[1]+i[2]*t[2]), -(i[3]*t[0]+i[4]*t[1]+i[5]*t[2]), -(i[6]*t[0]+i[7]*t[1]+i[8]*t[2])];
  return [i[0],i[3],i[6],0, i[1],i[4],i[7],0, i[2],i[5],i[8],0, ti[0],ti[1],ti[2],1]; }
function mQuat(m) { // quaternion de la partie rotation (échelle supposée uniforme)
  const sx = Math.hypot(m[0],m[1],m[2]), sy = Math.hypot(m[4],m[5],m[6]), sz = Math.hypot(m[8],m[9],m[10]);
  const r = [m[0]/sx,m[1]/sx,m[2]/sx, m[4]/sy,m[5]/sy,m[6]/sy, m[8]/sz,m[9]/sz,m[10]/sz];
  const tr = r[0]+r[4]+r[8]; let q;
  if (tr > 0) { const s = Math.sqrt(tr+1)*2; q = [(r[5]-r[7])/s, (r[6]-r[2])/s, (r[1]-r[3])/s, 0.25*s]; }
  else if (r[0] > r[4] && r[0] > r[8]) { const s = Math.sqrt(1+r[0]-r[4]-r[8])*2; q = [0.25*s, (r[3]+r[1])/s, (r[6]+r[2])/s, (r[5]-r[7])/s]; }
  else if (r[4] > r[8]) { const s = Math.sqrt(1+r[4]-r[0]-r[8])*2; q = [(r[3]+r[1])/s, 0.25*s, (r[7]+r[5])/s, (r[6]-r[2])/s]; }
  else { const s = Math.sqrt(1+r[8]-r[0]-r[4])*2; q = [(r[6]+r[2])/s, (r[7]+r[5])/s, 0.25*s, (r[1]-r[3])/s]; }
  const n = Math.hypot(...q); return q.map(v => v/n); }

/* ---------- masques depuis le modèle « par parties » ---------- */
async function masks(rigDoc) {
  const fromRig = cfg.bones.some(b => b.seedJoints);
  const doc = fromRig ? rigDoc : await io.read(cfg.parts);
  const root = doc.getRoot();
  // nuages de points : soit les parties Tripo, soit le maillage riggé segmenté par os dominant
  const clouds = new Map();          // clé -> Float32Array de positions
  if (fromRig) {
    const sk = root.listSkins()[0], jn = sk.listJoints().map(j => j.getName());
    const prim0 = root.listMeshes()[0].listPrimitives()[0];
    const P = prim0.getAttribute('POSITION').getArray(), JJ = prim0.getAttribute('JOINTS_0').getArray(), WW = prim0.getAttribute('WEIGHTS_0').getArray();
    const dom = new Int32Array(P.length / 3);
    for (let v = 0; v < dom.length; v++) { let best = -1, bi = -1;
      for (let k = 0; k < 4; k++) if (WW[v*4+k] > best) { best = WW[v*4+k]; bi = JJ[v*4+k]; }
      dom[v] = bi; }
    clouds.set('__all__', P);
    for (const b of cfg.bones) {
      const wanted = new Set((b.seedJoints || []).map(n => jn.indexOf(n)));
      const out = [];
      for (let v = 0; v < dom.length; v++) if (wanted.has(dom[v])) out.push(P[v*3], P[v*3+1], P[v*3+2]);
      clouds.set(b.name, new Float32Array(out));
    }
  } else {
    const byNum = new Map();
    for (const n of root.listNodes()) { const m = /^tripo_part_(\d+)$/.exec(n.getName()); if (m && n.getMesh()) byNum.set(+m[1], n); }
    const all = [];
    for (const n of byNum.values()) { const a = n.getMesh().listPrimitives()[0].getAttribute('POSITION').getArray(); for (let i = 0; i < a.length; i++) all.push(a[i]); }
    clouds.set('__all__', new Float32Array(all));
    for (const b of cfg.bones) {
      const out = [];
      for (const num of b.parts) { const n = byNum.get(num); if (!n) { console.warn('partie absente', num); continue; }
        const a = n.getMesh().listPrimitives()[0].getAttribute('POSITION').getArray();
        for (let i = 0; i < a.length; i += 3) { if (b.side && Math.sign(a[i + (b.side.axis === 'x' ? 0 : b.side.axis === 'y' ? 1 : 2)]) !== b.side.sign) continue; out.push(a[i], a[i+1], a[i+2]); } }
      clouds.set(b.name, new Float32Array(out));
    }
  }
  const ALL = clouds.get('__all__');
  let mn = [1e9,1e9,1e9], mx = [-1e9,-1e9,-1e9];
  for (let i = 0; i < ALL.length; i += 3) for (let d = 0; d < 3; d++) { mn[d] = Math.min(mn[d], ALL[i+d]); mx[d] = Math.max(mx[d], ALL[i+d]); }
  const size = mx.map((v, i) => v - mn[i]);
  const N = cfg.grid || 110;
  const h = Math.max(...size) / N;
  const dim = size.map(s => Math.max(2, Math.ceil(s / h) + 4));
  const org = mn.map(v => v - 2 * h);
  const idx = (i, j, k) => (k * dim[1] + j) * dim[0] + i;
  const total = dim[0]*dim[1]*dim[2];
  const occ = new Float32Array(total);
  const fields = {};
  for (const b of cfg.bones) fields[b.name] = new Float32Array(total);
  const cellOf = p => [Math.min(dim[0]-1, Math.max(0, Math.floor((p[0]-org[0])/h))), Math.min(dim[1]-1, Math.max(0, Math.floor((p[1]-org[1])/h))), Math.min(dim[2]-1, Math.max(0, Math.floor((p[2]-org[2])/h)))];
  const pivots = {};
  for (const b of cfg.bones) {
    const c3 = clouds.get(b.name); const nv = c3.length / 3;
    for (let i = 0; i < c3.length; i += 3) fields[b.name][idx(...cellOf([c3[i], c3[i+1], c3[i+2]]))] = 1;
    const ki = (b.pivotAxis || 'z') === 'x' ? 0 : (b.pivotAxis || 'z') === 'y' ? 1 : 2;
    const order = Array.from({ length: nv }, (_, i) => i).sort((u, v) => Math.abs(c3[u*3+ki]) - Math.abs(c3[v*3+ki]));
    const take = order.slice(0, Math.max(1, Math.floor(nv * 0.04)));
    pivots[b.name] = b.pivot || [0,1,2].map(d => take.reduce((s, i) => s + c3[i*3+d], 0) / take.length);
    console.log('masque', b.name, nv, 'sommets, pivot', pivots[b.name].map(v => v.toFixed(3)).join(','));
  }
  for (let i = 0; i < ALL.length; i += 3) occ[idx(...cellOf([ALL[i], ALL[i+1], ALL[i+2]]))] = 1;
  // flou : moyenne sur les cellules occupées, plusieurs passes
  const blur = (f, passes) => {
    let cur = f, next = new Float32Array(total);
    for (let p = 0; p < passes; p++) {
      for (let k = 1; k < dim[2]-1; k++) for (let j = 1; j < dim[1]-1; j++) for (let i = 1; i < dim[0]-1; i++) {
        let s = 0, w = 0;
        for (let dk = -1; dk <= 1; dk++) for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
          const c = idx(i+di, j+dj, k+dk); if (!occ[c]) continue; s += cur[c]; w++; }
        next[idx(i,j,k)] = w ? s / w : cur[idx(i,j,k)];
      }
      const t = cur; cur = next; next = t;
    }
    return cur;
  };
  const out = {};
  for (const b of cfg.bones) {
    const f = blur(fields[b.name], b.blur ?? 4);
    let n = 0, bmn = [1e9,1e9,1e9], bmx = [-1e9,-1e9,-1e9];
    for (let k = 0; k < dim[2]; k++) for (let j = 0; j < dim[1]; j++) for (let i = 0; i < dim[0]; i++) {
      if (f[idx(i,j,k)] <= 0.5) continue; n++;
      const p = [org[0]+(i+0.5)*h, org[1]+(j+0.5)*h, org[2]+(k+0.5)*h];
      for (let d = 0; d < 3; d++) { bmn[d] = Math.min(bmn[d], p[d]); bmx[d] = Math.max(bmx[d], p[d]); }
    }
    console.log('  champ', b.name, 'cellules>0.5', n, 'étendue', bmn.map(v=>v.toFixed(3)).join(',') , '->', bmx.map(v=>v.toFixed(3)).join(','));
    out[b.name] = { field: f, pivot: pivots[b.name] };
  }
  return { fields: out, org, h, dim, idx, mn, mx };
}

/* ---------- programme ---------- */
const doc = await io.read(cfg.in);
const root = doc.getRoot();
const M = await masks(doc);
const scene = root.listScenes()[0];
const buffer = root.listBuffers()[0];
const skin = root.listSkins()[0];
const joints = skin.listJoints();
const jIndex = new Map(joints.map((j, i) => [j.getName(), i]));

// matrices monde de tous les nœuds
const world = new Map();
(function walk(n, m) { const w = mMul(m, mFromTRS(n.getTranslation(), n.getRotation(), n.getScale())); world.set(n, w); for (const c of n.listChildren()) walk(c, w); })
  (scene.listChildren()[0], [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
for (const n of scene.listChildren().slice(1)) (function walk(x, m) { const w = mMul(m, mFromTRS(x.getTranslation(), x.getRotation(), x.getScale())); world.set(x, w); for (const c of x.listChildren()) walk(c, w); })(n, [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);

// alignement bbox parties -> bbox riggée
const prim = root.listMeshes()[0].listPrimitives()[0];
const pos = prim.getAttribute('POSITION').getArray();
let rmn = [1e9,1e9,1e9], rmx = [-1e9,-1e9,-1e9];
for (let i = 0; i < pos.length; i += 3) for (let d = 0; d < 3; d++) { rmn[d] = Math.min(rmn[d], pos[i+d]); rmx[d] = Math.max(rmx[d], pos[i+d]); }
const sameSpace = cfg.bones.some(b => b.seedJoints);
const sc = sameSpace ? [1, 1, 1] : [0,1,2].map(d => (M.mx[d] - M.mn[d]) / (rmx[d] - rmn[d]));
const toParts = p => sameSpace ? p : [0,1,2].map(d => M.mn[d] + (p[d] - rmn[d]) * sc[d]);
console.log('alignement échelle', sc.map(v => v.toFixed(3)).join(','));

// échantillonnage trilinéaire d'un champ
function sample(field, p) {
  const g = [0,1,2].map(d => (p[d] - M.org[d]) / M.h - 0.5);
  const i0 = g.map(v => Math.floor(v)), f = g.map((v, d) => v - i0[d]);
  let s = 0;
  for (let k = 0; k < 2; k++) for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
    const c = [Math.min(M.dim[0]-1, Math.max(0, i0[0]+i)), Math.min(M.dim[1]-1, Math.max(0, i0[1]+j)), Math.min(M.dim[2]-1, Math.max(0, i0[2]+k))];
    s += field[M.idx(...c)] * (i ? f[0] : 1-f[0]) * (j ? f[1] : 1-f[1]) * (k ? f[2] : 1-f[2]);
  }
  return s;
}
const smooth = x => { x = Math.max(0, Math.min(1, x)); return x*x*(3-2*x); };

// création des os greffés
const nVerts = pos.length / 3;
const J = Array.from(prim.getAttribute('JOINTS_0').getArray());
const W = Array.from(prim.getAttribute('WEIGHTS_0').getArray());
const ibmArr = Array.from(skin.getInverseBindMatrices().getArray());
const newBones = [];
for (const b of cfg.bones) {
  const parent = joints[jIndex.get(b.parent)];
  if (!parent) throw new Error('os parent inconnu : ' + b.parent);
  const pw = world.get(parent);
  const pivotParts = M.fields[b.name].pivot;
  const pivot = sameSpace ? pivotParts : [0,1,2].map(d => rmn[d] + (pivotParts[d] - M.mn[d]) / sc[d]);   // repère riggé
  const inv = mInv(pw);
  const localT = [pivot[0]*inv[0] + pivot[1]*inv[4] + pivot[2]*inv[8] + inv[12],
                  pivot[0]*inv[1] + pivot[1]*inv[5] + pivot[2]*inv[9] + inv[13],
                  pivot[0]*inv[2] + pivot[1]*inv[6] + pivot[2]*inv[10] + inv[14]];
  const node = doc.createNode(b.name).setTranslation(localT).setRotation(qConj(mQuat(pw)));
  parent.addChild(node);
  const gi = joints.length + newBones.length;
  newBones.push({ cfg: b, node, index: gi });
  ibmArr.push(1,0,0,0, 0,1,0,0, 0,0,1,0, -pivot[0],-pivot[1],-pivot[2],1);
  console.log('os greffé', b.name, 'sur', b.parent, 'pivot riggé', pivot.map(v => v.toFixed(3)).join(','));
}
// repondération
if (cfg.debugBand) { const [ax, lo2, hi2] = cfg.debugBand; let n = 0, sum = {}, ex = [];
  for (let v = 0; v < nVerts; v++) { const P = [pos[v*3], pos[v*3+1], pos[v*3+2]]; const a = Math.abs(P[ax]);
    if (a < lo2 || a > hi2 || P[1] < 0.5) continue; n++; const q = toParts(P);
    for (const nb of newBones) { const r = sample(M.fields[nb.cfg.name].field, q); sum[nb.cfg.name] = (sum[nb.cfg.name] || 0) + r; }
    if (ex.length < 4) ex.push(P.map(v2 => v2.toFixed(3)).join(',') + ' -> ' + q.map(v2 => v2.toFixed(3)).join(',')); }
  console.log('DEBUG bande', lo2, hi2, 'sommets', n, Object.entries(sum).map(([k, v]) => k + ' brut moyen ' + (v / n).toFixed(3)).join(', '));
  ex.forEach(e => console.log('   ex', e)); }
for (let v = 0; v < nVerts; v++) {
  const p = toParts([pos[v*3], pos[v*3+1], pos[v*3+2]]);
  for (const nb of newBones) {
    const raw = sample(M.fields[nb.cfg.name].field, p);
    const lo = nb.cfg.lo ?? 0.25, hi = nb.cfg.hi ?? 0.75;
    const w = smooth((raw - lo) / (hi - lo));
    if (w <= 0.001) continue;
    let rest = 0;
    for (let k = 0; k < 4; k++) { W[v*4+k] *= (1 - w); rest += W[v*4+k]; }
    // remplace la plus faible influence par le nouvel os
    let worst = 0; for (let k = 1; k < 4; k++) if (W[v*4+k] < W[v*4+worst]) worst = k;
    if (W[v*4+worst] < w) { J[v*4+worst] = nb.index; W[v*4+worst] = w; }
    const s = W[v*4] + W[v*4+1] + W[v*4+2] + W[v*4+3];
    if (s > 0) for (let k = 0; k < 4; k++) W[v*4+k] /= s;
  }
}
prim.setAttribute('JOINTS_0', doc.createAccessor().setType(Accessor.Type.VEC4).setArray(new Uint16Array(J)).setBuffer(buffer));
prim.setAttribute('WEIGHTS_0', doc.createAccessor().setType(Accessor.Type.VEC4).setArray(new Float32Array(W)).setBuffer(buffer));
skin.setInverseBindMatrices(doc.createAccessor().setType(Accessor.Type.MAT4).setArray(new Float32Array(ibmArr)).setBuffer(buffer));
for (const nb of newBones) skin.addJoint(nb.node);

/* ---------- animations (axes monde) ---------- */
const allJoints = [...joints, ...newBones.map(b => b.node)];
const nodeByName = new Map(allJoints.map(j => [j.getName(), j]));
const parentWorldRot = new Map();
for (const j of allJoints) {
  let p = null;
  for (const k of allJoints) if (k.listChildren().includes(j)) p = k;
  const pw = p ? world.get(p) : null;
  parentWorldRot.set(j.getName(), pw ? mQuat(pw) : (world.get(j) ? mQuat(mMul(world.get(j), mInv(mFromTRS(j.getTranslation(), j.getRotation(), j.getScale())))) : [0,0,0,1]));
}
const AX = { X: [1,0,0], Y: [0,1,0], Z: [0,0,1] };
function eased(t, vals, fps = 30) {
  const T = [], V = []; const end = t[t.length-1];
  for (let s = 0; s <= end + 1e-6; s += 1/fps) {
    let k = 0; while (k < t.length - 2 && s > t[k+1]) k++;
    const u = t[k+1] === t[k] ? 0 : Math.max(0, Math.min(1, (s - t[k]) / (t[k+1] - t[k])));
    const w = 0.5 - 0.5 * Math.cos(Math.PI * u);
    T.push(s); V.push(vals[k].map((x, i) => x + (vals[k+1][i] - x) * w));
  }
  return [T, V];
}
function addChannel(anim, node, times, values, path) {
  const input = doc.createAccessor().setType(Accessor.Type.SCALAR).setArray(new Float32Array(times)).setBuffer(buffer);
  const output = doc.createAccessor().setType(path === 'rotation' ? Accessor.Type.VEC4 : Accessor.Type.VEC3).setArray(new Float32Array(values.flat())).setBuffer(buffer);
  const sampler = doc.createAnimationSampler().setInput(input).setOutput(output).setInterpolation('LINEAR');
  anim.addSampler(sampler).addChannel(doc.createAnimationChannel().setTargetNode(node).setTargetPath(path).setSampler(sampler));
}
for (const a of root.listAnimations()) if (cfg.dropExisting) a.dispose();
for (const [name, tracks] of Object.entries(cfg.animations || {})) {
  const anim = doc.createAnimation(name);
  for (const tr of tracks) {
    const node = nodeByName.get(tr.bone);
    if (!node) { console.warn('os inconnu', tr.bone); continue; }
    const qP = parentWorldRot.get(tr.bone), qRest = node.getRotation();
    if (tr.path === 'translation') {
      const base = node.getTranslation(); const inv = qConj(qP);
      let [t, v] = tr.ease === false ? [tr.t, tr.v] : eased(tr.t, tr.v);
      addChannel(anim, node, t, v.map(d => { const l = qRot(inv, d); return [base[0]+l[0], base[1]+l[1], base[2]+l[2]]; }), 'translation');
    } else {
      let [t, v] = tr.ease === false ? [tr.t, tr.a.map(x => [x])] : eased(tr.t, tr.a.map(x => [x]));
      addChannel(anim, node, t, v.map(([deg]) => qMul(qConj(qP), qMul(qAxis(AX[tr.axis], deg), qMul(qP, qRest)))), 'rotation');
    }
  }
}
// tracks ajoutés à TOUTES les animations (ailes qui battent même pendant les animations Tripo)
for (const tr of (cfg.addToAll || [])) {
  const node = nodeByName.get(tr.bone); if (!node) { console.warn('os inconnu', tr.bone); continue; }
  const qP = parentWorldRot.get(tr.bone), qRest = node.getRotation();
  for (const anim of root.listAnimations()) {
    if ((tr.skip || []).includes(anim.getName())) continue;
    if (anim.listChannels().some(c => c.getTargetNode() === node)) continue;   // déjà animé
    let dur = 0; for (const s of anim.listSamplers()) { const arr = s.getInput().getArray(); dur = Math.max(dur, arr[arr.length-1]); }
    if (!dur) continue;
    const per = tr.period || 0.4, fps = 30, T = [], V = [];
    for (let t = 0; t <= dur + 1e-6; t += 1/fps) {
      const u = (t % per) / per;                       // 0..1 sur un cycle
      const a = tr.a[0] + (tr.a[1] - tr.a[0]) * (0.5 - 0.5 * Math.cos(2 * Math.PI * u));
      T.push(t); V.push(qMul(qConj(qP), qMul(qAxis(AX[tr.axis], a), qMul(qP, qRest))));
    }
    addChannel(anim, node, T, V, 'rotation');
  }
}
await io.write(cfg.out, doc);
console.log('écrit', cfg.out, '| os', skin.listJoints().length, '| animations', root.listAnimations().map(a => a.getName()).join(','));
