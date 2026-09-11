// Parties Tripo -> un seul maillage « peau » avec squelette : chaque groupe devient un os, les sommets proches
// d'une articulation sont pondérés entre l'os et son parent (pas de trou, mouvement solidaire du corps).
// Usage : node skin-parts.mjs config.json   (même format que group-parts.mjs + "skin": {"R": 0.1})
import { NodeIO, Accessor } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import fs from 'node:fs';

const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const R_DEFAULT = (cfg.skin && cfg.skin.R) || 0.1;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(cfg.in);
const root = doc.getRoot();
const scene = root.listScenes()[0];
const buffer = root.listBuffers()[0];

// ---- parties ----
const byNum = new Map();
for (const n of root.listNodes()) { const m = /^tripo_part_(\d+)$/.exec(n.getName()); if (m && n.getMesh()) byNum.set(+m[1], n); }
function primData(prim) {
  return { pos: prim.getAttribute('POSITION').getArray(), nor: prim.getAttribute('NORMAL').getArray(), uv: prim.getAttribute('TEXCOORD_0').getArray(), idx: prim.getIndices().getArray(), mat: prim.getMaterial() };
}
function subPrim(d, tris) {
  const remap = new Map(); const P = [], N = [], U = [], I = [];
  for (const t of tris) for (let k = 0; k < 3; k++) { const v = d.idx[t*3+k]; let nv = remap.get(v); if (nv === undefined) { nv = remap.size; remap.set(v, nv); P.push(d.pos[v*3], d.pos[v*3+1], d.pos[v*3+2]); N.push(d.nor[v*3], d.nor[v*3+1], d.nor[v*3+2]); U.push(d.uv[v*2], d.uv[v*2+1]); } I.push(nv); }
  return { pos: new Float32Array(P), nor: new Float32Array(N), uv: new Float32Array(U), idx: new Uint32Array(I), mat: d.mat };
}
// données de chaque partie (clé = numéro ou "12L")
const partData = new Map();
for (const [num, node] of byNum) partData.set(num, primData(node.getMesh().listPrimitives()[0]));
for (const num of (cfg.splitX || [])) {
  const d = partData.get(num); const tris = { L: [], R: [] };
  for (let t = 0; t < d.idx.length / 3; t++) { const a = d.idx[t*3], b = d.idx[t*3+1], c = d.idx[t*3+2]; const cx = (d.pos[a*3] + d.pos[b*3] + d.pos[c*3]) / 3; tris[cx < 0 ? 'L' : 'R'].push(t); }
  partData.set(`${num}L`, subPrim(d, tris.L)); partData.set(`${num}R`, subPrim(d, tris.R)); partData.delete(num);
}
const assigned = new Set(); for (const g of Object.values(cfg.groups)) for (const p of (g.parts || [])) assigned.add(String(p));
const restKeys = [...partData.keys()].filter(k => !assigned.has(String(k)));
const groupOf = new Map(); // partKey -> groupName
for (const [name, g] of Object.entries(cfg.groups)) for (const p of (g.rest ? restKeys : g.parts)) groupOf.set(String(p), name);

// ---- squelette ----
const names = Object.keys(cfg.groups);
const joints = {}; const jointIndex = {};
const skeletonRoot = doc.createNode('skeleton');
scene.addChild(skeletonRoot);
names.forEach((name, i) => {
  const g = cfg.groups[name]; const parent = g.parent ? cfg.groups[g.parent].pivot : [0, 0, 0];
  const j = doc.createNode(name).setTranslation(g.parent ? [g.pivot[0] - parent[0], g.pivot[1] - parent[1], g.pivot[2] - parent[2]] : g.pivot);
  joints[name] = j; jointIndex[name] = i;
});
for (const name of names) { const g = cfg.groups[name]; (g.parent ? joints[g.parent] : skeletonRoot).addChild(joints[name]); }
const ibm = new Float32Array(names.length * 16);
names.forEach((name, i) => { const p = cfg.groups[name].pivot; const m = [1,0,0,0, 0,1,0,0, 0,0,1,0, -p[0],-p[1],-p[2],1]; ibm.set(m, i * 16); });
const skin = doc.createSkin('skin').setSkeleton(skeletonRoot).setInverseBindMatrices(doc.createAccessor().setType(Accessor.Type.MAT4).setArray(ibm).setBuffer(buffer));
for (const name of names) skin.addJoint(joints[name]);
const children = {}; for (const name of names) { const p = cfg.groups[name].parent; if (p) (children[p] = children[p] || []).push(name); }
const parentOf = name => cfg.groups[name].parent || null;
const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const dist = (v, p) => Math.hypot(v[0] - p[0], v[1] - p[1], v[2] - p[2]);

// ---- maillage unique, pondéré ----
const mesh = doc.createMesh('creature');
for (const [key, d] of partData) {
  const gname = groupOf.get(String(key)); if (!gname) continue;
  const g = cfg.groups[gname]; const R = g.R || R_DEFAULT;
  const n = d.pos.length / 3; const J = new Uint16Array(n * 4), W = new Float32Array(n * 4);
  const par = parentOf(gname);
  for (let i = 0; i < n; i++) {
    const v = [d.pos[i*3], d.pos[i*3+1], d.pos[i*3+2]];
    const w = new Map();
    if (par && !g.rigid) { const t = smooth(dist(v, g.pivot) / R); w.set(gname, t); w.set(par, 1 - t); } else w.set(gname, 1);
    for (const c of (children[gname] || [])) { const cg = cfg.groups[c]; if (cg.rigid) continue; const t = 1 - smooth(dist(v, cg.pivot) / (cg.R || R)); if (t > 0) { const wc = 0.5 * t; w.set(c, wc); w.set(gname, (w.get(gname) || 0) - wc); } }
    const entries = [...w.entries()].filter(e => e[1] > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const sum = entries.reduce((s, e) => s + e[1], 0);
    entries.forEach((e, k) => { J[i*4+k] = jointIndex[e[0]]; W[i*4+k] = e[1] / sum; });
  }
  const mk = (arr, type) => doc.createAccessor().setType(type).setArray(arr).setBuffer(buffer);
  const prim = doc.createPrimitive().setAttribute('POSITION', mk(d.pos, Accessor.Type.VEC3)).setAttribute('NORMAL', mk(d.nor, Accessor.Type.VEC3)).setAttribute('TEXCOORD_0', mk(d.uv, Accessor.Type.VEC2))
    .setAttribute('JOINTS_0', mk(J, Accessor.Type.VEC4)).setAttribute('WEIGHTS_0', mk(W, Accessor.Type.VEC4)).setIndices(mk(d.idx, Accessor.Type.SCALAR)).setMaterial(d.mat);
  if (g.material) d.mat.setName(g.material).setEmissiveFactor([0, 0, 0.01]);
  mesh.addPrimitive(prim);
  console.log(gname.padEnd(8), 'partie', String(key).padEnd(4), n, 'sommets');
}
// ---- paupières (quads devant les yeux, os dédié, pivot au bord haut) ----
for (const lid of (cfg.eyelids || [])) {
  const eyeParts = cfg.groups[lid.over].parts.map(String);
  let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (const [key, d] of partData) if (eyeParts.includes(String(key))) for (let i = 0; i < d.pos.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], d.pos[i + k]); mx[k] = Math.max(mx[k], d.pos[i + k]); }
  const pad = lid.pad || 1.35, cx = (mn[0] + mx[0]) / 2, cy = (mn[1] + mx[1]) / 2, w = (mx[0] - mn[0]) * pad, h = (mx[1] - mn[1]) * pad * (lid.tall || 1.2), z = mx[2] + (lid.offset || 0.004);
  const top = cy + h / 2, bot = cy - h / 2, x0 = cx - w / 2, x1 = cx + w / 2;
  // légère courbure : 5 colonnes, z recule sur les bords
  const cols = 6, P = [], N = [], U = [], I = [], J = [], W = [];
  for (let c = 0; c <= cols; c++) { const u = c / cols, x = x0 + (x1 - x0) * u, zz = z - Math.pow((u - 0.5) * 2, 2) * (lid.curve || 0.006);
    for (const [y, v] of [[top, 0], [bot, 1]]) { P.push(x, y, zz); N.push(0, 0, 1); U.push(u, v); } }
  for (let c = 0; c < cols; c++) { const a = c * 2, b = a + 1, cc = a + 2, d = a + 3; I.push(a, b, cc, b, d, cc); }
  const nv = P.length / 3; const jIdx = names.length; names.push(lid.name);
  const jn = doc.createNode(lid.name).setTranslation([cx - cfg.groups[lid.parent].pivot[0], top - cfg.groups[lid.parent].pivot[1], z - cfg.groups[lid.parent].pivot[2]]).setScale([1, 0.02, 1]);
  joints[lid.name] = jn; jointIndex[lid.name] = jIdx; joints[lid.parent].addChild(jn); skin.addJoint(jn);
  const ibm2 = new Float32Array((jIdx + 1) * 16); ibm2.set(skin.getInverseBindMatrices().getArray()); ibm2.set([1,0,0,0, 0,1,0,0, 0,0,1,0, -cx,-top,-z,1], jIdx * 16); skin.getInverseBindMatrices().setArray(ibm2);
  for (let i = 0; i < nv; i++) { J.push(jIdx, 0, 0, 0); W.push(1, 0, 0, 0); }
  const mk = (arr, type) => doc.createAccessor().setType(type).setArray(arr).setBuffer(buffer);
  const mat = doc.createMaterial(lid.name + '_material').setBaseColorFactor([...(lid.color || [0.68, 0.36, 0.19]), 1]).setRoughnessFactor(0.85).setMetallicFactor(0).setDoubleSided(true);
  const prim = doc.createPrimitive().setAttribute('POSITION', mk(new Float32Array(P), Accessor.Type.VEC3)).setAttribute('NORMAL', mk(new Float32Array(N), Accessor.Type.VEC3)).setAttribute('TEXCOORD_0', mk(new Float32Array(U), Accessor.Type.VEC2))
    .setAttribute('JOINTS_0', mk(new Uint16Array(J), Accessor.Type.VEC4)).setAttribute('WEIGHTS_0', mk(new Float32Array(W), Accessor.Type.VEC4)).setIndices(mk(new Uint32Array(I), Accessor.Type.SCALAR)).setMaterial(mat);
  mesh.addPrimitive(prim);
  console.log('paupière', lid.name, 'sur', lid.over, 'centre', cx.toFixed(3), cy.toFixed(3), 'taille', w.toFixed(3), h.toFixed(3));
}
const skinned = doc.createNode('creature').setMesh(mesh).setSkin(skin);
scene.addChild(skinned);
// supprime les anciens nœuds/maillages de parties
for (const [num, node] of byNum) { const m = node.getMesh(); const pn = node.getParentNode(); if (pn) pn.removeChild(node); else scene.removeChild(node); node.setMesh(null); m.dispose(); node.dispose(); }
for (const n of root.listNodes()) if (!n.getMesh() && n.listChildren().length === 0 && !joints[n.getName()] && n !== skeletonRoot) n.dispose();

// ---- animations (avec lissage optionnel "ease") ----
const deg = d => d * Math.PI / 180;
const AX = { X: [1, 0, 0], Y: [0, 1, 0], Z: [0, 0, 1] };
function quatAxis(axis, a) { const h = deg(a) / 2, s = Math.sin(h); return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(h)]; }
function eased(t, vals, fps = 30) { // interpolation cosinus entre clés, rééchantillonnée
  const T = [], V = []; const end = t[t.length - 1];
  for (let s = 0; s <= end + 1e-6; s += 1 / fps) {
    let k = 0; while (k < t.length - 2 && s > t[k + 1]) k++;
    const u = t[k + 1] === t[k] ? 0 : Math.max(0, Math.min(1, (s - t[k]) / (t[k + 1] - t[k]))); const w = 0.5 - 0.5 * Math.cos(Math.PI * u);
    T.push(s); V.push(vals[k].map((x, i) => x + (vals[k + 1][i] - x) * w));
  }
  return [T, V];
}
function addChannel(anim, node, times, values, path) {
  const input = doc.createAccessor().setType(Accessor.Type.SCALAR).setArray(new Float32Array(times)).setBuffer(buffer);
  const output = doc.createAccessor().setType(path === 'rotation' ? Accessor.Type.VEC4 : Accessor.Type.VEC3).setArray(new Float32Array(values.flat())).setBuffer(buffer);
  const sampler = doc.createAnimationSampler().setInput(input).setOutput(output).setInterpolation('LINEAR');
  anim.addSampler(sampler).addChannel(doc.createAnimationChannel().setTargetNode(node).setTargetPath(path).setSampler(sampler));
}
for (const [name, tracks] of Object.entries(cfg.animations)) {
  const a = doc.createAnimation(name);
  for (const tr of tracks) {
    const node = joints[tr.node]; if (!node) { console.warn('os inconnu', tr.node); continue; }
    if (tr.path === 'translation') { const base = node.getTranslation(); let t = tr.t, v = tr.v.map(x => [base[0] + x[0], base[1] + x[1], base[2] + x[2]]); if (tr.ease !== false) [t, v] = eased(t, v); addChannel(a, node, t, v, 'translation'); }
    else if (tr.path === 'scale') { let t = tr.t, v = tr.v; if (tr.ease !== false) [t, v] = eased(t, v); addChannel(a, node, t, v, 'scale'); }
    else { let t = tr.t, v = tr.a.map(x => [x]); if (tr.ease !== false) [t, v] = eased(t, v); addChannel(a, node, t, v.map(x => quatAxis(AX[tr.axis], x[0])), 'rotation'); }
  }
}
await io.write(cfg.out, doc);
console.log('écrit', cfg.out, 'os', names.join(','), 'animations', root.listAnimations().map(a => a.getName()).join(','));
