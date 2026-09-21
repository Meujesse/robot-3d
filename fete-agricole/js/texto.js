// Conversation par messages : Camille écrit, l'apprenant choisit parmi trois réponses, elle réagit.
(function(){
 const D=window.TEXTO,$=s=>document.querySelector(s);
 const P=new URLSearchParams(location.search),VITE=P.has('vite');
 const fil=$('#fil'),saisie=$('#saisie');
 const attendre=ms=>new Promise(r=>setTimeout(r,VITE?30:ms));
 let vocaux=false,score=0,trace=[];

 /* ---------- accroche ---------- */
 const maintenant=new Date(),hh=n=>String(n).padStart(2,'0');
 let minute=maintenant.getHours()*60+maintenant.getMinutes();
 const heure=()=>hh(Math.floor(minute/60)%24)+':'+hh(minute%60);
 $('#heure').textContent=heure();
 $('#tel .date').textContent=maintenant.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
 $('#notifTxt').textContent=D.accroche.texte;
 setTimeout(()=>{$('#notif').classList.add('on','vibre');son.bip('recu')},VITE?50:1200);
 $('#notif').onclick=()=>{son.bip('pop');$('#accroche').classList.add('part');setTimeout(()=>{$('#accroche').hidden=true;$('#appli').hidden=false;demarrer()},VITE?30:600)};

 /* ---------- briques ---------- */
 function bas(){fil.scrollTop=fil.scrollHeight}
 function tampon(moi){return '<span class="h">'+heure()+(moi?'<span class="vu">✓✓</span>':'')+'</span>'}
 async function ecrit(ms){
  $('#statut').textContent='écrit…';
  const e=document.createElement('div');e.className='ecrit';e.innerHTML='<i></i><i></i><i></i>';fil.appendChild(e);bas();
  await attendre(ms);e.remove();$('#statut').textContent='en ligne';
 }
 async function camille(m){
  if(m.photo){
   await ecrit(1300);
   const d=document.createElement('div');d.className='msg elle photo';
   d.innerHTML='<img src="'+m.photo+'" alt=""><div class="leg">'+(m.legende||'')+tampon()+'</div>';
   d.onclick=()=>{const z=$('#zoomPhoto');z.querySelector('img').src=m.photo;z.hidden=false};
   fil.appendChild(d);son.bip('recu');bas();d.querySelector('img').onload=bas;await attendre(1500);return;
  }
  if(m.v&&vocaux){
   $('#statut').textContent='enregistre un vocal…';await attendre(1600);$('#statut').textContent='en ligne';
   fil.appendChild(vocal(m));son.bip('recu');bas();await attendre(900);return;
  }
  await ecrit(Math.min(2600,500+m.t.length*22));
  const d=document.createElement('div');d.className='msg elle';d.innerHTML=m.t+tampon();
  fil.appendChild(d);son.bip('recu');bas();minute+=Math.random()<.4?1:0;await attendre(650);
 }
 function vocal(m){
  const d=document.createElement('div');d.className='msg elle vocal';
  const N=34;let barres='';for(let i=0;i<N;i++){const h=20+Math.round(70*Math.abs(Math.sin(i*1.7+m.t.length)*Math.cos(i*.45)));barres+='<b style="height:'+h+'%"></b>'}
  const fmt=s=>'0:'+hh(Math.round(s));
  d.innerHTML='<button class="lire" title="Écouter">▶</button><div class="onde">'+barres+'<div class="tr">'+m.t+'</div></div><span class="d">'+fmt(m.s)+'</span><button class="aa">Lire la transcription</button>';
  const bl=d.querySelector('.lire'),bs=[...d.querySelectorAll('.onde b')];let minuteur=null,audio=null;
  function arret(){clearInterval(minuteur);minuteur=null;if(audio){audio.pause();audio=null}bl.textContent='▶'}
  function avance(p){bs.forEach((b,i)=>b.classList.toggle('f',i/N<p))}
  bl.onclick=()=>{
   if(minuteur){arret();return}
   bl.textContent='❚❚';const t0=performance.now();let duree=m.s*1000;
   audio=son.jouer('audio/'+m.v+'.mp3');
   if(audio)audio.addEventListener('loadedmetadata',()=>{if(isFinite(audio.duration))duree=audio.duration*1000});
   minuteur=setInterval(()=>{const p=audio&&audio.duration?audio.currentTime/audio.duration:(performance.now()-t0)/duree;avance(p);if(p>=1){arret();avance(1)}},80);
   if(!son.actif)d.classList.add('montre'); // sans le son, la transcription s'affiche
  };
  d.querySelector('.aa').onclick=()=>d.classList.toggle('montre');
  return d;
 }
 async function moi(t){
  const d=document.createElement('div');d.className='msg moi';d.innerHTML=t+tampon(true);
  fil.appendChild(d);son.bip('envoi');bas();minute++;
  await attendre(700);d.querySelector('.vu').classList.add('lu');await attendre(350);
 }
 function choisir(choix){
  return new Promise(r=>{
   const ordre=choix.map((c,i)=>i).sort(()=>Math.random()-.5);
   saisie.innerHTML='<div class="lab">Ta réponse</div>';
   ordre.forEach(i=>{const b=document.createElement('button');b.className='rep';b.textContent=choix[i].t;
    b.onclick=()=>{saisie.innerHTML='<div class="attente">Camille écrit…</div>';r(choix[i])};saisie.appendChild(b)});
  });
 }
 function progres(n){$('#pTxt').textContent=n+' / '+D.questions.length;$('#pBarre').style.width=(100*n/D.questions.length)+'%'}

 /* ---------- déroulé ---------- */
 async function demarrer(){
  $('#pastille').textContent='';progres(0);
  for(const m of D.ouverture)await camille(m);
  const a=await choisir(D.accordVocaux.choix);await moi(a.t);vocaux=a.vocaux;mem.ecrire('vocaux',vocaux);
  for(const m of a.re)await camille(m);
  let n=0;
  for(const q of D.questions){
   for(const m of q.camille)await camille(m);
   const c=await choisir(q.choix);await moi(c.t);
   if(c.ok){score++;son.bip('ok')}
   trace.push({q,c});
   for(const m of c.re)await camille(m);
   progres(++n);$('#apercu').textContent=c.re[c.re.length-1].t.replace(/<[^>]+>/g,'');
   await attendre(500);
  }
  const fin=score>=D.fins.haut.seuil?D.fins.haut:score>=D.fins.moyen.seuil?D.fins.moyen:D.fins.bas;
  for(const m of fin.messages)await camille(m);
  saisie.innerHTML='';const b=document.createElement('button');b.className='btn vert';b.style.alignSelf='center';b.textContent='Voir le récap';
  b.onclick=()=>bilan(fin);saisie.appendChild(b);
 }

 function bilan(fin){
  carnet.lieu('texto');son.bip('trouve');
  const s=$('#bilan'),N=D.questions.length;
  s.innerHTML='<div class="sur">Ton débrief avec Camille</div><div class="haut"><div><h1>Le récap du chapitre</h1></div></div>'+
   '<div class="haut" style="margin-top:18px"><div class="anneau"><svg width="190" height="190"><circle class="f" cx="95" cy="95" r="80"/><circle class="v" cx="95" cy="95" r="80"/></svg><div><span>'+score+'/'+N+'<small>bonnes réponses</small></span></div></div>'+
   '<div class="mot"><img src="'+D.contact.photo+'" alt=""><p><b>Le mot de Camille</b>'+fin.messages[0].t+'</p></div></div>'+
   '<div class="lignes">'+trace.map((x,i)=>'<div class="l '+(x.c.ok?'ok':'ko')+'" style="animation-delay:'+(.5+i*.12)+'s"><div class="p">'+(x.c.ok?'✓':'!')+'</div><div><h3>'+x.q.theme+'</h3><div class="b">'+x.q.bonne+'</div>'+(x.c.ok?'':'<div class="t">Tu avais répondu : « '+x.c.t+' »</div>')+'</div></div>').join('')+'</div>'+
   '<div class="bas"><button class="btn" id="bRefaire">Refaire la conversation</button><button class="btn vert" id="bRelire">Relire les messages</button><span>Les réactions de Camille changent selon tes réponses. Essaie une autre piste pour voir.</span></div>';
  $('#appli').hidden=true;s.hidden=false;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{s.querySelector('.v').style.strokeDashoffset=502*(1-score/N)}));
  $('#bRefaire').onclick=()=>location.reload();
  $('#bRelire').onclick=()=>{s.hidden=true;$('#appli').hidden=false;saisie.innerHTML='';const b=document.createElement('button');b.className='btn vert';b.style.alignSelf='center';b.textContent='Revenir au récap';b.onclick=()=>{$('#appli').hidden=true;s.hidden=false};saisie.appendChild(b)};
 }
 $('#zoomPhoto').onclick=()=>{$('#zoomPhoto').hidden=true};
 window.__texto={bilan:(n)=>{score=n;trace=D.questions.map((q,i)=>({q,c:q.choix[i<n?0:1]}));const fin=score>=4?D.fins.haut:score>=2?D.fins.moyen:D.fins.bas;$('#accroche').hidden=true;bilan(fin)}};
})();
