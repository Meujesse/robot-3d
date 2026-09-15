// Démo Meujesse Learning pour Naviland Cargo : thématique « Nouvel arrivant » du plan du memento (plan V3 fourni par Naviland).
// Contenus d'étapes = bonnes pratiques générales d'intégration, à compléter et valider par les contributeurs Naviland.
// Seuls les outils cités proviennent du plan du memento ; aucun process interne n'est inventé.
export const THEMES = [
  'Introduction', "Connaître l'entreprise", 'SIRH', 'Droit du travail', 'Performance RH',
  'Recrutement', 'Nouvel arrivant', 'Finance', 'Services généraux', 'Contacts'
];

export const ETAPES = [
  {
    n: 1, cle: 'avant', titre: "Avant l'arrivée", quand: 'J-15 à J-1', couleur: '#00894F', photo: 'img/etape-1.jpg',
    phrase: "Un accueil réussi se prépare avant le premier jour. C'est ce qui fait toute la différence.",
    actions: [
      "Annoncer l'arrivée à l'équipe et présenter le futur rôle du collaborateur.",
      'Vérifier avec les RH que le dossier administratif est complet.',
      "Préparer le poste de travail, les accès et l'équipement adapté au métier.",
      "Désigner un référent dans l'équipe pour les premières semaines.",
      "Planifier la première semaine et prévoir la journée d'intégration."
    ],
    avecQui: ['RH', 'Services généraux', 'Équipe'],
    outils: [
      { nom: "Livret d'accueil Naviland Cargo", aide: "À transmettre avant l'arrivée ou le jour J." },
      { nom: "Journée d'intégration", aide: "Inscrire le nouvel arrivant à la prochaine session." },
      { nom: 'Organigramme (Navicom)', aide: 'Pour présenter qui est qui dès le premier jour.' }
    ]
  },
  {
    n: 2, cle: 'jourj', titre: 'Jour J', quand: 'Le premier jour', couleur: '#00A0E6', photo: 'img/etape-2.jpg',
    phrase: "Le premier jour, votre présence compte plus que tous les documents. Et n'oubliez pas l'accueil sécurité.",
    actions: [
      'Être présent pour accueillir le collaborateur et faire le tour du site.',
      "Présenter l'équipe, le référent et les interlocuteurs clés.",
      "Réaliser l'accueil sécurité : règles du site, risques du poste, consignes d'évacuation.",
      "Remettre le livret d'accueil et expliquer le programme des premières semaines.",
      'Vérifier que les accès et les outils fonctionnent.'
    ],
    avecQui: ['Référent', 'QHSE', 'Services généraux'],
    outils: [
      { nom: 'Règlement intérieur', aide: 'À présenter et à remettre au collaborateur.' },
      { nom: 'Affichages et registre sécurité', aide: "Supports de l'accueil sécurité sur le site." },
      { nom: 'Qualios', aide: 'Outil de management de la qualité et de la sécurité.' }
    ],
    savais: "La formation à la sécurité des nouveaux embauchés est une obligation de l'employeur (Code du travail, article L4141-2)."
  },
  {
    n: 3, cle: 'semaine', titre: 'Première semaine', quand: 'Semaine 1', couleur: '#4D4F53', photo: 'img/etape-3.jpg',
    phrase: 'Pendant la première semaine, prenez dix minutes chaque jour pour répondre à ses questions.',
    actions: [
      'Faire un point court chaque jour pour répondre aux questions.',
      'Présenter les outils du quotidien et les bonnes pratiques.',
      'Expliquer les objectifs du poste et les attentes des premiers mois.',
      'Organiser des rencontres avec les services avec lesquels il travaillera.',
      'Faire le point avec le référent en fin de semaine.'
    ],
    avecQui: ['Référent', 'Support RH', 'Équipe'],
    outils: [
      { nom: 'Portail RH', aide: 'Suivi des absences et des congés.' },
      { nom: 'Peopledoc', aide: 'Accès aux documents du collaborateur.' },
      { nom: 'Rydoo', aide: 'Notes de frais, selon la politique de frais.' }
    ]
  },
  {
    n: 4, cle: 'mois', titre: 'Premier mois', quand: 'Mois 1', couleur: '#00894F', photo: 'img/etape-4.jpg',
    phrase: "Un regard neuf est précieux : demandez-lui ce qui l'a étonné depuis son arrivée.",
    actions: [
      "Fixer ensemble deux ou trois objectifs concrets pour la période d'essai.",
      "Mener un point individuel au bout d'un mois : ce qui va, ce qui bloque.",
      "Recueillir son regard neuf : ce qui l'a étonné depuis son arrivée.",
      'Identifier ses besoins de formation.',
      "Vérifier son intégration dans l'équipe."
    ],
    avecQui: ['Collaborateur', 'Référent', 'RH'],
    outils: [
      { nom: 'Plan de développement des compétences', aide: 'Pour inscrire les besoins de formation.' },
      { nom: 'Recueil des besoins de formation', aide: "Échéance annuelle de l'agenda du manager." }
    ]
  },
  {
    n: 5, cle: 'essai', titre: "Fin de période d'essai", quand: "Avant l'échéance", couleur: '#00A0E6', photo: 'img/etape-5.jpg',
    phrase: "La fin de la période d'essai se prépare dès le premier jour, avec des objectifs clairs.",
    actions: [
      "Noter la date de fin de période d'essai et vérifier les règles applicables avec les RH.",
      'Préparer un bilan à partir des objectifs fixés.',
      'Mener un entretien de bilan avec le collaborateur.',
      'Informer les RH de votre décision dans les délais.',
      'Planifier la suite : entretiens annuels et formations.'
    ],
    avecQui: ['RH', 'Collaborateur'],
    outils: [
      { nom: 'SIRHUS', aide: 'Outil de suivi des entretiens.' },
      { nom: 'Guide EIA / EPP', aide: 'Entretiens annuels et professionnels.' }
    ],
    savais: "Pour rompre une période d'essai, l'employeur doit respecter un délai de prévenance : vérifiez-le toujours avec les RH."
  }
];

export const CONTACTS = [
  { fonction: 'Ressources humaines', pour: "Dossier administratif, contrat, période d'essai" },
  { fonction: 'QHSE', pour: 'Accueil sécurité, règles du site, Qualios' },
  { fonction: 'Services généraux', pour: 'Poste de travail, équipement, déplacements' },
  { fonction: 'Finance', pour: 'Avances et notes de frais' },
  { fonction: 'Référent désigné', pour: 'Questions du quotidien les premières semaines' }
];

export const MENTIONS = "Démo réalisée par Meujesse Learning à partir du plan du memento transmis par Naviland Cargo. Contenus d'exemple, à compléter et valider par vos contributeurs.";
