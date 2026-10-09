import * as THREE from 'three';
import { creerScene, construireCepe, construireGirolle, construireAmanite } from './champignons3d.js?v=1';
import { CHAMPIGNONS as PLANTES, ORDRE_SAISONS, NOMS_SAISONS } from './champignons-donnees.js?v=1';

const q=new URLSearchParams(location.search);
const MODE=q.get('mode')==='saisons'?'saisons':'etude';
const $=id=>document.getElementById(id);
if(MODE==='saisons'){document.body.classList.add('mode-saisons');$('sur').textContent='Étape 3 · Suivre';$('titre').textContent='Une année en forêt'}

const S=creerScene($('vue3d'));
const plantes={cepe:construireCepe(),girolle:construireGirolle(),amanite:construireAmanite()};
Object.values(plantes).forEach(p=>{p.visible=false;S.scene.add(p)});
let cle=q.get('plante')||'cepe',saison='printemps',transition=1,coupe=false;

// ----- onglets -----
const photos={cepe:'cepe',girolle:'girolle',amanite:'amanite'};
for(const k of Object.keys(plantes)){const b=document.createElement('button');b.className='onglet';b.dataset.k=k;b.innerHTML=`<img src="img/photos/${photos[k]}.jpg" alt=""><span>${PLANTES[k].nom.split(' (')[0]}</span>`;b.onclick=()=>choisir(k);$('onglets').appendChild(b)}
const EMO={printemps:'🌱',ete:'☀️',automne:'🍄',hiver:'❄️'};
const MOIS=['JAN','FÉV','MARS','AVR','MAI','JUIN','JUIL','AOÛT','SEPT','OCT','NOV','DÉC'];
MOIS.forEach(x=>{const e=document.createElement('span');e.textContent=x;$('mois').appendChild(e)});
[[0,2,'#b8cfdc'],[2,5,'#9fd46a'],[5,8,'#e9cf5a'],[8,11,'#e59a3c'],[11,12,'#b8cfdc']].forEach(([a,b,c])=>{const e=document.createElement('i');e.style.width=((b-a)/12*100)+'%';e.style.background=c;$('bandes').appendChild(e)});
[['Hiver',1],['Printemps',3.5],['Été',6.5],['Automne',9.5]].forEach(([n,m])=>{const e=document.createElement('span');e.textContent=n;e.style.left=(m/12*100)+'%';$('etiqSaisons').appendChild(e)});
const piste=$('piste');let glisseFrise=false;
function mDepuis(e){const r=piste.getBoundingClientRect();return Math.max(0,Math.min(11.99,(e.clientX-r.left)/r.width*12))}
piste.addEventListener('pointerdown',e=>{glisseFrise=true;lecture=false;$('lecture').textContent='▶';piste.setPointerCapture(e.pointerId);mCible=mDepuis(e)});
piste.addEventListener('pointermove',e=>{if(glisseFrise)mCible=mDepuis(e)});
piste.addEventListener('pointerup',()=>{glisseFrise=false});
$('lecture').onclick=()=>{lecture=!lecture;$('lecture').textContent=lecture?'⏸':'▶'};
ORDRE_SAISONS.forEach(s=>{const b=document.createElement('button');b.className='s';b.dataset.s=s;b.innerHTML=`<span>${EMO[s]}</span>${NOMS_SAISONS[s]}`;b.onclick=()=>choisirSaison(s);$('saisons').appendChild(b)});

// ----- caméra animée -----
let anim=null;
function volerVers(pos,cible,ms=900){anim={t0:performance.now(),ms,p0:S.camera.position.clone(),c0:S.ctrl.target.clone(),p1:pos.clone(),c1:cible.clone()}}
function vueDefaut(ms){const v=plantes[cle].userData.vue;S.ctrl.minDistance=v.min;S.ctrl.maxDistance=v.max;const d=MODE==='saisons'?new THREE.Vector3(0,-.15,0):new THREE.Vector3();volerVers(v.pos.clone().add(d).add(MODE==='saisons'?new THREE.Vector3(0,.1,.8):d),v.cible.clone().add(d),ms)}

// ----- pastilles -----
const etiquettes=[];
function monde(def){const [obj,loc,t]=def;const G=plantes[cle];
 if(!obj)return G.localToWorld(loc.clone());
 obj.updateWorldMatrix(true,false);
 if(loc)return obj.localToWorld(loc.clone());
 return obj.localToWorld(obj.userData.curve.getPointAt(t??.5).clone());}
function construirePastilles(){
 $('pastilles').innerHTML='';etiquettes.length=0;if(MODE==='saisons')return;
 const P=PLANTES[cle],pts=plantes[cle].userData.points;let n=0;
 for(const id of Object.keys(P.etiquettes)){if(!pts[id])continue;n++;const d=document.createElement('div');d.className='pas';d.innerHTML=`<div class="pt">${n}</div><div class="lab">${P.etiquettes[id][0]}</div>`;
  const num=n;d.onclick=()=>selection(id,num,d);$('pastilles').appendChild(d);etiquettes.push({id,d,def:pts[id]})}
}
const vus=new Set();
function selection(id,n,d){
 const [t,x]=PLANTES[cle].etiquettes[id];$('dTitre').textContent=t;$('dTexte').textContent=x;$('dNum').textContent=`${n} / ${etiquettes.length}`;$('dTexte').className='';
 etiquettes.forEach(e=>e.d.classList.toggle('on',e.id===id));d.classList.add('vu');vus.add(cle+id);
 const p=monde(plantes[cle].userData.points[id]);const dir=S.camera.position.clone().sub(S.ctrl.target).normalize();
 const dist=Math.max(plantes[cle].userData.vue.min+.2,S.camera.position.distanceTo(S.ctrl.target)*.72);
 volerVers(p.clone().add(dir.multiplyScalar(dist)),p,800);
}
function projeter(){
 const w=1130,h=900;const v=new THREE.Vector3();
 for(const e of etiquettes){let o=e.def[0],montre=true;while(o){if(!o.visible){montre=false;break}o=o.parent}const p=monde(e.def);v.copy(p).project(S.camera);const vis=montre&&v.z<1&&Math.abs(v.x)<1.05&&Math.abs(v.y)<1.05;e.d.style.pointerEvents=vis?'auto':'none';
  e.d.style.left=((v.x+1)/2*w)+'px';e.d.style.top=((1-v.y)/2*h)+'px';e.d.style.opacity=vis?1:0;}
}

// ----- textes et boutons -----
const LIB_COUPE={cepe:'🔪 Couper en deux',girolle:'🔄 Retourner le chapeau',amanite:'🪏 Déterrer le pied'};
const LIB_FERME={cepe:'↩ Recoller les moitiés',girolle:'↩ Remettre à l\'endroit',amanite:'↩ Remettre en terre'};
const GUIDE={
 etude:{cepe:"Fais-le tourner et clique sur les pastilles. Regarde sous le chapeau : des pores, pas de lames. Puis coupe-le en deux.",girolle:"Retourne-la : dessous, ce ne sont pas des lames mais des plis qui descendent sur le pied.",amanite:"Celle-là, on ne la touche pas pour manger. Déterre le pied : la volve en sac à la base, c'est sa signature."},
 saisons:{cepe:"Fais défiler l'année : le cèpe n'est visible que quelques semaines, mais son mycélium travaille tout le temps.",girolle:"La girolle sort tôt, dès l'été. Regarde quand elle apparaît, et quand elle disparaît.",amanite:"Regarde-la sortir de son œuf à la fin de l'été : à ce stade, on la confond avec une vesse-de-loup."}
};
function majFiche(){const P=PLANTES[cle];$('fNom').textContent=P.nom;$('fLat').textContent=P.latin;$('fFam').textContent=P.famille;$('fVue').textContent='Vue 3D : '+P.vue.toLowerCase();$('piege').innerHTML='⚠️ <b>Confusion possible :</b> '+P.piege;
 $('guideBulle').textContent=GUIDE[MODE][cle];
 if(MODE==='etude'){$('dTitre').textContent='Clique sur une pastille';$('dTexte').textContent='Chaque pastille montre un critère qui permet de reconnaître le champignon : chapeau, dessous, pied, base. Fais-le tourner et zoome avec la molette.';$('dTexte').className='aide';$('dNum').textContent=''}
 $('bCoupe').textContent=(coupe?LIB_FERME:LIB_COUPE)[cle];$('bCoupe').classList.toggle('on',coupe);
 document.querySelectorAll('.onglet').forEach(b=>b.classList.toggle('on',b.dataset.k===cle));
}
function choisir(k){plantes[cle].visible=false;cle=k;const G=plantes[k];G.visible=true;
 coupe=false;G.userData.setCoupe(false,true);G.userData.maj(0);
 S.ombre.visible=false;
 construirePastilles();majFiche();vueDefaut(900);
 if(MODE==='saisons'){plantes[k].userData.annee(mAff);$('dTitre').dataset.s='';afficherSaison(saisonDe(mAff))}
}
const CENTRE={printemps:3.5,ete:6.5,automne:9.5,hiver:.5};
let mCible=3.5,mAff=3.5,lecture=false;
function saisonDe(m){return (m<2||m>=11)?'hiver':m<5?'printemps':m<8?'ete':'automne'}
function afficherSaison(s){if(s===saison&&$('dTitre').dataset.s===s+cle)return;saison=s;const [t,x]=PLANTES[cle].saisons[s];
 $('dTitre').textContent=t;$('dTitre').dataset.s=s+cle;$('dTexte').textContent=x;$('dTexte').className='';$('dNum').textContent=NOMS_SAISONS[s].toUpperCase();
 document.querySelectorAll('.s').forEach(b=>b.classList.toggle('on',b.dataset.s===s));$('pouce').textContent=EMO[s];}
function choisirSaison(s,direct){mCible=CENTRE[s];lecture=false;$('lecture').textContent='▶';if(direct){mAff=mCible;plantes[cle].userData.annee(mAff)}afficherSaison(s)}
$('bCoupe').onclick=()=>{const G=plantes[cle];coupe=!coupe;$('bCoupe').classList.toggle('on',coupe);$('bCoupe').textContent=(coupe?LIB_FERME:LIB_COUPE)[cle];
 G.userData.setCoupe(coupe);
 if(!coupe){vueDefaut();return}
 if(cle==='cepe'){S.ctrl.minDistance=.9;volerVers(new THREE.Vector3(.15,1.1,3.1),new THREE.Vector3(0,.62,0),900)}
 else if(cle==='girolle'){S.ctrl.minDistance=.6;volerVers(new THREE.Vector3(.2,1.5,2.0),new THREE.Vector3(0,.85,.2),900)}
 else{S.ctrl.minDistance=.6;volerVers(new THREE.Vector3(1.2,.55,2.2),new THREE.Vector3(.55,.25,.3),1000)}
};
$('bVue').onclick=()=>vueDefaut();
$('son').onclick=()=>voix.jouer(MODE==='saisons'?'audio/saisons.mp3':'audio/etude.mp3',$('son'));

function neige(on){const n=$('neige');n.innerHTML='';if(!on)return;const r=(a,b)=>a+Math.random()*(b-a);
 for(let i=0;i<70;i++){const f=document.createElement('div');f.className='flocon';f.style.left=r(0,1130)+'px';f.style.setProperty('--d',r(5,11)+'s');f.style.setProperty('--r',-r(0,11)+'s');f.style.setProperty('--x',r(-80,80)+'px');const s=r(3,7);f.style.width=f.style.height=s+'px';n.appendChild(f)}}


// ----- boucle -----
let tPrec=performance.now();let visible=false;let neigeOn=false;
new IntersectionObserver(es=>{for(const e of es)visible=e.isIntersecting&&innerWidth>50}).observe($('vue3d'));
function boucle(now){requestAnimationFrame(boucle);const dt=Math.min(.05,(now-tPrec)/1000);tPrec=now;
 if(document.hidden||!visible){tPrec=now;return}
 if(anim){const k=Math.min(1,(now-anim.t0)/anim.ms);const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;S.camera.position.lerpVectors(anim.p0,anim.p1,e);S.ctrl.target.lerpVectors(anim.c0,anim.c1,e);if(k>=1)anim=null}
 if(MODE==='saisons'){if(lecture){mCible+=dt*1.1;if(mCible>=12)mCible-=12;mAff=mCible}else{let d=mCible-mAff;mAff+=d*Math.min(1,dt*6)}
  plantes[cle].userData.annee(mAff);$('pouce').style.left=(mAff/12*100)+'%';const sn=saisonDe(mAff);if(sn!==saison)afficherSaison(sn);const hiver=(mAff<1.8||mAff>11.2);if(hiver!==neigeOn){neigeOn=hiver;neige(hiver)}}
 plantes[cle].userData.maj&&plantes[cle].userData.maj(dt);
 S.ctrl.update();S.renderer.render(S.scene,S.camera);projeter();
}
S.camera.position.set(0,1.5,5);
choisir(cle);
if(MODE==='saisons')choisirSaison('printemps',true);
requestAnimationFrame(boucle);
window.__labo={S,plantes};
