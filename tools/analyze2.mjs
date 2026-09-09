import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read('../robot-full.glb');
const prim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
const pos = prim.getAttribute('POSITION').getArray(); const n = pos.length/3;
const P = i => [pos[i*3], pos[i*3+1], pos[i*3+2]];
function sect(label, axis, from, to, step, filter) {
  const rows=[]; for (let a=from;a<to;a+=step){ let cnt=0,mn=[9,9,9],mx=[-9,-9,-9]; for(let i=0;i<n;i++){const p=P(i); if(p[axis]<a||p[axis]>=a+step) continue; if(!filter(p)) continue; cnt++; for(let k=0;k<3;k++){mn[k]=Math.min(mn[k],p[k]);mx[k]=Math.max(mx[k],p[k]);}}
    rows.push({at:a.toFixed(2),cnt, x:cnt?mn[0].toFixed(2)+'..'+mx[0].toFixed(2):'', y:cnt?mn[1].toFixed(2)+'..'+mx[1].toFixed(2):'', z:cnt?mn[2].toFixed(2)+'..'+mx[2].toFixed(2):''}); }
  console.log(label); console.table(rows);
}
sect('RIGHT ARM region x>0.30 by y', 1, 0.0, 0.62, 0.02, p=>p[0]>0.30);
sect('LEFT ARM region x<-0.30 by y', 1, 0.0, 0.62, 0.02, p=>p[0]<-0.30);
// eye: front z bins
sect('FRONT z bins (all x,y)', 2, 0.10, 0.35, 0.02, p=>true);
// centroid of z>0.24
let c=[0,0,0],k=0; for(let i=0;i<n;i++){const p=P(i); if(p[2]>0.24){c[0]+=p[0];c[1]+=p[1];c[2]+=p[2];k++;}} console.log('centroid z>0.24', c.map(v=>(v/k).toFixed(3)), k);
// radial distribution around centroid in xy for z>0.18
const cx=c[0]/k, cy=c[1]/k; const bins=new Array(15).fill(0); for(let i=0;i<n;i++){const p=P(i); if(p[2]>0.18){const r=Math.hypot(p[0]-cx,p[1]-cy); const b=Math.min(14,Math.floor(r/0.02)); bins[b]++;}} console.log('radial bins (0.02) z>0.18', bins.join(' '));
