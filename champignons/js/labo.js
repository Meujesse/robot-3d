import * as THREE from 'three';
import { creerScene, construireCepe, construireGirolle, construireAmanite } from './champignons3d.js?v=2';
import { CHAMPIGNONS as PLANTES, ORDRE_PHASES as ORDRE_SAISONS, NOMS_PHASES as NOMS_SAISONS } from './champignons-donnees.js?v=2';

const q=new URLSearchParams(location.search);
const MODE=q.get('mode')==='saisons'?'saisons':'etude';
const $=id=>document.getElementById(id);
if(MODE==='saisons'){document.body.classList.add('mode-saisons');$('sur').textContent='Étape 3 · Suivre';$('titre').textContent='Après la pluie'}

const S=creerScene($('vue3d'));
const plantes={cepe:construireCepe(),girolle:construireGirolle(),amanite:construireAmanite()};
Object.values(plantes).forEach(p=>{p.visible=false;S.scene.add(p)});
let cle=q.get('plante')||'cepe',saison='printemps',transition=1,coupe=false;

// ----- onglets -----
const photos={cepe:'cepe',girolle:'girolle',amanite:'amanite'};
for(const k of Object.keys(plantes)){const b=document.createElement('button');b.className='onglet';b.dataset.k=k;b.innerHTML=`<img src="img/photos/${photos[k]}.jpg" alt=""><span>${PLANTES[k].nom.split(' (')[0]}</span>`;b.onclick=()=>choisir(k);$('onglets').appendChild(b)}
const EMO={pluie:'🌧️',pousse:'🌱',point:'🍄',vieux:'🍂'};
const NJ=16;
const MOIS=Array.from({length:NJ},(_,i)=>'J'+i);
MOIS.forEach(x=>{const e=document.createElement('span');e.textContent=x;$('mois').appendChild(e)});
[[0,2,'#8fc0e0'],[2,6,'#9fd46a'],[6,10,'#e9cf5a'],[10,16,'#c9966a']].forEach(([a,b,c])=>{const e=document.createElement('i');e.style.width=((b-a)/NJ*100)+'%';e.style.background=c;$('bandes').appendChild(e)});
[['Pluie',1],['Ça pousse',4],['À point',8],['Trop vieux',13]].forEach(([n,m])=>{const e=document.createElement('span');e.textContent=n;e.style.left=(m/NJ*100)+'%';$('etiqSaisons').appendChild(e)});
const piste=$('piste');let glisseFrise=false;
function mDepuis(e){const r=piste.getBoundingClientRect();return Math.max(0,Math.min(NJ-.01,(e.clientX-r.left)/r.width*NJ))}
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
function estVisible(def){let o=def[0];while(o){if(!o.visible)return false;o=o.parent}return true}
function construirePastilles(){
 $('pastilles').innerHTML='';etiquettes.length=0;if(MODE==='saisons')return;
 const P=PLANTES[cle],pts=plantes[cle].userData.points;let n=0;
 for(const id of Object.keys(P.etiquettes)){if(!pts[id]||!estVisible(pts[id]))continue;n++;const d=document.createElement('div');d.className='pas'+(vus.has(cle+id)?' vu':'');d.innerHTML=`<div class="pt">${n}</div><div class="lab">${P.etiquettes[id][0]}</div>`;
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
const LIB_SOSIE={cepe:'🔍 Comparer : le bolet amer',girolle:'🔍 Comparer : la fausse girolle',amanite:'🔪 Et si on coupe au couteau ?'};
const LIB_SOSIE_OFF={cepe:'↩ Revenir au cèpe',girolle:'↩ Revenir à la girolle',amanite:'↩ Déterrer à la main'};
let sosie=false;
const LIB_FERME={cepe:'↩ Recoller les moitiés',girolle:'↩ Remettre à l\'endroit',amanite:'↩ Remettre en terre'};
const GUIDE={
 etude:{cepe:"Fais-le tourner et clique sur les pastilles. Regarde sous le chapeau : des pores, pas de lames. Puis coupe-le en deux.",girolle:"Retourne-la : dessous, ce ne sont pas des lames mais des plis qui descendent sur le pied.",amanite:"Celle-là, on ne la touche pas pour manger. Déterre le pied : la volve en sac à la base, c'est sa signature."},
 saisons:{cepe:"Fais défiler les jours après la pluie : bouchon, à point, trop vieux. Tout se joue en une dizaine de jours.",girolle:"La girolle prend son temps : regarde quand elle est à point, et quand les limaces passent avant toi.",amanite:"Regarde-la sortir de son œuf : à ce stade, on la confond avec une vesse-de-loup. Puis l'anneau et la volve apparaissent."}
};
function majFiche(){const P=PLANTES[cle];$('fNom').textContent=P.nom;$('fLat').textContent=P.latin;$('fFam').textContent=P.famille;$('fVue').textContent='Vue 3D : '+P.vue.toLowerCase();$('piege').innerHTML='⚠️ <b>Confusion possible :</b> '+P.piege;
 $('guideBulle').textContent=GUIDE[MODE][cle];
 if(MODE==='etude'){$('dTitre').textContent='Clique sur une pastille';$('dTexte').textContent='Chaque pastille montre un critère qui permet de reconnaître le champignon. Fais-le tourner, zoome avec la molette, puis utilise le bouton jaune : il révèle le piège.';$('dTexte').className='aide';$('dNum').textContent=''}
 $('bCoupe').textContent=(coupe?LIB_FERME:LIB_COUPE)[cle];$('bCoupe').classList.toggle('on',coupe);
 $('bSosie').hidden=!coupe;$('bSosie').textContent=(sosie?LIB_SOSIE_OFF:LIB_SOSIE)[cle];$('bSosie').classList.toggle('on',sosie);
 document.querySelectorAll('.onglet').forEach(b=>b.classList.toggle('on',b.dataset.k===cle));
}
function choisir(k){if(sosie){plantes[cle].userData.setSosie(false);sosie=false}plantes[cle].visible=false;cle=k;const G=plantes[k];G.visible=true;
 coupe=false;G.userData.setCoupe(false,true);G.userData.maj(0);
 S.ombre.visible=false;
 construirePastilles();majFiche();vueDefaut(900);
 if(MODE==='saisons'){plantes[k].userData.jours(mAff);$('dTitre').dataset.s='';afficherSaison(saisonDe(mAff))}
}
const CENTRE={pluie:1,pousse:4,point:8,vieux:13};
let mCible=1,mAff=1,lecture=false;
function saisonDe(m){return m<2?'pluie':m<6?'pousse':m<10?'point':'vieux'}
function afficherSaison(s){if(s===saison&&$('dTitre').dataset.s===s+cle)return;saison=s;const [t,x]=PLANTES[cle].pousse[s];
 $('dTitre').textContent=t;$('dTitre').dataset.s=s+cle;$('dTexte').textContent=x;$('dTexte').className='';$('dNum').textContent=NOMS_SAISONS[s].toUpperCase();
 document.querySelectorAll('.s').forEach(b=>b.classList.toggle('on',b.dataset.s===s));$('pouce').textContent=EMO[s];}
function choisirSaison(s,direct){mCible=CENTRE[s];lecture=false;$('lecture').textContent='▶';if(direct){mAff=mCible;plantes[cle].userData.jours(mAff)}afficherSaison(s)}
$('bCoupe').onclick=()=>{const G=plantes[cle];coupe=!coupe;$('bCoupe').classList.toggle('on',coupe);$('bCoupe').textContent=(coupe?LIB_FERME:LIB_COUPE)[cle];
 if(!coupe&&sosie){G.userData.setSosie(false);sosie=false}$('bSosie').hidden=!coupe;$('bSosie').textContent=(sosie?LIB_SOSIE_OFF:LIB_SOSIE)[cle];$('bSosie').classList.toggle('on',sosie);
 G.userData.setCoupe(coupe);setTimeout(()=>{G.userData.maj(.5);construirePastilles();if(coupe){const neo=etiquettes.filter(e=>!vus.has(cle+e.id));$('dTitre').textContent=cle==='amanite'?'La volve apparaît':cle==='girolle'?'Regarde les plis':'Regarde l\'intérieur';$('dTexte').textContent=(neo.length?'De nouvelles pastilles sont apparues. ':'')+'Et maintenant, compare avec le piège : bouton jaune.';$('dTexte').className='';$('dNum').textContent=''}},700);
 if(!coupe){vueDefaut();return}
 if(cle==='cepe'){S.ctrl.minDistance=.9;volerVers(new THREE.Vector3(0,1.0,3.0),new THREE.Vector3(0,.6,0),900)}
 else if(cle==='girolle'){S.ctrl.minDistance=.6;volerVers(new THREE.Vector3(.2,1.5,2.0),new THREE.Vector3(0,.85,.2),900)}
 else{S.ctrl.minDistance=.6;volerVers(new THREE.Vector3(1.2,.55,2.2),new THREE.Vector3(.55,.25,.3),1000)}
};
$('bVue').onclick=()=>vueDefaut();
$('bSosie').onclick=()=>{const G=plantes[cle];sosie=!sosie;G.userData.setSosie(sosie);$('bSosie').textContent=(sosie?LIB_SOSIE_OFF:LIB_SOSIE)[cle];$('bSosie').classList.toggle('on',sosie);
 if(sosie){const [t,x]=PLANTES[cle].sosie;$('dTitre').textContent=t;$('dTexte').textContent=x;$('dTexte').className='';$('dNum').textContent='PIÈGE';etiquettes.forEach(e=>e.d.classList.remove('on'))}else{$('dTitre').textContent='Retour au vrai';$('dTexte').textContent='Compare les deux dans ta tête : c\'est ce réflexe qui évite l\'erreur en forêt.';$('dNum').textContent=''}};
$('son').onclick=()=>voix.jouer(MODE==='saisons'?'audio/saisons.mp3':'audio/etude.mp3',$('son'));

function neige(on){const n=$('neige');n.innerHTML='';if(!on)return;const r=(a,b)=>a+Math.random()*(b-a);
 for(let i=0;i<90;i++){const f=document.createElement('div');f.className='flocon goutte';f.style.left=r(0,1130)+'px';f.style.setProperty('--d',r(.9,1.6)+'s');f.style.setProperty('--r',-r(0,1.6)+'s');f.style.setProperty('--x',r(-30,10)+'px');f.style.width='2px';f.style.height=r(14,26)+'px';n.appendChild(f)}}


// ----- boucle -----
let tPrec=performance.now();let visible=false;let neigeOn=false;
new IntersectionObserver(es=>{for(const e of es)visible=e.isIntersecting&&innerWidth>50}).observe($('vue3d'));
function boucle(now){requestAnimationFrame(boucle);const dt=Math.min(.05,(now-tPrec)/1000);tPrec=now;
 if(document.hidden||!visible){tPrec=now;return}
 if(anim){const k=Math.min(1,(now-anim.t0)/anim.ms);const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;S.camera.position.lerpVectors(anim.p0,anim.p1,e);S.ctrl.target.lerpVectors(anim.c0,anim.c1,e);if(k>=1)anim=null}
 if(MODE==='saisons'){if(lecture){mCible+=dt*1.6;if(mCible>=NJ)mCible-=NJ;mAff=mCible}else{let d=mCible-mAff;mAff+=d*Math.min(1,dt*6)}
  plantes[cle].userData.jours(mAff);$('pouce').style.left=(mAff/NJ*100)+'%';const sn=saisonDe(mAff);if(sn!==saison)afficherSaison(sn);const pluie=(mAff<2);if(pluie!==neigeOn){neigeOn=pluie;neige(pluie)}}
 plantes[cle].userData.maj&&plantes[cle].userData.maj(dt);
 S.ctrl.update();S.renderer.render(S.scene,S.camera);projeter();
}
S.camera.position.set(0,1.5,5);
choisir(cle);
if(MODE==='saisons')choisirSaison('pluie',true);
requestAnimationFrame(boucle);
window.__labo={S,plantes};
