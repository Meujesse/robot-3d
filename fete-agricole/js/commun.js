// Scène 1600x900 à l'échelle, son coupé par défaut (jamais de son sans clic sur le bouton), carnet de bord partagé entre les pages.
(function(){
 const stage=document.getElementById('stage');
 function fit(){const k=Math.max(innerWidth/1600,innerHeight/900);if(k>0)stage.style.setProperty('--s',k)}
 addEventListener('resize',fit);
 // la scène ne doit jamais se décaler : un focus ou un élément hors cadre peut faire défiler un bloc « overflow:hidden »
 const recale=e=>{const c=e.target===document?document.scrollingElement:e.target;if(!c||!(c.scrollTop||c.scrollLeft))return;const o=getComputedStyle(c);if(c!==document.scrollingElement&&/(auto|scroll)/.test(o.overflowY+o.overflowX))return;   // les vraies zones à ascenseur (messages, carnet) restent libres
  c.scrollTop=0;c.scrollLeft=0};
 addEventListener('scroll',recale,true);new ResizeObserver(fit).observe(document.documentElement);fit();
 const P=new URLSearchParams(location.search);
 const MUET=P.has('muet')||P.has('mute');

 /* ---------- mémoire partagée (même origine dans toutes les pages du Genially) ---------- */
 const mem={
  lire(k,d){try{return JSON.parse(localStorage.getItem('fa_'+k))??d}catch(e){return d}},
  ecrire(k,v){try{localStorage.setItem('fa_'+k,JSON.stringify(v))}catch(e){}}
 };
 if(P.has('zero')){['carnet','lieux','son','vocaux'].forEach(k=>{try{localStorage.removeItem('fa_'+k)}catch(e){}})}
 window.mem=mem;

 /* ---------- son : coupé tant que l'apprenant ne l'a pas activé ---------- */
 let actif=!MUET&&mem.lire('son',true)!==false, courant=null, ctx=null;   // son actif par défaut ; ?muet le coupe toujours
 const b=document.createElement('button');b.id='bSon';b.title='Son';stage.appendChild(b);
 const maj=()=>{b.textContent=actif?'🔊':'🔇';b.classList.toggle('coupe',!actif)};maj();
 // sur les pages parlées, une étiquette douce rappelle qu'on peut activer la voix
 if(document.body.hasAttribute('data-voix')&&!actif&&!MUET){const e=document.createElement('div');e.id='bSonAide';e.textContent='Active le son pour entendre les voix';stage.appendChild(e);setTimeout(()=>e.classList.add('part'),9000);b.addEventListener('click',()=>e.remove(),{once:true})}
 b.onclick=()=>{if(MUET)return;actif=!actif;mem.ecrire('son',actif);maj();if(!actif)son.stop();else son.bip('ok')};
 const son=window.son={
  get actif(){return actif},
  jouer(fichier,fin){son.stop();if(!actif){fin&&fin(false);return null}
   courant=new Audio(fichier);courant.addEventListener('ended',()=>fin&&fin(true));courant.addEventListener('error',()=>fin&&fin(false));
   const c=courant;c.play().catch(()=>{fin&&fin(false);c.dispatchEvent(new Event('error'))});return courant},
  stop(){if(courant){courant.pause();courant=null}},
  // petits bruitages synthétiques (aucun fichier)
  bip(type){if(!actif)return;try{ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();
    const t=ctx.currentTime,notes={ok:[660,880],non:[300,240],pop:[520],envoi:[520],recu:[440],trouve:[523,659,784]}[type]||[440];
    const vol={envoi:.025,recu:.03,pop:.06}[type]||.1;
    notes.forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=f;
     g.gain.setValueAtTime(0,t+i*.09);g.gain.linearRampToValueAtTime(vol,t+i*.09+.02);g.gain.exponentialRampToValueAtTime(.001,t+i*.09+.22);
     o.connect(g).connect(ctx.destination);o.start(t+i*.09);o.stop(t+i*.09+.25)})}catch(e){}}
 };
 document.addEventListener('visibilitychange',()=>{if(document.hidden)son.stop()});

 /* ---------- faire parler un personnage : la voix si le son est activé (la bouche suit le volume), sinon la bouche suit le texte ---------- */
 // renvoie {fin: promesse résolue à la fin de la réplique, duree: promesse de la durée en ms}
 window.parler=function(rig,fichier,oral){
  const estime=Math.max(1200,oral.length*62);
  const a=fichier?son.jouer(fichier):null;
  if(!a){const fin=rig.speakText(oral).then(()=>{});return {fin:Promise.race([fin,new Promise(r=>setTimeout(r,estime+900))]).then(()=>{rig.stopText();rig.setState('idle')}),duree:Promise.resolve(estime)}}
  let amp=()=>0;
  try{ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume();
   const src=ctx.createMediaElementSource(a),an=ctx.createAnalyser();an.fftSize=512;src.connect(an);an.connect(ctx.destination);
   const buf=new Uint8Array(an.fftSize);amp=()=>{an.getByteTimeDomainData(buf);let s=0;for(let i=0;i<buf.length;i++){const v=(buf[i]-128)/128;s+=v*v}return Math.min(1,Math.sqrt(s/buf.length)*4.2)}}catch(e){}
  const duree=new Promise(r=>{a.addEventListener('loadedmetadata',()=>r(isFinite(a.duration)?a.duration*1000:estime));setTimeout(()=>r(estime),1500)});
  const fin=new Promise(r=>{let secours=null;
   const termine=()=>{clearTimeout(secours);rig.setAmpSource(null);rig.setState('idle');r()};
   a.addEventListener('playing',()=>{rig.videFile();rig.nourrit(oral);rig.setAmpSource(amp);rig.setState('speaking')},{once:true});
   a.addEventListener('ended',termine,{once:true});a.addEventListener('pause',termine,{once:true});
   a.addEventListener('error',()=>{rig.speakText(oral).then(termine)},{once:true});
   secours=setTimeout(termine,estime*2+6000)});
  return {fin,duree};
 };

 /* ---------- Genially précharge les pages : rien ne démarre (ni voix ni dialogue) tant que la scène n'est pas réellement à l'écran ---------- */
 window.quandVisible=new Promise(r=>{const o=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)&&innerWidth>50&&!document.hidden){o.disconnect();r()}});o.observe(stage);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){o.disconnect();o.observe(stage)}})});

 /* ---------- entrées animées quand la page Genially devient visible ---------- */
 const io=new IntersectionObserver(es=>{for(const e of es){if(e.isIntersecting&&innerWidth>50){document.documentElement.classList.remove('anim');void document.documentElement.offsetWidth;document.documentElement.classList.add('anim')}}});
 io.observe(stage);

 /* ---------- dans Genially : barre « Village · 1 · 2 · 3 · 4 » dessinée ici, cliquable grâce aux zones Genially posées dessus ---------- */
 const PAGE=(location.pathname.split('/').pop()||'').replace('.html','');
 const ARRETS=[['questions','🏛️'],['terrain','🎪'],['micro','🎤'],['texto','📱']];
 if(window.top!==window&&!P.has('dans')&&ARRETS.some(a=>a[0]===PAGE)){
  const n=document.createElement('div');n.id='navG';
  n.innerHTML='<span class="v">🏘️ Village</span>'+ARRETS.map((a,i)=>'<span class="a'+(a[0]===PAGE?' ici':'')+'"><b>'+(i+1)+'</b>'+a[1]+'</span>').join('');
  stage.appendChild(n);
 }

 /* ---------- carnet de bord ---------- */
 const RUB=[['cq','Le projet en 7 questions'],['obs','Ma grille d\'observation'],['micro','Ce que les gens m\'ont dit']];
 const carnet=window.carnet={
  tout(){return mem.lire('carnet',{cq:[],obs:[],micro:[]})},
  noter(rub,texte){const c=carnet.tout();c[rub]=c[rub]||[];if(!c[rub].includes(texte)){c[rub].push(texte);mem.ecrire('carnet',c);majNb(true)}},
  lieu(id){const l=mem.lire('lieux',{});l[id]=1;mem.ecrire('lieux',l)},
  lieux(){return mem.lire('lieux',{})}
 };
 if(!document.body.hasAttribute('data-sans-carnet')){
  const bc=document.createElement('button');bc.id='bCarnet';stage.appendChild(bc);
  const pan=document.createElement('div');pan.id='carnet';stage.appendChild(pan);
  function total(){const c=carnet.tout();return RUB.reduce((n,[k])=>n+(c[k]||[]).length,0)}
  var majNb=function(neuf){bc.innerHTML='📒 Carnet de bord <span class="nb">'+total()+'</span>';if(neuf){bc.classList.remove('neuf');void bc.offsetWidth;bc.classList.add('neuf')}};
  majNb();document.addEventListener('majCarnet',()=>majNb());
  bc.onclick=()=>{const c=carnet.tout();
   pan.innerHTML='<div class="livre"><button class="x">✕</button><h2>Carnet de bord</h2><div class="ss">Tout ce que tu récoltes pendant le diagnostic se range ici.</div><div class="cols">'+
    RUB.map(([k,t])=>'<div><h3>'+t+'</h3>'+((c[k]||[]).length?'<ul>'+c[k].map(x=>'<li>'+x+'</li>').join('')+'</ul>':'<div class="vide">Rien pour l\'instant.</div>')+'</div>').join('')+'</div><button class="raz">↺ Tout recommencer</button></div>';
   pan.querySelector('.raz').onclick=()=>{['carnet','lieux'].forEach(k=>{try{localStorage.removeItem('fa_'+k)}catch(e){}});(window.parent!==window&&new URLSearchParams(location.search).has('dans')?window.parent:window).location.reload()};
   pan.classList.add('on');pan.querySelector('.x').onclick=()=>pan.classList.remove('on');son.bip('pop')};
  pan.addEventListener('click',e=>{if(e.target===pan)pan.classList.remove('on')});
 } else { var majNb=function(){}; }
})();
