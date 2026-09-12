/* occupation du maillage par tranches, pour situer ailes et queue (repère x avant, z côté) */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import { MeshoptDecoder } from 'meshoptimizer';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco3d.createDecoderModule(),'meshopt.decoder':MeshoptDecoder});
const doc=await io.read(process.argv[2]);
const p=doc.getRoot().listMeshes()[0].listPrimitives()[0];
const P=p.getAttribute('POSITION').getArray(), J=p.getAttribute('JOINTS_0').getArray(), W=p.getAttribute('WEIGHTS_0').getArray();
const noms=doc.getRoot().listSkins()[0].listJoints().map(j=>j.getName());
const dom=i=>{let b=-1,bw=0;for(let k=0;k<4;k++)if(W[i*4+k]>bw){bw=W[i*4+k];b=J[i*4+k];}return noms[b];};
console.log('=== vue de dessus (x → colonnes, z → lignes), y > 0.30 : où sont les ailes');
{ const g=Array.from({length:25},()=>Array(50).fill('.'));
  for(let i=0;i<P.length/3;i++){ if(P[i*3+1]<0.30) continue; const c=Math.round((P[i*3]+0.5)*49), r=Math.round((P[i*3+2]+0.5)*24); if(c>=0&&c<50&&r>=0&&r<25) g[r][c]='#'; }
  g.forEach((r,k)=>console.log((k/24-0.5).toFixed(2).padStart(6), r.join(''))); }
console.log('=== os dominants par zone');
const zones={queue:[],aileG:[],aileD:[],tete:[]};
for(let i=0;i<P.length/3;i+=7){ const x=P[i*3],y=P[i*3+1],z=P[i*3+2];
  if(x<-0.12) zones.queue.push(dom(i)); else if(y>0.3&&z<-0.2) zones.aileG.push(dom(i)); else if(y>0.3&&z>0.2) zones.aileD.push(dom(i)); else if(x>0.3&&y>0.4) zones.tete.push(dom(i)); }
for(const [z,l] of Object.entries(zones)){ const c=new Map(); for(const n of l)c.set(n,(c.get(n)||0)+1); console.log(z.padEnd(6), l.length, [...c].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([n,v])=>n+':'+(100*v/l.length).toFixed(0)+'%').join(' ')); }
