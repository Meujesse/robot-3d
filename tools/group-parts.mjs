// Générique : regroupe les parties Tripo (tripo_part_N) d'un modèle en groupes animables décrits dans un fichier JSON,
// et ajoute des animations glTF (rotations de groupes). Usage : node group-parts.mjs config.json
import { NodeIO, Accessor } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import fs from 'node:fs';

const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(cfg.in);
const root = doc.getRoot();
const scene = root.listScenes()[0];
const buffer = root.listBuffers()[0];

const byNum = new Map();
for (const n of root.listNodes()) { const m = /^tripo_part_(\d+)$/.exec(n.getName()); if (m && n.getMesh()) byNum.set(+m[1], n); }
// découpe d'une partie en deux selon le signe de x (ailes gauche/droite) : "splitX": [num, ...]
for (const num of (cfg.splitX || [])) {
  const src = byNum.get(num); const mesh = src.getMesh(); const prim = mesh.listPrimitives()[0];
  const pos = prim.getAttribute('POSITION').getArray(), nor = prim.getAttribute('NORMAL').getArray(), uv = prim.getAttribute('TEXCOORD_0').getArray(), idx = prim.getIndices().getArray();
  const tris = { L: [], R: [] };
  for (let t = 0; t < idx.length / 3; t++) { const a = idx[t*3], b = idx[t*3+1], c = idx[t*3+2]; const cx = (pos[a*3] + pos[b*3] + pos[c*3]) / 3; tris[cx < 0 ? 'L' : 'R'].push(t); }
  for (const side of ['L', 'R']) {
    const remap = new Map(); const P = [], N = [], U = [], I = [];
    for (const t of tris[side]) for (let k = 0; k < 3; k++) { const v = idx[t*3+k]; let nv = remap.get(v); if (nv === undefined) { nv = remap.size; remap.set(v, nv); P.push(pos[v*3], pos[v*3+1], pos[v*3+2]); N.push(nor[v*3], nor[v*3+1], nor[v*3+2]); U.push(uv[v*2], uv[v*2+1]); } I.push(nv); }
    const mk = (arr, type, u32) => doc.createAccessor().setType(type).setArray(u32 ? new Uint32Array(arr) : new Float32Array(arr)).setBuffer(buffer);
    const p2 = doc.createPrimitive().setAttribute('POSITION', mk(P, Accessor.Type.VEC3)).setAttribute('NORMAL', mk(N, Accessor.Type.VEC3)).setAttribute('TEXCOORD_0', mk(U, Accessor.Type.VEC2)).setIndices(mk(I, Accessor.Type.SCALAR, true)).setMaterial(prim.getMaterial());
    const m2 = doc.createMesh(`tripo_part_${num}${side}`).addPrimitive(p2);
    const n2 = doc.createNode(`tripo_part_${num}${side}`).setMesh(m2); scene.addChild(n2);
    byNum.set(`${num}${side}`, n2); console.log('découpe', num, side, tris[side].length, 'triangles');
  }
  const pn = src.getParentNode(); if (pn) pn.removeChild(src); else scene.removeChild(src); src.setMesh(null); mesh.dispose(); src.dispose(); byNum.delete(num);
}
const assigned = new Set();
for (const g of Object.values(cfg.groups)) for (const p of (g.parts || [])) assigned.add(p);
const rest = [...byNum.keys()].filter(k => !assigned.has(k)).sort((a, b) => a - b);
const nodes = {};
for (const [name, g] of Object.entries(cfg.groups)) {
  const parts = g.rest ? rest : g.parts;
  const parent = g.parent ? nodes[g.parent] : null;
  const pivot = g.pivot;
  const grp = doc.createNode(name).setTranslation(parent ? [pivot[0] - cfg.groups[g.parent].pivot[0], pivot[1] - cfg.groups[g.parent].pivot[1], pivot[2] - cfg.groups[g.parent].pivot[2]] : pivot);
  for (const num of parts) {
    const n = byNum.get(num); if (!n) { console.warn('partie absente', num); continue; }
    const pn = n.getParentNode(); if (pn) pn.removeChild(n); else scene.removeChild(n);
    n.setTranslation([-pivot[0], -pivot[1], -pivot[2]]);
    if (g.material) for (const p of n.getMesh().listPrimitives()) p.getMaterial().setName(g.material).setEmissiveFactor([0, 0, 0.01]);
    grp.addChild(n);
  }
  if (parent) parent.addChild(grp); else scene.addChild(grp);
  nodes[name] = grp;
  console.log(name, 'parties', parts.join(','));
}
for (const n of root.listNodes()) if (!n.getMesh() && n.listChildren().length === 0 && !nodes[n.getName()]) n.dispose();

const deg = d => d * Math.PI / 180;
const AX = { X: [1, 0, 0], Y: [0, 1, 0], Z: [0, 0, 1] };
function quatAxis(axis, a) { const h = deg(a) / 2, s = Math.sin(h); return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(h)]; }
function addChannel(anim, node, times, values, path) {
  const input = doc.createAccessor().setType(Accessor.Type.SCALAR).setArray(new Float32Array(times)).setBuffer(buffer);
  const output = doc.createAccessor().setType(path === 'rotation' ? Accessor.Type.VEC4 : Accessor.Type.VEC3).setArray(new Float32Array(values.flat())).setBuffer(buffer);
  const sampler = doc.createAnimationSampler().setInput(input).setOutput(output).setInterpolation('LINEAR');
  anim.addSampler(sampler).addChannel(doc.createAnimationChannel().setTargetNode(node).setTargetPath(path).setSampler(sampler));
}
// animations : { name: [ { node, axis, t:[...], a:[...] } | { node, path:'translation', t, v:[[x,y,z]...] } ] }
for (const [name, tracks] of Object.entries(cfg.animations)) {
  const a = doc.createAnimation(name);
  for (const tr of tracks) {
    const node = nodes[tr.node]; if (!node) { console.warn('groupe inconnu', tr.node); continue; }
    if (tr.path === 'translation') { const base = node.getTranslation(); addChannel(a, node, tr.t, tr.v.map(v => [base[0] + v[0], base[1] + v[1], base[2] + v[2]]), 'translation'); }
    else if (tr.path === 'scale') addChannel(a, node, tr.t, tr.v, 'scale');
    else addChannel(a, node, tr.t, tr.a.map(x => quatAxis(AX[tr.axis], x)), 'rotation');
  }
}
await io.write(cfg.out, doc);
console.log('écrit', cfg.out, 'animations', root.listAnimations().map(a => a.getName()).join(','));
