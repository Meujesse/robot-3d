// Scène 1600x900 à l'échelle, son coupé par défaut (jamais de son sans clic sur le bouton), carnet de bord partagé entre les pages.
(function(){
 const stage=document.getElementById('stage');
 function fit(){const k=Math.max(innerWidth/1600,innerHeight/900);if(k>0)stage.style.setProperty('--s',k)}
 addEventListener('resize',fit);new ResizeObserver(fit).observe(document.documentElement);fit();
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
 let actif=!MUET&&mem.lire('son',false)===true, courant=null, ctx=null;
 const b=document.createElement('button');b.id='bSon';b.title='Son';stage.appendChild(b);
 const maj=()=>{b.textContent=actif?'🔊':'🔇'};maj();
 b.onclick=()=>{if(MUET)return;actif=!actif;mem.ecrire('son',actif);maj();if(!actif)son.stop();else son.bip('ok')};
 const son=window.son={
  get actif(){return actif},
  jouer(fichier,fin){son.stop();if(!actif){fin&&fin(false);return null}
   courant=new Audio(fichier);courant.addEventListener('ended',()=>fin&&fin(true));courant.addEventListener('error',()=>fin&&fin(false));
   courant.play().catch(()=>fin&&fin(false));return courant},
  stop(){if(courant){courant.pause();courant=null}},
  // petits bruitages synthétiques (aucun fichier)
  bip(type){if(!actif)return;try{ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();
    const t=ctx.currentTime,notes={ok:[660,880],non:[300,240],pop:[520],envoi:[740,990],recu:[880,660],trouve:[523,659,784]}[type]||[440];
    notes.forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=f;
     g.gain.setValueAtTime(0,t+i*.09);g.gain.linearRampToValueAtTime(.12,t+i*.09+.015);g.gain.exponentialRampToValueAtTime(.001,t+i*.09+.22);
     o.connect(g).connect(ctx.destination);o.start(t+i*.09);o.stop(t+i*.09+.25)})}catch(e){}}
 };
 document.addEventListener('visibilitychange',()=>{if(document.hidden)son.stop()});

 /* ---------- entrées animées quand la page Genially devient visible ---------- */
 const io=new IntersectionObserver(es=>{for(const e of es){if(e.isIntersecting&&innerWidth>50){document.documentElement.classList.remove('anim');void document.documentElement.offsetWidth;document.documentElement.classList.add('anim')}}});
 io.observe(stage);

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
  majNb();
  bc.onclick=()=>{const c=carnet.tout();
   pan.innerHTML='<div class="livre"><button class="x">✕</button><h2>Carnet de bord</h2><div class="ss">Tout ce que tu récoltes pendant le diagnostic se range ici.</div><div class="cols">'+
    RUB.map(([k,t])=>'<div><h3>'+t+'</h3>'+((c[k]||[]).length?'<ul>'+c[k].map(x=>'<li>'+x+'</li>').join('')+'</ul>':'<div class="vide">Rien pour l\'instant.</div>')+'</div>').join('')+'</div></div>';
   pan.classList.add('on');pan.querySelector('.x').onclick=()=>pan.classList.remove('on');son.bip('pop')};
  pan.addEventListener('click',e=>{if(e.target===pan)pan.classList.remove('on')});
 } else { var majNb=function(){}; }
})();
