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
  sosie: ["Le piège : le bolet amer", "Même allure, même chapeau brun, mais regarde : le réseau sur le pied est brun et grossier, et les pores deviennent roses. Et il est immangeable, d'une amertume qui gâche tout le plat. La chair, elle, reste blanche chez les deux."],
  pousse: {
   pluie: ["Jours 0 à 2 : il pleut", "Une bonne pluie d'automne, encore de la douceur : sous la litière, le mycélium se gorge d'eau. Rien ne dépasse."],
   pousse: ["Jours 3 à 5 : le bouchon", "Le cèpe perce la litière : pied énorme, petit chapeau serré dessus, comme un bouchon de champagne. Les tubes sont encore blancs."],
   point: ["Jours 6 à 9 : à point", "Le chapeau s'étale, les pores jaunissent, la chair est ferme. C'est le moment de cueillir, en tournant le pied."],
   vieux: ["Jours 10 à 14 : trop tard", "Les pores virent au vert olive, la chair devient molle et souvent véreuse. On le laisse : il lâche ses spores pour l'an prochain."]
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
  sosie: ["Le piège : la fausse girolle", "Dessous, des vraies lames : fines, serrées, régulièrement fourchues, qui se détachent à l'ongle. Plus orange, plus molle, elle pousse sur les débris de bois. La girolle, elle, a des plis épais qu'on ne peut pas détacher."],
  pousse: {
   pluie: ["Jours 0 à 2 : il pleut", "Après une pluie d'été ou d'automne, le mycélium se réveille sous la mousse. Il faut plusieurs jours avant de voir quelque chose."],
   pousse: ["Jours 3 à 7 : petits boutons jaunes", "De petits boutons jaune d'œuf percent la mousse, souvent en groupe. Le chapeau est encore bombé."],
   point: ["Jours 8 à 11 : à point", "Le chapeau se creuse en entonnoir, le bord ondule, les plis descendent sur le pied. Elle sent l'abricot : c'est le moment."],
   vieux: ["Jours 12 à 15 : elle vieillit", "La girolle vieillit lentement : elle brunit, se dessèche ou se gorge d'eau. Les limaces passent souvent avant toi."]
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
  sosie: ["L'erreur du couteau", "Coupée au ras du sol, elle ressemble à bien des champignons blancs : la volve reste en terre, invisible. C'est comme ça qu'on se trompe. On déterre toujours le pied en entier, à la main, pour vérifier la base."],
  pousse: {
   pluie: ["Jours 0 à 1 : il pleut", "Sous les chênes, après la pluie, le mycélium prépare ses fructifications. Rien en surface."],
   pousse: ["Jours 2 à 4 : l'œuf", "Elle sort sous la forme d'un œuf blanc, entièrement enveloppé. À ce stade, on la confond avec une vesse-de-loup. Coupe l'œuf : le petit champignon est déjà dedans."],
   point: ["Jours 5 à 9 : adulte", "L'enveloppe se déchire : le pied s'allonge, le chapeau vert olive s'étale, l'anneau pend, la volve reste à la base. C'est maintenant qu'on la confond avec un comestible."],
   vieux: ["Jours 10 à 13 : elle vieillit", "Le chapeau pâlit, les lames jaunissent, l'odeur devient écœurante. Même vieille, même sèche, elle reste mortelle."]
  }
 }
};
export const ORDRE_PHASES = ['pluie','pousse','point','vieux'];
export const NOMS_PHASES = {pluie:'Pluie',pousse:'Ça pousse',point:'À point',vieux:'Trop vieux'};
