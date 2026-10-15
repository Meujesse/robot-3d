// Met la scène 1200 x 675 à l'échelle de la fenêtre (plein cadre dans l'iframe Genially)
(function(){
  const sc = document.getElementById('scene');
  function ajuste(){
    const k = Math.min(innerWidth/1200, innerHeight/675);
    sc.style.transform = `translate(-50%,-50%) scale(${k})`;
  }
  addEventListener('resize', ajuste); ajuste();
})();

// Clignement naturel : fermeture rapide, réouverture plus lente, intervalle aléatoire, double clignement 1 fois sur 5
function clignement(getCalque){
  function un(){
    const cl = getCalque(); if(!cl) return;
    cl.animate([
      {opacity:0, offset:0, easing:'cubic-bezier(.45,0,.85,1)'},
      {opacity:1, offset:.19, easing:'linear'},
      {opacity:1, offset:.55, easing:'cubic-bezier(.1,0,.35,1)'},
      {opacity:0, offset:1}
    ], {duration: 195 + Math.random()*45});
  }
  (function boucle(){
    setTimeout(()=>{ un(); if(Math.random()<.2) setTimeout(un, 320); boucle(); }, 1900 + Math.random()*4600);
  })();
}
