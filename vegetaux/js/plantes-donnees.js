// Contenus botaniques vérifiés (voir SOURCES-botanique.md) : Tela Botanica, Floriscope, SNHF,
// Virginia Tech Dendrology, NC State Extension, G. Hanks « Narcissus Manual » (AHDB 2013), listes CNRV 2026 (Valhor/Unep).
export const PLANTES = {
 ginkgo: {
  nom: "Arbre aux quarante écus", latin: "Ginkgo biloba", famille: "Ginkgoacées",
  piege: "Ce n'est pas un conifère, même si de vieilles listes le rangent avec eux : c'est une gymnosperme à part.",
  vue: "Un rameau, à l'échelle de la main",
  etiquettes: {
   feuille: ["Feuille en éventail", "Limbe en éventail, souvent fendu en deux lobes (d'où biloba), 5 à 8 cm, sur un long pétiole. Aucune nervure centrale : les nervures partent de la base et se divisent en deux."],
   court: ["Rameau court", "Sur le bois de deux ans et plus, les feuilles sortent en bouquets de 3 à 5 au bout de petits moignons : les rameaux courts."],
   long: ["Pousse de l'année", "Sur la pousse longue de l'année, les feuilles sont alternes."],
   graine: ["Graine nue", "Pas de fleur, pas de vrai fruit : sur un pied femelle, les ovules nus deviennent des graines charnues jaune-orangé (2 à 3 cm) qui sentent le beurre rance une fois tombées."],
   bourgeon: ["Bourgeon en dôme", "En hiver, rameaux gris hérissés de rameaux courts, bourgeons largement coniques à en dôme."],
   ecorce: ["Rameau âgé", "Rameaux brun-rouge clair qui deviennent gris. L'écorce du tronc, lisse jeune, se creuse ensuite de sillons verticaux."],
   chair: ["Enveloppe charnue", "La couche externe de la graine, jaune-orangé et charnue. C'est elle qui sent le beurre rance une fois la graine tombée au sol."],
   coque: ["Coque dure", "Sous la chair, une coque dure de couleur crème protège l'intérieur. Aucun ovaire autour : la graine est nue, c'est la marque d'une gymnosperme."],
   amande: ["Amande", "Au cœur de la coque, l'amande contient les réserves de la graine."]
  },
  saisons: {
   printemps: ["Mars-avril : débourrement", "Les jeunes feuilles vert tendre sortent des rameaux courts. L'espèce est dioïque : pieds mâles à chatons polliniques, pieds femelles à ovules nus. Pollinisation en mars-avril."],
   ete: ["Été : feuillage vert", "Feuillage vert franc. Sur les pieds femelles, les ovules pollinisés grossissent au bout de leur long pédoncule."],
   automne: ["Automne : l'or et l'odeur", "Tout l'arbre passe au jaune d'or puis perd ses feuilles : il est caduc. Les graines mûrissent de septembre à novembre et sentent le beurre rance au sol."],
   hiver: ["Hiver : le reconnaître sans feuilles", "Plus de feuilles, mais un indice fiable : des rameaux gris hérissés de rameaux courts, avec des bourgeons en dôme."]
  }
 },
 narcisse: {
  nom: "Jonquille (narcisse trompette)", latin: "Narcissus pseudonarcissus", famille: "Amaryllidacées",
  piege: "Anciennement classé dans les Liliacées : aujourd'hui on dit Amaryllidacées.",
  vue: "La plante entière, sol en coupe",
  etiquettes: {
   couronne: ["Couronne (paracorolle)", "La trompette au centre de la fleur. Chez la jonquille, elle est aussi longue que les tépales."],
   tepales: ["6 tépales", "Six tépales jaune pâle autour de la couronne. Fleur solitaire, penchée, de 4 à 6 cm."],
   spathe: ["Spathe", "Petite membrane sèche comme du papier sous la fleur : elle protégeait le bouton avant l'ouverture."],
   ovaire: ["Ovaire infère", "Le renflement vert placé sous les tépales : l'ovaire est infère, à 3 loges. Il deviendra une capsule sèche."],
   hampe: ["Hampe florale", "La tige qui porte la fleur n'a aucune feuille. Elle est creuse, lisse et un peu aplatie."],
   feuilles: ["Feuilles basales", "Toutes partent du sol : longues, plates, linéaires, un peu charnues, vert bleuté."],
   tunique: ["Tunique", "La peau sèche brune du bulbe : ce sont les écailles les plus externes, vidées de leurs réserves."],
   ecailles: ["Écailles charnues", "Emboîtées comme un oignon : ce sont des bases de feuilles restées charnues et de vraies écailles, gorgées de réserves."],
   bourgeon: ["Bourgeon central", "Au centre du bulbe, la fleur de l'an prochain est déjà formée dès la fin de l'été, entourée des jeunes feuilles."],
   plateau: ["Plateau", "Le disque à la base du bulbe : c'est une tige très raccourcie. Il porte les racines dessous et les écailles dessus."],
   racines: ["Racines adventives", "Elles naissent en couronne sur le bord du plateau."]
  },
  saisons: {
   printemps: ["Fin février à avril : floraison", "Feuilles et hampe sortent, la fleur s'ouvre. Pendant et juste après la floraison, le bulbe grossit : il se renouvelle par le centre."],
   ete: ["Mai-août : repos apparent", "Les feuilles jaunissent puis disparaissent. Mais dans le bulbe, la fleur de l'année suivante se forme. D'où la règle : laisser le feuillage environ deux mois après la floraison."],
   automne: ["Octobre : enracinement", "Planté vers 15 cm de profondeur, le bulbe émet vite ses racines. La pousse continue de grandir à l'intérieur du bulbe."],
   hiver: ["Hiver : le froid est nécessaire", "Le narcisse doit passer une période de froid avant de pousser vite et de fleurir au printemps."]
  }
 },
 lavande: {
  nom: "Lavande vraie", latin: "Lavandula angustifolia", famille: "Lamiacées",
  piege: "Épi ramifié et feuilles plus larges ? Méfiance, c'est sans doute un lavandin (Lavandula × intermedia).",
  vue: "Une touffe, à l'échelle réelle",
  etiquettes: {
   epi: ["Épi terminal", "Petites fleurs bleu-violet groupées en glomérules, qui forment un épi de 2 à 8 cm au bout de la tige."],
   hampe: ["Longue tige nue", "L'épi est porté par une longue tige fine sans feuille (10 à 30 cm), non ramifiée chez la lavande vraie."],
   tige: ["Tige carrée", "Tige quadrangulaire : avec les feuilles opposées, c'est le réflexe Lamiacées (comme le romarin ou la sauge)."],
   feuilles: ["Feuilles opposées étroites", "Linéaires à lancéolées, 2,5 à 4,5 cm, gris-vert, persistantes. Angustifolia veut dire « à feuilles étroites »."],
   base: ["Base ligneuse", "Sous-arbrisseau en touffe basse de 30 à 60 cm : les tiges deviennent ligneuses à la base."],
   fleur: ["Fleur à deux lèvres", "Chaque petite fleur a une corolle bilabiée et 4 étamines. Le fruit est un tétrakène."],
   coupe: ["Tige coupée", "En coupe, la tige a quatre côtés et quatre angles : elle est carrée. Les deux feuilles partent face à face, au même niveau : elles sont opposées."]
  },
  saisons: {
   printemps: ["Printemps : nouvelles pousses", "De jeunes tiges gris-vert repartent de la base ligneuse. Pas encore d'épis."],
   ete: ["Juin-juillet : floraison", "Les épis bleu-violet s'ouvrent au bout des longues tiges nues. Pollinisation par les insectes."],
   automne: ["Après la floraison", "Les épis se fanent. Les fruits, des tétrakènes, se forment dans les calices."],
   hiver: ["Hiver : feuillage persistant", "La touffe reste gris-vert tout l'hiver : les feuilles ne tombent pas."]
  }
 }
};
export const ORDRE_SAISONS = ['printemps','ete','automne','hiver'];
export const NOMS_SAISONS = {printemps:'Printemps',ete:'Été',automne:'Automne',hiver:'Hiver'};
