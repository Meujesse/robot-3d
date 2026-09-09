// Découpe le robot (un seul maillage) en pièces animables : corps, bras droit,
// bras gauche, antenne, œil. Ajoute des animations glTF (wave, cheer, antenna).
import { NodeIO, Accessor, Animation, AnimationChannel, AnimationSampler } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read('../robot-full.glb');
const root = doc.getRoot();
const scene = root.listScenes()[0];
const srcMesh = root.listMeshes()[0];
const srcPrim = srcMesh.listPrimitives()[0];
const srcNode = root.listNodes().find(n => n.getMesh() === srcMesh);
const material = srcPrim.getMaterial();
const buffer = root.listBuffers()[0];

const pos = srcPrim.getAttribute('POSITION').getArray();
const nor = srcPrim.getAttribute('NORMAL').getArray();
const uv = srcPrim.getAttribute('TEXCOORD_0').getArray();
const idx = srcPrim.getIndices().getArray();
const triCount = idx.length / 3;

// Définition des pièces : test sur le centroïde du triangle, pivot de rotation.
const PARTS = {
  armR:    { test: c => c[0] > 0.29 && c[1] < 0.275,  pivot: [0.425, 0.275, 0.055] },
  armL:    { test: c => c[0] < -0.29 && c[1] < 0.33,  pivot: [-0.40, 0.33, -0.02] },
  antenna: { test: c => c[1] > 0.755,                 pivot: [0.255, 0.755, -0.205] },
  eye:     { test: c => c[2] > 0.22 && Math.hypot(c[0] + 0.006, c[1] - 0.46) < 0.105, pivot: [0, 0.453, 0.276] },
  body:    { test: () => true,                        pivot: [0, 0, 0] },
};
const order = ['armR', 'armL', 'antenna', 'eye', 'body'];
const triOf = Object.fromEntries(order.map(k => [k, []]));
for (let t = 0; t < triCount; t++) {
  const a = idx[t * 3], b = idx[t * 3 + 1], c = idx[t * 3 + 2];
  const cen = [0, 1, 2].map(k => (pos[a * 3 + k] + pos[b * 3 + k] + pos[c * 3 + k]) / 3);
  for (const name of order) { if (PARTS[name].test(cen)) { triOf[name].push(t); break; } }
}
for (const k of order) console.log(k, 'triangles:', triOf[k].length);

const eyeMaterial = material.clone().setName('eye_material').setEmissiveFactor([0, 0, 0.01]); // distinct pour survivre au dedup

function buildPart(name) {
  const { pivot } = PARTS[name];
  const tris = triOf[name];
  const remap = new Map();
  const P = [], N = [], U = [], I = [];
  for (const t of tris) {
    for (let k = 0; k < 3; k++) {
      const v = idx[t * 3 + k];
      let nv = remap.get(v);
      if (nv === undefined) {
        nv = remap.size; remap.set(v, nv);
        P.push(pos[v * 3] - pivot[0], pos[v * 3 + 1] - pivot[1], pos[v * 3 + 2] - pivot[2]);
        N.push(nor[v * 3], nor[v * 3 + 1], nor[v * 3 + 2]);
        U.push(uv[v * 2], uv[v * 2 + 1]);
      }
      I.push(nv);
    }
  }
  const mk = (arr, type, comp) => doc.createAccessor().setType(type).setArray(comp === 'u32' ? new Uint32Array(arr) : new Float32Array(arr)).setBuffer(buffer);
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', mk(P, Accessor.Type.VEC3))
    .setAttribute('NORMAL', mk(N, Accessor.Type.VEC3))
    .setAttribute('TEXCOORD_0', mk(U, Accessor.Type.VEC2))
    .setIndices(mk(I, Accessor.Type.SCALAR, 'u32'))
    .setMaterial(name === 'eye' ? eyeMaterial : material);
  const mesh = doc.createMesh(name).addPrimitive(prim);
  const node = doc.createNode(name).setMesh(mesh).setTranslation(pivot);
  return node;
}

const nodes = Object.fromEntries(order.map(k => [k, buildPart(k)]));
// Remplace le maillage d'origine par les pièces, sous le même parent.
const parent = srcNode.getParentNode ? srcNode.getParentNode() : null;
for (const k of order) { if (parent) parent.addChild(nodes[k]); else scene.addChild(nodes[k]); }
srcNode.setMesh(null);
if (!parent) srcNode.dispose();
srcMesh.dispose();

// ---- Animations ----
const deg = d => d * Math.PI / 180;
function quatAxis(axis, angleDeg) {
  const h = deg(angleDeg) / 2, s = Math.sin(h);
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(h)];
}
function addChannel(anim, node, times, quats) {
  const input = doc.createAccessor().setType(Accessor.Type.SCALAR).setArray(new Float32Array(times)).setBuffer(buffer);
  const output = doc.createAccessor().setType(Accessor.Type.VEC4).setArray(new Float32Array(quats.flat())).setBuffer(buffer);
  const sampler = doc.createAnimationSampler().setInput(input).setOutput(output).setInterpolation('LINEAR');
  const channel = doc.createAnimationChannel().setTargetNode(node).setTargetPath('rotation').setSampler(sampler);
  anim.addSampler(sampler).addChannel(channel);
}
const Z = [0, 0, 1], X = [1, 0, 0];
const rest = [0, 0, 0, 1];

// hello : bras droit qui salue + antenne qui frétille
{
  const a = doc.createAnimation('hello');
  addChannel(a, nodes.armR, [0, 0.25, 0.5, 0.75, 1.0, 1.3], [rest, quatAxis(Z, 55), quatAxis(Z, 35), quatAxis(Z, 55), quatAxis(Z, 35), rest]);
  addChannel(a, nodes.antenna, [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.3], [rest, quatAxis(X, 14), quatAxis(X, -14), quatAxis(X, 10), quatAxis(X, -10), quatAxis(X, 4), rest]);
}
// hello_left : bras gauche
{
  const a = doc.createAnimation('hello_left');
  addChannel(a, nodes.armL, [0, 0.25, 0.5, 0.75, 1.0, 1.3], [rest, quatAxis(Z, -55), quatAxis(Z, -35), quatAxis(Z, -55), quatAxis(Z, -35), rest]);
}
// cheer : les deux bras en l'air deux fois
{
  const a = doc.createAnimation('cheer');
  const t = [0, 0.2, 0.45, 0.65, 0.9, 1.2];
  addChannel(a, nodes.armR, t, [rest, quatAxis(Z, 70), quatAxis(Z, 40), quatAxis(Z, 70), quatAxis(Z, 40), rest]);
  addChannel(a, nodes.armL, t, [rest, quatAxis(Z, -70), quatAxis(Z, -40), quatAxis(Z, -70), quatAxis(Z, -40), rest]);
  addChannel(a, nodes.antenna, [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.2], [rest, quatAxis(X, 16), quatAxis(X, -16), quatAxis(X, 16), quatAxis(X, -16), quatAxis(X, 10), quatAxis(X, -6), rest]);
}
// antenna : frétillement seul
{
  const a = doc.createAnimation('antenna');
  addChannel(a, nodes.antenna, [0, 0.15, 0.3, 0.45, 0.6, 0.8, 1.0], [rest, quatAxis(X, 15), quatAxis(X, -15), quatAxis(X, 12), quatAxis(X, -12), quatAxis(X, 5), rest]);
}
// shrug : les deux bras s'écartent un peu (réponse fausse)
{
  const a = doc.createAnimation('shrug');
  const t = [0, 0.3, 0.7, 1.0];
  addChannel(a, nodes.armR, t, [rest, quatAxis(Z, 25), quatAxis(Z, 25), rest]);
  addChannel(a, nodes.armL, t, [rest, quatAxis(Z, -25), quatAxis(Z, -25), rest]);
}
// idle : très léger balancement des bras en boucle
{
  const a = doc.createAnimation('idle');
  const t = [0, 1.5, 3.0];
  addChannel(a, nodes.armR, t, [rest, quatAxis(Z, 6), rest]);
  addChannel(a, nodes.armL, t, [rest, quatAxis(Z, -6), rest]);
  addChannel(a, nodes.antenna, [0, 0.75, 1.5, 2.25, 3.0], [rest, quatAxis(X, 3), rest, quatAxis(X, -3), rest]);
}

// talk : petits mouvements de bras pendant la parole (boucle)
{
  const a = doc.createAnimation('talk');
  addChannel(a, nodes.armR, [0, 0.5, 1.0, 1.6, 2.2, 2.8], [rest, quatAxis(Z, 9), quatAxis(Z, 3), quatAxis(Z, 12), quatAxis(Z, 4), rest]);
  addChannel(a, nodes.armL, [0, 0.4, 0.9, 1.5, 2.1, 2.8], [rest, quatAxis(Z, -4), quatAxis(Z, -11), quatAxis(Z, -3), quatAxis(Z, -9), rest]);
  addChannel(a, nodes.antenna, [0, 0.35, 0.7, 1.4, 2.1, 2.8], [rest, quatAxis(X, 6), quatAxis(X, -5), quatAxis(X, 4), quatAxis(X, -6), rest]);
}

await io.write('../robot-parts-full.glb', doc);
console.log('written robot-parts-full.glb');
