// Exporte la texture de base et la géométrie (positions, UV, triangles) d'un GLB,
// pour peindre dans la texture depuis Python.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import fs from 'fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder': await draco3d.createDecoderModule()});
const [ , , src, out ] = process.argv;
const doc = await io.read(src);
const mat = doc.getRoot().listMaterials().find(m => m.getBaseColorTexture()) || doc.getRoot().listMaterials()[0];
const tex = mat.getBaseColorTexture();
const ext = tex.getMimeType() === 'image/png' ? 'png' : 'jpg';
fs.writeFileSync(`${out}.${ext}`, Buffer.from(tex.getImage()));
const prim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
const pos = prim.getAttribute('POSITION').getArray();
const uv = prim.getAttribute('TEXCOORD_0').getArray();
const nor = prim.getAttribute('NORMAL').getArray();
const idx = prim.getIndices().getArray();
fs.writeFileSync(`${out}.pos`, Buffer.from(new Float32Array(pos).buffer));
fs.writeFileSync(`${out}.uv`,  Buffer.from(new Float32Array(uv).buffer));
fs.writeFileSync(`${out}.nor`, Buffer.from(new Float32Array(nor).buffer));
fs.writeFileSync(`${out}.idx`, Buffer.from(new Uint32Array(idx).buffer));
console.log('texture', tex.getSize().join('x'), ext, '| sommets', pos.length/3, '| triangles', idx.length/3);
