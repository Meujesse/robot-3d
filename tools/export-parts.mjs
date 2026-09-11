/* Exporte toutes les primitives d'un GLB (positions, UV, triangles) et leurs
   textures, pour retoucher les textures depuis Python puis les réinjecter. */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import fs from 'fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder': await draco3d.createDecoderModule()});
const [, , src, dir] = process.argv;
fs.mkdirSync(dir, { recursive: true });
const doc = await io.read(src);
const meta = [];
doc.getRoot().listMeshes().forEach((m, k) => {
  const p = m.listPrimitives()[0];
  const tex = p.getMaterial()?.getBaseColorTexture();
  const ext = tex ? (tex.getMimeType() === 'image/png' ? 'png' : tex.getMimeType() === 'image/webp' ? 'webp' : 'jpg') : null;
  if (tex) fs.writeFileSync(`${dir}/${k}.${ext}`, Buffer.from(tex.getImage()));
  fs.writeFileSync(`${dir}/${k}.pos`, Buffer.from(new Float32Array(p.getAttribute('POSITION').getArray()).buffer));
  fs.writeFileSync(`${dir}/${k}.nor`, Buffer.from(new Float32Array(p.getAttribute('NORMAL').getArray()).buffer));
  fs.writeFileSync(`${dir}/${k}.uv`,  Buffer.from(new Float32Array(p.getAttribute('TEXCOORD_0').getArray()).buffer));
  fs.writeFileSync(`${dir}/${k}.idx`, Buffer.from(new Uint32Array(p.getIndices().getArray()).buffer));
  meta.push({ i: k, nom: m.getName(), materiau: p.getMaterial()?.getName(), ext, taille: tex ? tex.getSize() : null, sommets: p.getAttribute('POSITION').getCount() });
});
fs.writeFileSync(`${dir}/meta.json`, JSON.stringify(meta, null, 1));
console.log('exporté', meta.length, 'primitives dans', dir);
