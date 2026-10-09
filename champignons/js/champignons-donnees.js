// Contenus mycologiques (voir SOURCES-mycologie.md) : MycoDB, Société mycologique de France, ANSES, Wikipédia en dernier recours.
export const CHAMPIGNONS = {
 cepe: {
  nom: "Cèpe de Bordeaux", latin: "Boletus edulis", famille: "Bolétacées", statut: "Comestible, très recherché",
  piege: "Réseau brun sur le pied, pores qui rosissent, goût amer ? C'est le bolet amer (Tylopilus felleus), immangeable.",
  vue: "Le champignon entier, sol en coupe",
  etiquettes: {
   chapeau: ["Chapeau brun, bord plus clair", "Chapeau brun noisette, lisse, souvent un peu gras par temps humide, avec un liseré blanchâtre au bord. De 8 à 25 cm, convexe comme un petit pain, il s'étale en vieillissant."],
   pores: ["Pores, pas de lames", "Dessous, pas de lames : une éponge de tubes qui s'ouvrent par des pores minuscules. Blancs chez le jeune, jaune-vert puis olive avec l'âge."],
   reticulum: ["Réseau blanc sur le pied", "Un fin réseau en relief, blanc, surtout vers le haut du pied : le réticulum. Chez le bolet amer, ce réseau est brun et grossier."],
   pied: ["Pied ventru", "Pied épais, renflé comme une massue, beige clair, souvent plus gros que le chapeau chez le jeune."],
   chair: ["Chair blanche, immuable", "À la coupe, la chair est blanche, ferme, et elle ne bleuit pas. Elle reste blanche. Odeur agréable de noisette."],
   tubes: ["Couche de tubes", "Sous la chair du chapeau, la couche de tubes se détache facilement : c'est le signe d'un bolet."],
   mycelium: ["Mycélium et racine d'arbre", "Le vrai champignon est sous terre : un feutrage de filaments blancs, le mycélium, associé aux racines des chênes, hêtres ou épicéas. Le cèpe est une mycorhize."]
  },
  saisons: {
   printemps: ["Printemps : rien à voir", "Sous la litière, le mycélium vit toute l'année, accroché aux racines des arbres. Au-dessus, pas de cèpe."],
   ete: ["Été : ça se prépare", "Après les orages d'août, si la chaleur reste, le mycélium prépare ses premiers cèpes. Les cueilleurs surveillent."],
   automne: ["Septembre à novembre : la pousse", "Une dizaine de jours après une bonne pluie, les cèpes sortent : d'abord un bouchon, pied énorme et petit chapeau, puis le chapeau s'étale. C'est la pleine saison."],
   hiver: ["Hiver : repos", "Les premières gelées arrêtent la pousse. Le mycélium attend l'année prochaine, sous terre."]
  }
 },
 girolle: {
  nom: "Girolle (chanterelle commune)", latin: "Cantharellus cibarius", famille: "Cantharellacées", statut: "Comestible",
  piege: "Vraies lames fines et serrées, couleur orange vif, pousse sur du bois mort ? Méfiance : fausse girolle ou clitocybe de l'olivier, toxique.",
  vue: "Deux girolles, sol en coupe",
  etiquettes: {
   entonnoir: ["Chapeau en entonnoir", "Jaune d'œuf à jaune orangé, d'abord bombé puis creusé en entonnoir, de 3 à 10 cm."],
   marge: ["Marge ondulée", "Le bord du chapeau est irrégulier, ondulé, lobé. Jamais un cercle bien net."],
   plis: ["Plis décurrents, pas de lames", "Dessous, pas de vraies lames : des plis épais, fourchus, en relief, qui descendent le long du pied. On dit qu'ils sont décurrents."],
   pied: ["Pied plein, qui se rétrécit", "Pied plein, de la même couleur que le chapeau, qui s'amincit vers le bas. Pas d'anneau, pas de volve."],
   couleur: ["Chair blanche, odeur d'abricot", "Sous la peau jaune, la chair est blanche à jaune pâle, ferme. Elle sent l'abricot."],
   mycelium: ["Mycélium et racine d'arbre", "La girolle aussi vit en mycorhize, avec les chênes, hêtres, châtaigniers et conifères. Ce qu'on cueille n'est que le fruit du mycélium."]
  },
  saisons: {
   printemps: ["Printemps : sous terre", "Le mycélium se réveille avec les premières chaleurs, mais aucune girolle ne sort encore."],
   ete: ["Juin à août : premières girolles", "Dès juin, après les pluies, les girolles sortent dans les bois clairs, souvent en groupes serrés. C'est le champignon de l'été."],
   automne: ["Septembre-octobre : fin de saison", "Les dernières girolles poussent jusqu'aux premières gelées. Elles vieillissent lentement et brunissent."],
   hiver: ["Hiver : repos", "Plus rien en surface. Le mycélium passe l'hiver dans le sol, lié aux racines."]
  }
 },
 amanite: {
  nom: "Amanite phalloïde", latin: "Amanita phalloides", famille: "Amanitacées", statut: "MORTELLE",
  piege: "Chapeau vert et lames blanches ? Ne cherche pas la ressemblance avec un rosé des prés ou une russule verte : déterre le pied. S'il y a une volve en sac, c'est elle.",
  vue: "Le champignon entier, base enterrée",
  etiquettes: {
   chapeau: ["Chapeau vert olive, fibrilles", "Vert olive à jaune verdâtre, parfois presque blanc, soyeux, avec de fines fibrilles rayonnantes. De 5 à 15 cm, bombé puis étalé."],
   lames: ["Lames blanches, libres", "Les lames sont blanches, fines, serrées, et elles n'atteignent pas le pied : on dit qu'elles sont libres. Le rosé des prés, lui, a des lames roses puis brunes."],
   anneau: ["Anneau en jupe", "Sur le pied, une membrane blanche qui pend comme une jupe : l'anneau. C'est le reste du voile qui protégeait les lames."],
   pied: ["Pied blanc, chiné", "Pied blanc, parfois chiné de vert, élancé, avec une base renflée."],
   volve: ["Volve en sac", "À la base, un sac blanc membraneux : la volve, reste de l'enveloppe de l'œuf. C'est LE critère. Elle est souvent cachée sous la litière."],
   base: ["Base enterrée", "La volve est sous le niveau du sol. Si on coupe le pied au couteau, on la laisse en terre et on ne la voit jamais. Toujours déterrer le champignon entier."],
   mycelium: ["Mycélium", "Elle vit en mycorhize, surtout avec les chênes et les hêtres. On la trouve au même endroit chaque année."]
  },
  saisons: {
   printemps: ["Printemps : sous terre", "Pas d'amanite phalloïde au printemps. Le mycélium attend la fin de l'été."],
   ete: ["Fin d'été : l'œuf", "Elle sort d'abord sous la forme d'un œuf blanc, entièrement enveloppé. À ce stade, on peut la confondre avec une vesse-de-loup. Coupe l'œuf en deux : on voit déjà le petit champignon dedans."],
   automne: ["Septembre à novembre : pleine saison", "L'enveloppe se déchire : le pied s'allonge, le chapeau s'ouvre, l'anneau pend, et la volve reste à la base. C'est à ce moment qu'ont lieu la plupart des intoxications."],
   hiver: ["Hiver : repos", "Les gelées la font disparaître. Le mycélium, lui, est toujours là."]
  }
 }
};
export const ORDRE_SAISONS = ['printemps','ete','automne','hiver'];
export const NOMS_SAISONS = {printemps:'Printemps',ete:'Été',automne:'Automne',hiver:'Hiver'};
