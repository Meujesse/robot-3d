// La scène à observer : cinq objets flottants à retrouver, une note à choisir pour chacun (un fait, un avis ou une supposition).
window.TERRAIN={
 image:{src:'img/foire.jpg',w:1536,h:1024},
 retours:{
  fait:'Oui ! Un <b>fait</b>, précis, que n\'importe qui peut vérifier sur place. C\'est exactement ce qu\'on met dans une grille.',
  avis:'Ça, c\'est ton <b>avis</b>. Dans une grille d\'observation, on note ce qu\'on voit, pas ce qu\'on en pense. Je garde plutôt la note factuelle.',
  supposition:'Là, tu <b>supposes</b> : tu l\'as pas vu de tes yeux. Dans la grille, on écrit seulement ce qu\'on observe. Je garde la note factuelle.'
 },
 objets:[
  {id:'affiche',img:'img/obj-affiche.webp',glb:'glb/affiche.glb',x:676,y:650,t:'L\'affiche de la fête',rub:'Communication',
   q:'Tu l\'as trouvée à l\'entrée. Qu\'est-ce que tu notes ?',
   notes:{fait:'Une seule affiche, posée à l\'entrée. On y voit le thème de la fête, mais ni les horaires ni les tarifs.',avis:'L\'affiche est super jolie, on a envie de venir.',supposition:'Les gens n\'ont sûrement pas vu l\'affiche avant de venir.'}},
  {id:'panneau',img:'img/obj-panneau.webp',glb:'glb/panneau.glb',x:1320,y:250,t:'Le fléchage',rub:'Accès et circulation',
   q:'Des flèches vers le parking, les animaux, la buvette. Qu\'est-ce que tu notes ?',
   notes:{fait:'Le fléchage existe, mais seulement à l\'intérieur du site. Le parking est dans l\'herbe, au fond, sans emplacement réservé.',avis:'C\'est mal indiqué, franchement c\'est nul.',supposition:'Les visiteurs ont dû tourner longtemps avant de réussir à se garer.'}},
  {id:'etal',img:'img/obj-etal.webp',glb:'glb/etal.glb',x:230,y:560,t:'Les stands de producteurs',rub:'Stands et exposants',
   q:'Fromages, légumes, miel… Qu\'est-ce que tu notes ?',
   notes:{fait:'Les stands de producteurs sont regroupés à gauche de l\'allée, sous des barnums. Les prix sont affichés sur des ardoises.',avis:'Les produits ont l\'air trop bons.',supposition:'Les exposants ont sûrement très bien vendu ce jour-là.'}},
  {id:'buvette',img:'img/obj-buvette.webp',glb:'glb/buvette.glb',x:1150,y:420,t:'La buvette',rub:'Restauration et convivialité',
   q:'Il est midi, regarde autour des tables. Qu\'est-ce que tu notes ?',
   notes:{fait:'Une buvette avec des tables en bois, toutes occupées. Plusieurs personnes mangent debout ou assises sur les bottes de paille.',avis:'L\'ambiance est vraiment sympa.',supposition:'Il n\'y aura jamais assez à manger pour tout le monde.'}},
  {id:'secours',img:'img/obj-secours.webp',glb:'glb/secours.glb',x:520,y:230,t:'Le point secours',rub:'Sécurité',
   q:'Caché près de la scène. Qu\'est-ce que tu notes ?',
   notes:{fait:'Un point secours près de la scène, avec une trousse et un extincteur. Des bénévoles en gilet jaune sont postés à l\'entrée.',avis:'Ça a l\'air bien sécurisé, je suis rassuré·e.',supposition:'En cas de problème, les secours arriveraient vite.'}}
 ],
 paroles:[
  {x:905,y:690,t:'Il est où, le parking ?'},{x:150,y:640,t:'Goûtez-moi ça !'},{x:1090,y:520,t:'Y a plus une place assise…'},
  {x:700,y:330,t:'C\'est à quelle heure, le concours ?'},{x:330,y:380,t:'Regarde la vache !'},{x:1010,y:900,t:'On commence par quoi ?'}]
};
