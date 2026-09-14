// Contenus des fiches : uniquement des informations publiques (sources en bas de page et sur la fiche).
export const METAUX = {
  orjaune: { nom: 'Or 18 carats jaune', court: 'or jaune 18 carats', famille: 'or', couleur: 0xe9b95c, rugo: 0.16, precieux: 4,
    compo: "75 % d'or pur, 12,5 % d'argent et 12,5 % de cuivre. On dit aussi « or 750 millièmes ».",
    pourquoi: "L'or est rare et il ne rouille pas. Pur (24 carats), il est trop mou : on l'allie à d'autres métaux pour qu'il résiste.",
    usage: "Alliances et bagues de fiançailles. 50 ans de mariage, ce sont les noces d'or.",
    prix: "Cours du 14 septembre 2026 : 120 € le gramme d'or pur, environ 90 € le gramme d'or 18 carats. Une bague de 4 g contient donc environ 360 € de métal, sans compter le travail de l'artisan." },
  orrose: { nom: 'Or 18 carats rose', court: 'or rose 18 carats', famille: 'or', couleur: 0xe3a38a, rugo: 0.16, precieux: 4,
    compo: "75 % d'or pur, 20 % de cuivre et 5 % d'argent. C'est le cuivre qui donne la teinte rosée.",
    pourquoi: "Même quantité d'or que l'or jaune, donc même valeur de métal : seule la couleur change.",
    usage: "Très apprécié pour les bagues de fiançailles et les bijoux modernes.",
    prix: "Cours du 14 septembre 2026 : environ 90 € le gramme d'or 18 carats, soit environ 360 € de métal pour une bague de 4 g." },
  orblanc: { nom: 'Or 18 carats blanc', court: 'or blanc 18 carats', famille: 'or', couleur: 0xe8e6e1, rugo: 0.1, precieux: 4,
    compo: "75 % d'or pur, avec de l'argent, du cuivre et du palladium. On le recouvre souvent d'une fine couche de rhodium pour un blanc éclatant.",
    pourquoi: "C'est le palladium qui blanchit l'or. Le rhodium, métal de la famille du platine, le rend très brillant.",
    usage: "Solitaires et bagues serties de diamants, dont il fait ressortir la blancheur.",
    prix: "Cours du 14 septembre 2026 : environ 90 € le gramme d'or 18 carats, soit environ 360 € de métal pour une bague de 4 g." },
  argent: { nom: 'Argent 925', court: 'argent 925', famille: 'argent', couleur: 0xd7d9dd, rugo: 0.22, precieux: 2,
    compo: "92,5 % d'argent pur et 7,5 % d'autres métaux, souvent du cuivre. On l'appelle aussi « argent sterling ».",
    pourquoi: "C'est un métal précieux, plus abondant que l'or. Il est blanc et très lumineux, mais il peut noircir : un polissage lui rend son éclat.",
    usage: "Bijoux du quotidien et créations de jeunes créateurs. 25 ans de mariage, ce sont les noces d'argent.",
    prix: "Cours du 15 septembre 2026 : environ 1,80 € le gramme d'argent pur. Une bague de 4 g contient donc environ 7 € de métal." },
  titane: { nom: 'Titane', court: 'titane', famille: 'titane', couleur: 0x8f9398, rugo: 0.3, precieux: 1,
    compo: "Un métal gris très léger : environ 4,5 g par cm³, contre 19,3 g pour l'or pur.",
    pourquoi: "Ce n'est pas un métal précieux. On l'aime pour sa solidité, sa légèreté et parce qu'il est hypoallergénique : il ne contient pas de nickel.",
    usage: "Alliances modernes, bagues pour homme, bijoux de piercing.",
    prix: "Bien moins cher que l'or : on paie surtout le temps d'usinage.",
    special: "Le titane fondu est difficile à maîtriser. Le bijoutier taille donc la bague dans un tube, au tour, au lieu de la souder." },
  plaque: { nom: 'Plaqué or', court: 'plaqué or', famille: 'plaque', couleur: 0xe5b75e, rugo: 0.18, precieux: 1.5, base: 0xb39245,
    compo: "Un métal de base, souvent du laiton ou de l'argent, recouvert d'une couche d'or véritable.",
    pourquoi: "En France, l'appellation « plaqué or » exige au moins 3 microns d'or. En dessous, on doit dire « doré ».",
    usage: "Bijoux fantaisie accessibles. Un plaqué or de 3 microns tient environ 5 à 10 ans.",
    prix: "Le prix dépend surtout du métal de base : c'est l'option la plus abordable qui ait l'aspect de l'or." },
};

export const PIERRES = {
  diamant: { nom: 'Diamant', couleur: 0xffffff, ior: 2.42, durete: 10, taille: 'brillant',
    compo: "Du carbone pur, cristallisé.",
    couleurTxt: "Normalement incolore ou légèrement jaune.",
    durTxt: "10 sur 10 à l'échelle de Mohs : c'est le minéral le plus dur qui existe.",
    symbole: "La pierre des bagues de fiançailles. 60 ans de mariage, ce sont les noces de diamant.",
    conseil: "Les griffes laissent entrer la lumière de tous les côtés : le diamant brille davantage." },
  rubis: { nom: 'Rubis', couleur: 0xc8102e, ior: 1.77, durete: 9, taille: 'brillant',
    compo: "Un corindon, le même minéral que le saphir.",
    couleurTxt: "Son rouge vient du chrome présent dans le cristal.",
    durTxt: "9 sur 10 à l'échelle de Mohs : assez résistant pour être porté tous les jours.",
    symbole: "La pierre de la passion. 35 ans de mariage, ce sont les noces de rubis.",
    conseil: "Griffes ou serti clos : sa dureté lui permet les deux." },
  emeraude: { nom: 'Émeraude', couleur: 0x0f9a57, ior: 1.58, durete: 7.5, taille: 'emeraude',
    compo: "Un béryl vert.",
    couleurTxt: "Son vert vient du chrome ou du vanadium.",
    durTxt: "7,5 sur 10 à l'échelle de Mohs : la plus délicate des pierres précieuses.",
    symbole: "L'espérance et la fidélité. 40 ans de mariage, ce sont les noces d'émeraude.",
    conseil: "On la protège avec un serti clos ou des griffes épaisses." },
};

export const NOMBRES = {
  1: { nom: 'Solitaire', txt: "Une seule pierre, mise en valeur au centre : le modèle classique des bagues de fiançailles." },
  2: { nom: 'Toi et moi', txt: "Deux pierres côte à côte, comme deux personnes réunies." },
  3: { nom: 'Trilogie', txt: "Trois pierres alignées, la plus grande au centre." },
};

export const SERTIS = {
  griffes: { nom: 'Serti griffes', txt: "Au moins 3 petites griffes, souvent 4 à 6, rabattues sur la pierre. Elles laissent passer la lumière : la pierre brille au maximum. Il faut les faire resserrer de temps en temps." },
  clos: { nom: 'Serti clos', txt: "Un fin bandeau de métal entoure toute la pierre et se rabat sur son bord. C'est le serti le plus protecteur pour une bague portée tous les jours." },
};

export const OUTILS = {
  scier:   { outil: 'Scie bocfil',  img: 'img/outil-scie.png',       geste: 'Scier le fil',        txt: "La scie bocfil coupe le fil de métal à la bonne longueur." },
  cintrer: { outil: 'Triboulet',    img: 'img/outil-triboulet.png',  geste: "Former l'anneau",     txt: "On enroule le fil autour du triboulet, le cône en acier qui donne la taille." },
  souder:  { outil: 'Chalumeau',    img: 'img/outil-chalumeau.png',  geste: 'Souder la fente',     txt: "Le chalumeau referme l'anneau." },
  usiner:  { outil: 'Tour à métaux', img: 'img/outil-tour.png',      geste: 'Tailler au tour',     txt: "Le tour fait tourner un tube de titane pendant que l'outil le coupe et le creuse." },
  polir:   { outil: 'Polissoir',    img: 'img/outil-polissoir.png',  geste: 'Polir',               txt: "Le polissoir fait briller le métal." },
  dorer:   { outil: 'Bain de dorure', img: 'img/outil-bain.png',     geste: "Déposer l'or",        txt: "Dans le bain, un courant électrique dépose une couche d'or sur le métal de base : c'est l'électrolyse." },
  sertir:  { outil: 'Échoppe',      img: 'img/outil-echoppe.png',    geste: 'Sertir',              txt: "L'échoppe prépare la place de la pierre, puis le métal est rabattu pour la tenir." },
};

export function etapesPour(famille) {
  if (famille === 'titane') return ['usiner', 'sertir', 'polir'];
  if (famille === 'plaque') return ['scier', 'cintrer', 'souder', 'polir', 'dorer', 'sertir'];
  return ['scier', 'cintrer', 'souder', 'sertir', 'polir'];
}

export const SOURCES = "Sources : cours de l'or et de l'argent (gold.fr, achat-or-et-argent.fr, septembre 2026) ; alliages de l'or 18 carats (bdor.fr, poincon22.com) ; plaqué or (economie.gouv.fr, DGCCRF) ; titane (bijouxcouple.fr, bijoux-titane-france.fr) ; échelle de Mohs (cookson-clal.com) ; composition des pierres (Encyclopædia Universalis) ; noces de mariage (jeretiens.net) ; sertis (bijoutier-joaillier.fr, aupiho.com) ; métiers (institut-savoirfaire.fr).";
