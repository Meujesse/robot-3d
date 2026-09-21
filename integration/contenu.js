// Démo Meujesse Learning : micro-learning « Accueillir une recrue », extrait d'un parcours fictif pour managers.
// Contenu générique (bonnes pratiques d'intégration), sans lien avec une entreprise réelle.
export const THEMES = [
  'Poser le cadre', 'Déléguer', 'Donner du feedback', 'Entretien annuel', 'Animer une réunion',
  'Recruter', 'Accueillir une recrue', 'Gérer un conflit', 'Manager à distance', 'Reconnaître le travail'
];
export const A_QUAI = 'Accueillir une recrue';

export const ETAPES = [
  {
    n: 1, cle: 'avant', titre: 'Avant le premier jour', quand: 'Deux semaines avant', couleur: '#6a2fa8', photo: 'img/etape-1.jpg',
    phrase: "L'intégration commence avant l'arrivée. Une recrue attendue, c'est une recrue qui a déjà envie de rester.",
    actions: [
      "Envoyer un message de bienvenue : heure, lieu, personne à demander.",
      "Prévenir l'équipe : qui arrive, sur quel poste, pour quoi faire.",
      "Commander le matériel et les accès pour le premier matin.",
      "Choisir un parrain ou une marraine volontaire.",
      "Écrire le programme de la première semaine."
    ],
    avecQui: ['Ressources humaines', 'Informatique', 'Parrain ou marraine'],
    outils: [
      { nom: "Livret d'accueil", aide: "À envoyer quelques jours avant, pour qu'il soit lu au calme." },
      { nom: "Checklist d'arrivée", aide: 'Matériel, accès, badge, place de parking : rien ne doit manquer.' },
      { nom: 'Trombinoscope', aide: 'Des visages et des prénoms avant même de pousser la porte.' }
    ]
  },
  {
    n: 2, cle: 'jourj', titre: 'Le premier jour', quand: 'Jour 1', couleur: '#ef6f4a', photo: 'img/etape-2.jpg',
    phrase: "Le premier jour, bloquez votre agenda. Rien ne remplace un manager présent et disponible.",
    actions: [
      "Accueillir vous-même la personne, sans la faire attendre.",
      "Faire le tour des lieux et présenter l'équipe.",
      "Expliquer les règles de vie et les consignes de sécurité.",
      "Déjeuner ensemble, avec l'équipe si possible.",
      "Finir par dix minutes à deux : impressions et questions."
    ],
    avecQui: ['Équipe', 'Parrain ou marraine', 'Référent sécurité'],
    outils: [
      { nom: 'Programme de la première semaine', aide: 'À remettre en main propre et à commenter ensemble.' },
      { nom: 'Règlement intérieur', aide: "À présenter, pas seulement à faire signer." },
      { nom: 'Plan des locaux', aide: 'Salles, sorties de secours, espaces de pause.' }
    ],
    savais: "L'employeur doit organiser une formation pratique à la sécurité pour toute personne nouvellement embauchée (Code du travail, article L4141-2)."
  },
  {
    n: 3, cle: 'semaine', titre: 'La première semaine', quand: 'Semaine 1', couleur: '#2f7d8f', photo: 'img/etape-3.jpg',
    phrase: "Pendant cette semaine, mieux vaut dix minutes par jour qu'une heure le vendredi.",
    actions: [
      "Prendre dix minutes chaque jour pour ses questions.",
      "Confier une première mission simple, au résultat visible.",
      "Faire découvrir les outils un par un, en situation.",
      "Organiser des rencontres avec les équipes voisines.",
      "Demander son ressenti au parrain ou à la marraine."
    ],
    avecQui: ['Parrain ou marraine', 'Équipes voisines', 'Ressources humaines'],
    outils: [
      { nom: 'Guide des outils internes', aide: 'Messagerie, agenda partagé, espace documentaire.' },
      { nom: "Carte de l'organisation", aide: 'Qui fait quoi, et à qui poser quelle question.' },
      { nom: 'Fiche de poste', aide: 'Pour relier chaque découverte aux missions attendues.' }
    ]
  },
  {
    n: 4, cle: 'mois', titre: 'Le premier mois', quand: 'Mois 1', couleur: '#6a2fa8', photo: 'img/etape-4.jpg',
    phrase: "Au bout d'un mois, demandez un rapport d'étonnement. Ce regard neuf ne dure pas, profitez-en.",
    actions: [
      "Fixer ensemble deux ou trois objectifs concrets.",
      "Mener un point individuel : ce qui va, ce qui freine.",
      "Demander un rapport d'étonnement.",
      "Repérer les besoins de formation.",
      "Observer sa place dans l'équipe, ajuster si besoin."
    ],
    avecQui: ['La recrue', 'Parrain ou marraine', 'Ressources humaines'],
    outils: [
      { nom: "Trame de rapport d'étonnement", aide: 'Cinq questions ouvertes, une page maximum.' },
      { nom: 'Plan de développement des compétences', aide: 'Pour transformer un besoin en formation planifiée.' }
    ]
  },
  {
    n: 5, cle: 'essai', titre: "La fin de la période d'essai", quand: "Avant l'échéance", couleur: '#ef6f4a', photo: 'img/etape-5.jpg',
    phrase: "Une période d'essai réussie ne se décide pas la dernière semaine. Elle se construit depuis le premier jour.",
    actions: [
      "Noter l'échéance, avec une alerte trois semaines avant.",
      "Préparer le bilan à partir des objectifs fixés.",
      "Mener l'entretien de bilan : faits, progrès, vigilance.",
      "Transmettre votre décision aux RH dans les délais.",
      "Annoncer la suite : missions, formations, rendez-vous."
    ],
    avecQui: ['Ressources humaines', 'La recrue'],
    outils: [
      { nom: "Grille de bilan de période d'essai", aide: 'Les mêmes critères pour toutes les recrues.' },
      { nom: "Calendrier des entretiens", aide: 'Pour enchaîner sur le suivi annuel sans rupture.' }
    ],
    savais: "Rompre une période d'essai impose un délai de prévenance, qui dépend du temps de présence. Vérifiez-le toujours avec les ressources humaines."
  }
];

export const CONTACTS = [
  { fonction: 'Ressources humaines', pour: "Contrat, dossier administratif, période d'essai" },
  { fonction: 'Informatique', pour: 'Matériel, comptes et accès' },
  { fonction: 'Référent sécurité', pour: 'Consignes, visite des lieux, équipements' },
  { fonction: 'Services généraux', pour: 'Badge, poste de travail, déplacements' },
  { fonction: 'Parrain ou marraine', pour: 'Questions du quotidien pendant les premières semaines' }
];

export const MENTIONS = "Démo réalisée par Meujesse Learning. Entreprise et contenus fictifs, donnés à titre d'exemple.";
