import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(process.argv[2]);
const root = doc.getRoot();
console.log('--- ', process.argv[2]);
console.log('meshes', root.listMeshes().length, 'skins', root.listSkins().length, 'materials', root.listMaterials().length, 'textures', root.listTextures().length);
for (const s of root.listSkins()) {
  const joints = s.listJoints();
  console.log('skin joints:', joints.length);
  const byName = new Map(joints.map((j, i) => [j.getName(), i]));
  // hiérarchie
  const parentOf = new Map();
  for (const j of joints) for (const c of j.listChildren()) parentOf.set(c.getName(), j.getName());
  for (const j of joints) {
    const t = j.getTranslation().map(v => v.toFixed(3)).join(',');
    console.log('  ', (parentOf.get(j.getName()) || 'ROOT').padEnd(22), '->', j.getName().padEnd(24), 'T', t);
  }
}
for (const m of root.listMeshes()) console.log('mesh', m.getName(), 'prims', m.listPrimitives().length, m.listPrimitives().map(p => p.listSemantics().join('+')).join(' | '));
