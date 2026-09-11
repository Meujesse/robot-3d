// Nika : regroupe les parties Tripo (tripo_part_N) en pièces animables (corps, bras, antenne, œil, visière)
// et ajoute les mêmes animations glTF que Noki (hello, hello_left, cheer, antenna, shrug, idle, talk, blink).
import { NodeIO, Accessor } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const [,, IN = '../../lisa-3d/nika/nika-tex-full.glb', OUT = '../nika/nika-parts-full.glb'] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(IN);
const root = doc.getRoot();
const scene = root.listScenes()[0];
const buffer = root.listBuffers()[0];

// groupes : liste des parties + pivot (coordonnées du modèle Tripo, y vers le haut, +x = droite écran)
const GROUPS = {
  armR:    { parts: [20, 9, 25, 13, 10, 7, 3, 26], pivot: [0.271, 0.396, 0.022] },
  armL:    { parts: [1, 22, 15, 18, 8, 4, 24],     pivot: [-0.272, 0.395, 0.019] },
  antenna: { parts: [6],                            pivot: [0.227, 0.49, -0.22] },
  eye:     { parts: [16, 12],                       pivot: [0, 0.405, 0.18] },
  brow:    { parts: [21],                           pivot: [0.011, 0.44, -0.005] },   // pivot au centre de la sphère : la visière glisse sur l'œil
  body:    { parts: [],                             pivot: [0, 0, 0] },   // tout le reste
};
const byNum = new Map();
for (const n of root.listNodes()) { const m = /^tripo_part_(\d+)$/.exec(n.getName()); if (m && n.getMesh()) byNum.set(+m[1], n); }
const assigned = new Set();
for (const g of Object.values(GROUPS)) for (const p of g.parts) assigned.add(p);
GROUPS.body.parts = [...byNum.keys()].filter(k => !assigned.has(k)).sort((a, b) => a - b);

// matériaux de l'œil renommés eye_material (émissif piloté par la page) ; chaque partie garde sa texture

const nodes = {};
const allNode = doc.createNode('all');
scene.addChild(allNode);
for (const [name, g] of Object.entries(GROUPS)) {
  const grp = doc.createNode(name).setTranslation(g.pivot);
  for (const num of g.parts) {
    const n = byNum.get(num); if (!n) { console.warn('partie absente', num); continue; }
    const parent = n.getParentNode();
    if (parent) parent.removeChild(n); else scene.removeChild(n);
    n.setTranslation([-g.pivot[0], -g.pivot[1], -g.pivot[2]]);
    if (name === 'eye') for (const p of n.getMesh().listPrimitives()) p.getMaterial().setName(num === 16 ? 'eye_material' : 'eye_ring_material').setEmissiveFactor([0, 0, 0.01]);
    grp.addChild(n);
  }
  allNode.addChild(grp);
  nodes[name] = grp;
  console.log(name, 'parties', g.parts.join(','));
}
// nettoie les nœuds vides restants (racine Tripo)
for (const n of root.listNodes()) if (!n.getMesh() && n.listChildren().length === 0 && !nodes[n.getName()] && n !== allNode) n.dispose();

// ---- Animations (copie de split.mjs) ----
const deg = d => d * Math.PI / 180;
function quatAxis(axis, angleDeg) { const h = deg(angleDeg) / 2, s = Math.sin(h); return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(h)]; }
function addChannel(anim, node, times, quats, path = 'rotation') {
  const input = doc.createAccessor().setType(Accessor.Type.SCALAR).setArray(new Float32Array(times)).setBuffer(buffer);
  const output = doc.createAccessor().setType(path === 'rotation' ? Accessor.Type.VEC4 : Accessor.Type.VEC3).setArray(new Float32Array(quats.flat())).setBuffer(buffer);
  const sampler = doc.createAnimationSampler().setInput(input).setOutput(output).setInterpolation('LINEAR');
  const channel = doc.createAnimationChannel().setTargetNode(node).setTargetPath(path).setSampler(sampler);
  anim.addSampler(sampler).addChannel(channel);
}
const Z = [0, 0, 1], X = [1, 0, 0];
const rest = [0, 0, 0, 1];
{ const a = doc.createAnimation('hello');
  addChannel(a, nodes.armR, [0, 0.25, 0.5, 0.75, 1.0, 1.3], [rest, quatAxis(Z, 85), quatAxis(Z, 60), quatAxis(Z, 85), quatAxis(Z, 60), rest]);
  addChannel(a, nodes.antenna, [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.3], [rest, quatAxis(X, 14), quatAxis(X, -14), quatAxis(X, 10), quatAxis(X, -10), quatAxis(X, 4), rest]); }
{ const a = doc.createAnimation('hello_left');
  addChannel(a, nodes.armL, [0, 0.25, 0.5, 0.75, 1.0, 1.3], [rest, quatAxis(Z, -85), quatAxis(Z, -60), quatAxis(Z, -85), quatAxis(Z, -60), rest]); }
{ const a = doc.createAnimation('cheer'); const t = [0, 0.2, 0.45, 0.65, 0.9, 1.2];
  addChannel(a, nodes.armR, t, [rest, quatAxis(Z, 115), quatAxis(Z, 85), quatAxis(Z, 115), quatAxis(Z, 85), rest]);
  addChannel(a, nodes.armL, t, [rest, quatAxis(Z, -115), quatAxis(Z, -85), quatAxis(Z, -115), quatAxis(Z, -85), rest]);
  addChannel(a, nodes.antenna, [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.2], [rest, quatAxis(X, 16), quatAxis(X, -16), quatAxis(X, 16), quatAxis(X, -16), quatAxis(X, 10), quatAxis(X, -6), rest]); }
{ const a = doc.createAnimation('antenna');
  addChannel(a, nodes.antenna, [0, 0.15, 0.3, 0.45, 0.6, 0.8, 1.0], [rest, quatAxis(X, 15), quatAxis(X, -15), quatAxis(X, 12), quatAxis(X, -12), quatAxis(X, 5), rest]); }
{ const a = doc.createAnimation('shrug'); const t = [0, 0.3, 0.7, 1.0];
  addChannel(a, nodes.armR, t, [rest, quatAxis(Z, 40), quatAxis(Z, 40), rest]);
  addChannel(a, nodes.armL, t, [rest, quatAxis(Z, -40), quatAxis(Z, -40), rest]); }
{ const a = doc.createAnimation('idle'); const t = [0, 1.5, 3.0];
  addChannel(a, nodes.armR, t, [rest, quatAxis(Z, 6), rest]);
  addChannel(a, nodes.armL, t, [rest, quatAxis(Z, -6), rest]);
  addChannel(a, nodes.antenna, [0, 0.75, 1.5, 2.25, 3.0], [rest, quatAxis(X, 3), rest, quatAxis(X, -3), rest]); }
{ const a = doc.createAnimation('talk');
  addChannel(a, nodes.armR, [0, 0.5, 1.0, 1.6, 2.2, 2.8], [rest, quatAxis(Z, 9), quatAxis(Z, 3), quatAxis(Z, 12), quatAxis(Z, 4), rest]);
  addChannel(a, nodes.armL, [0, 0.4, 0.9, 1.5, 2.1, 2.8], [rest, quatAxis(Z, -4), quatAxis(Z, -11), quatAxis(Z, -3), quatAxis(Z, -9), rest]);
  addChannel(a, nodes.antenna, [0, 0.35, 0.7, 1.4, 2.1, 2.8], [rest, quatAxis(X, 6), quatAxis(X, -5), quatAxis(X, 4), quatAxis(X, -6), rest]); }
// tour sur elle-même
{ const a = doc.createAnimation('spin');
  addChannel(a, allNode, [0, 0.35, 0.7, 1.05, 1.4], [rest, quatAxis([0,1,0], 90), quatAxis([0,1,0], 180), quatAxis([0,1,0], 270), quatAxis([0,1,0], 359.9)]); }
// oui / non
{ const a = doc.createAnimation('oui');
  addChannel(a, allNode, [0, 0.2, 0.4, 0.6, 0.8], [rest, quatAxis(X, 11), rest, quatAxis(X, 9), rest]);
  addChannel(a, nodes.antenna, [0, 0.2, 0.4, 0.6, 0.8], [rest, quatAxis(X, -8), rest, quatAxis(X, -6), rest]); }
{ const a = doc.createAnimation('non');
  addChannel(a, allNode, [0, 0.2, 0.4, 0.6, 0.8], [rest, quatAxis([0,1,0], 15), quatAxis([0,1,0], -15), quatAxis([0,1,0], 10), rest]); }
// propulsion : elle s'accroupit puis se soulève d'un coup, sans décoller
{ const a = doc.createAnimation('propulse');
  addChannel(a, allNode, [0, 0.18, 0.36, 0.62, 0.9], [[0,0,0], [0,-0.02,0], [0,0.05,0], [0,0.015,0], [0,0,0]], 'translation');
  addChannel(a, nodes.antenna, [0, 0.18, 0.36, 0.62, 0.9], [rest, quatAxis(X, 12), quatAxis(X, -16), quatAxis(X, 8), rest]);
  addChannel(a, nodes.armR, [0, 0.18, 0.36, 0.9], [rest, quatAxis(Z, -12), quatAxis(Z, 16), rest]);
  addChannel(a, nodes.armL, [0, 0.18, 0.36, 0.9], [rest, quatAxis(Z, 12), quatAxis(Z, -16), rest]); }
// blink : la visière bleue descend sur l'œil puis remonte (nouveau pour Nika)
{ const a = doc.createAnimation('blink');
  addChannel(a, nodes.brow, [0, 0.12, 0.22, 0.4], [rest, quatAxis(X, 24), quatAxis(X, 24), rest]); }

for (const a of root.listAnimations()) if (a.getName() !== 'blink') {
  const dur = Math.max(...a.listSamplers().map(s => { const arr = s.getInput().getArray(); return arr[arr.length - 1]; }));
  addChannel(a, nodes.brow, [0, dur], [rest, rest]);
}
await io.write(OUT, doc);
console.log('écrit', OUT, 'animations', root.listAnimations().map(a => a.getName()).join(','));
