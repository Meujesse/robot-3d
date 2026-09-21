// La scène à observer : une vue d'ensemble vivante, trois scènes où l'on plonge, cinq objets flottants à attraper.
// Positions : vue d'ensemble en pixels de l'image (1536x1024) ; dans les scènes, en fractions de l'image (0 à 1).
window.TERRAIN={
 image:{src:'img/foire.jpg',w:1536,h:1024},
 // zones d'arbres où souffle le vent : [centre x, centre y, demi-largeur, demi-hauteur] en fractions de l'image
 arbres:[[.06,.09,.07,.1],[.035,.43,.035,.07]],
 retours:{
  fait:'Oui ! Un <b>fait</b>, précis, que n\'importe qui peut vérifier sur place. C\'est exactement ce qu\'on met dans une grille.',
  avis:'Ça, c\'est ton <b>avis</b>. Dans une grille d\'observation, on note ce qu\'on voit, pas ce qu\'on en pense. Je garde plutôt la note factuelle.',
  supposition:'Là, tu <b>supposes</b> : tu ne l\'as pas vu de tes yeux. Dans la grille, on écrit seulement ce qu\'on observe. Je garde la note factuelle.'
 },
 scenes:[
  {id:'entree',nom:'L\'entrée',ic:'🚪',img:'img/sc-entree.jpg',x:1000,y:650,
   camille:'Nous voilà à <b>l\'entrée</b>. Deux bénévoles accueillent les visiteurs… mais regarde au fond à droite : les voitures se garent où elles peuvent. Deux objets flottent ici, attrape-les !',
   lueurs:[[.255,.2],[.262,.33],[.815,.17],[.808,.3],[.3,.12],[.5,.1],[.7,.11]],fumee:null,
   arbres:[[.5,.125,.3,.035],[.24,.3,.035,.17],[.79,.3,.035,.17]]},
  {id:'buvette',nom:'La buvette',ic:'🍽️',img:'img/sc-buvette.jpg',x:1150,y:430,
   camille:'Midi à <b>la buvette</b>. Le barbecue tourne à plein régime et il n\'y a plus une place assise : regarde ceux qui mangent sur les bottes de paille. Deux objets à trouver ici.',
   lueurs:[[.04,.17],[.09,.16],[.14,.17],[.19,.16],[.5,.22],[.56,.23],[.62,.22],[.68,.23],[.74,.22],[.8,.23],[.86,.22],[.92,.23]],fumee:[.965,.3],
   arbres:[[.04,.13,.05,.05],[.8,.13,.1,.04]]},
  {id:'stands',nom:'Les stands',ic:'🧀',img:'img/sc-stands.jpg',x:300,y:600,
   camille:'<b>L\'allée des producteurs.</b> On fait goûter le fromage, les enfants filent voir les vaches juste derrière. Un objet t\'attend par ici.',
   lueurs:[[.03,.24],[.09,.25],[.15,.24],[.21,.25],[.27,.24],[.33,.25],[.62,.2],[.7,.21],[.78,.2]],fumee:null,
   arbres:[[.1,.13,.09,.04]]}
 ],
 objets:[
  {id:'affiche',scene:'entree',fx:.13,fy:.5,img:'img/obj-affiche.webp',t:'L\'affiche de la fête',rub:'Communication',
   q:'Elle était posée sur ce chevalet, à l\'entrée. Qu\'est-ce que tu notes ?',
   notes:{fait:'Une seule affiche, posée à l\'entrée. On y voit le thème de la fête, mais ni les horaires ni les tarifs.',avis:'L\'affiche est super jolie, elle donne envie de venir.',supposition:'Les gens n\'ont sûrement pas vu l\'affiche avant de venir.'}},
  {id:'panneau',scene:'entree',fx:.87,fy:.52,img:'img/obj-panneau.webp',t:'Le fléchage',rub:'Accès et circulation',
   q:'Des flèches vers le parking, les animaux, la buvette. Qu\'est-ce que tu notes ?',
   notes:{fait:'Le fléchage existe, mais seulement à l\'intérieur du site. Le parking est dans l\'herbe, au fond, sans emplacement réservé.',avis:'C\'est mal indiqué, franchement c\'est nul.',supposition:'Les visiteurs ont dû tourner longtemps avant de réussir à se garer.'}},
  {id:'buvette',scene:'buvette',fx:.47,fy:.62,img:'img/obj-buvette.webp',t:'La buvette',rub:'Restauration et convivialité',
   q:'Il est midi, regarde autour des tables. Qu\'est-ce que tu notes ?',
   notes:{fait:'Une buvette avec des tables en bois, toutes occupées. Plusieurs personnes mangent debout ou assises sur les bottes de paille.',avis:'L\'ambiance est vraiment sympa.',supposition:'Il n\'y aura jamais assez à manger pour tout le monde.'}},
  {id:'secours',scene:'buvette',fx:.1,fy:.4,img:'img/obj-secours.webp',t:'Le point secours',rub:'Sécurité',
   q:'Bien caché, juste à côté de la scène des musiciens. Qu\'est-ce que tu notes ?',
   notes:{fait:'Un point secours près de la scène, avec une trousse et un extincteur. Des bénévoles en gilet jaune sont postés à l\'entrée.',avis:'Ça a l\'air bien sécurisé, je suis rassuré·e.',supposition:'En cas de problème, les secours arriveraient vite.'}},
  {id:'etal',scene:'stands',fx:.3,fy:.56,img:'img/obj-etal.webp',t:'Les stands de producteurs',rub:'Stands et exposants',
   q:'Fromages, légumes, miel… Qu\'est-ce que tu notes ?',
   notes:{fait:'Les stands de producteurs sont regroupés le long de l\'allée, sous des barnums. Des ardoises sont prévues pour afficher les prix.',avis:'Les produits ont l\'air trop bons.',supposition:'Les exposants ont sûrement très bien vendu ce jour-là.'}}
 ],
 paroles:[
  {x:905,y:690,t:'Il est où, le parking ?'},{x:150,y:640,t:'Goûtez-moi ça !'},{x:1090,y:520,t:'Il n\'y a plus une place assise…'},
  {x:700,y:330,t:'C\'est à quelle heure, le concours ?'},{x:330,y:380,t:'Regarde la vache !'},{x:1010,y:900,t:'On commence par quoi ?'}],
 // guirlandes d'ampoules de la vue d'ensemble : [x1,y1,x2,y2,nombre]
 guirlandes:[[452,186,700,180,9],[968,300,1150,292,8],[1010,330,1190,340,7]]
};
