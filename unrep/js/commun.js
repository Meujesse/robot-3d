// Scène 1600x900 à l'échelle + voix de Célian (jamais automatique hors premier clic, jamais en ?muet=1)
(function(){
 const stage=document.getElementById('stage');
 function fit(){const k=Math.min(innerWidth/1600,innerHeight/900);if(k>0)stage.style.setProperty('--s',k)}
 addEventListener('resize',fit);new ResizeObserver(fit).observe(document.documentElement);fit();
 const MUET=new URLSearchParams(location.search).has('muet');
 let courant=null,bouton=null;
 window.voix={
  muet:MUET,
  jouer(fichier,btn){
   if(courant){courant.pause();if(bouton)bouton.classList.remove('joue')}
   if(MUET)return;
   courant=new Audio(fichier);bouton=btn||null;
   if(bouton)bouton.classList.add('joue');
   courant.addEventListener('ended',()=>bouton&&bouton.classList.remove('joue'));
   courant.play().catch(()=>bouton&&bouton.classList.remove('joue'));
  },
  stop(){if(courant)courant.pause();if(bouton)bouton.classList.remove('joue')}
 };
 // coupe la voix quand la page Genially n'est plus visible
 document.addEventListener('visibilitychange',()=>{if(document.hidden)voix.stop()});
})();
