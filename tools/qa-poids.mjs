import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder': await draco3d.createDecoderModule()});
const ref = await io.read(process.argv[3]);
const doc = await io.read(process.argv[2]);
const names = doc.getRoot().listSkins()[0].listJoints().map(j=>j.getName());
const iw = ['wingL','wingR'].map(n=>names.indexOf(n));
const p1 = doc.getRoot().listMeshes()[0].listPrimitives()[0];
const p0 = ref.getRoot().listMeshes()[0].listPrimitives()[0];
const J=p1.getAttribute('JOINTS_0').getArray(), W=p1.getAttribute('WEIGHTS_0').getArray();
const J0=p0.getAttribute('JOINTS_0').getArray(), W0=p0.getAttribute('WEIGHTS_0').getArray();
const n0 = ref.getRoot().listSkins()[0].listJoints().map(j=>j.getName());
const n = J.length/4;
const stat = new Map();
for(let i=0;i<n;i++){
  let b=-1,bw=0; for(let k=0;k<4;k++) if(W0[i*4+k]>bw){bw=W0[i*4+k];b=J0[i*4+k];}
  let wing=0; for(let k=0;k<4;k++) if(iw.includes(J[i*4+k])) wing+=W[i*4+k];
  const nm=n0[b]||'?'; const s=stat.get(nm)||[0,0,0]; s[0]++; s[1]+=wing; if(wing>0.5)s[2]++; stat.set(nm,s);
}
for(const nm of ['L_UpperarmTwist02','R_UpperarmTwist02','L_ForearmTwist01','R_ForearmTwist01','L_Hand','R_Hand','L_Clavicle','R_Clavicle','Head','Spine01','Spine02','Waist','L_ThighTwist01','L_UpperarmTwist01','R_UpperarmTwist01']){
  const s=stat.get(nm); if(!s){console.log(nm,'—');continue;}
  console.log(`${nm.padEnd(18)} n=${String(s[0]).padStart(6)} poids aile moyen ${(s[1]/s[0]).toFixed(4)}  >50% : ${s[2]}`);
}
