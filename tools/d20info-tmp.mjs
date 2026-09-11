import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder': await draco3d.createDecoderModule()});
const doc = await io.read('../d20/d20.glb');
console.log('maillages', doc.getRoot().listMeshes().length);
doc.getRoot().listMeshes().forEach(m=>{
  m.listPrimitives().forEach(p=>{
    const t=p.getMaterial()?.getBaseColorTexture();
    console.log(' ', m.getName(), p.getAttribute('POSITION').getCount(), 'sommets |', p.getMaterial()?.getName(), t? t.getSize().join('x'):'—');
  });
});
