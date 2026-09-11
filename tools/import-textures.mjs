/* Réinjecte des textures modifiées (fichiers <index>.png) dans un GLB. */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import fs from 'fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder': await draco3d.createDecoderModule()});
const [, , src, dir, out] = process.argv;
const doc = await io.read(src);
let n = 0;
doc.getRoot().listMeshes().forEach((m, k) => {
  const f = `${dir}/${k}.png`;
  if (!fs.existsSync(f)) return;
  const tex = m.listPrimitives()[0].getMaterial()?.getBaseColorTexture();
  if (!tex) return;
  tex.setImage(new Uint8Array(fs.readFileSync(f))).setMimeType('image/png');
  n++;
});
await io.write(out, doc);
console.log('textures remplacées :', n, '| écrit', out);
