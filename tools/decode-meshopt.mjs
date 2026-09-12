/* Décompresse un GLB meshopt (export Tripo) en GLB simple, lisible par graft-bones.
   Usage : node decode-meshopt.mjs entree.glb sortie.glb */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(process.argv[2]);
for (const e of doc.getRoot().listExtensionsUsed()) if (/meshopt|quantization/.test(e.extensionName)) e.dispose();
await io.write(process.argv[3], doc);
console.log('écrit', process.argv[3]);
