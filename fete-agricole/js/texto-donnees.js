// Conversation par messages avec Camille : le quiz de fin de chapitre, déguisé.
// Message de Camille : {t:'texte'} · {v:'id audio', t:'transcription écrite', oral:'texte dit par la voix', s:durée} · {photo:'fichier', legende}
// À l'écrit, Camille écrit normalement. Seuls les vocaux (champ oral) sont en français parlé.
window.TEXTO={
 contact:{nom:'Camille',statut:'en ligne',photo:'img/camille-profil.jpg'},
 accroche:{titre:'Camille',texte:'Tu es là ? J\'ai repris toutes nos notes 👀'},
 ouverture:[
  {t:'Coucou ! 👋'},
  {t:'J\'ai repris toutes nos notes de la journée. Il y a deux ou trois points que je veux vérifier avec toi avant d\'en parler à l\'asso.'},
  {t:'Je peux t\'envoyer des vocaux ? Je vais plus vite qu\'à l\'écrit 😅'}
 ],
 accordVocaux:{
  choix:[
   {t:'Vas-y, envoie tes vocaux !',vocaux:true,re:[{t:'Top, merci ! 🎙️'}]},
   {t:'Plutôt par écrit, je ne suis pas au calme.',vocaux:false,re:[{t:'Aucun souci, je t\'écris tout 👍'}]},
   {t:'Comme tu veux, les deux me vont.',vocaux:true,re:[{t:'Alors je t\'en envoie un ou deux, pas plus, promis 😄'}]}
  ]
 },
 questions:[
  {id:'diag',theme:'À quoi sert le diagnostic',
   camille:[
    {v:'t-q1',s:11,
     t:'Le président de l\'asso veut qu\'on réserve le chapiteau dès demain. Moi, je lui ai dit qu\'on devait d\'abord faire un diagnostic. Et là, il me demande à quoi ça sert… Je lui réponds quoi, à ton avis ?',
     oral:'Alors. Le président de l\'asso, il veut qu\'on réserve le chapiteau dès demain. Moi, j\'lui ai dit qu\'on devait d\'abord faire un diagnostic. Et là, il me demande à quoi ça sert… J\'lui réponds quoi, à ton avis ?'}
   ],
   choix:[
    {t:'Que ça sert à comprendre la situation avant d\'agir : le lieu, les gens, le territoire.',ok:true,
     re:[{t:'Oui, voilà ! 🙌'},{t:'C\'est exactement ça. Je lui envoie tel quel.'}]},
    {t:'Que c\'est obligatoire pour toucher les subventions.',
     re:[{t:'Hmm… tu es sûr·e, là ? 🤔'},{t:'Je ne crois pas que ce soit une histoire de paperasse. Dans mes notes, j\'ai : « avant d\'agir, il faut comprendre la situation ». C\'est ça, le rôle du diagnostic.'}]},
    {t:'Que ça sert à faire le point une fois la fête terminée.',
     re:[{t:'Euh… ça, c\'est le bilan 😄'},{t:'Le diagnostic, c\'est AVANT. On regarde la situation pour décider ensuite : le lieu, les gens, le territoire.'}]}
   ],bonne:'Le diagnostic sert à comprendre la situation avant d\'agir. Il peut être technique, social ou de territoire.'},

  {id:'grille',theme:'Choisir la bonne méthode pour repérer un lieu',
   camille:[
    {t:'Tiens, regarde ce que m\'a envoyé une copine. La fête du village d\'à côté, l\'an dernier… 😬'},
    {photo:'img/fete-ratee.jpg',legende:'« On avait choisi le terrain sur plan. » 🙃'},
    {t:'Un champ en pente, zéro parking, pas un panneau. Je ne veux pas que ça nous arrive. Pour aller repérer le champ de foire, j\'utilise quoi ?'}
   ],
   choix:[
    {t:'Une grille d\'observation : tu vas sur place et tu notes ce que tu vois.',ok:true,
     re:[{t:'Oui ! Comme on a fait tout à l\'heure 👀'},{t:'J\'imprime la grille et j\'y vais samedi : accès, stationnement, sécurité, tout y passe.'}]},
    {t:'Un questionnaire envoyé aux habitants.',
     re:[{t:'Mmh, pas sûre… 🤔'},{t:'Les habitants peuvent me donner leur avis, mais pour savoir si le terrain est en pente ou s\'il y a de la place pour se garer, il faut que j\'aille voir. Donc : la grille d\'observation.'}]},
    {t:'Un entretien avec le propriétaire du terrain.',
     re:[{t:'Ça peut aider, mais ça ne suffira pas 😅'},{t:'Il va forcément me dire que son terrain est parfait. Pour repérer un lieu, le mieux est d\'y aller avec une grille d\'observation.'}]}
   ],bonne:'Pour prospecter un lieu, on observe sur place avec une grille d\'observation.'},

  {id:'combien',theme:'Les 7 questions du CQQCOQP',
   camille:[
    {t:'OK, suivant. Dans mon carnet, j\'ai noté : « 40 exposants espérés, 800 visiteurs, budget serré ».'},
    {t:'Ça répond à quelle question, déjà ? Je me mélange toujours 🙈'}
   ],
   choix:[
    {t:'À « Combien ? »',ok:true,
     re:[{t:'Mais oui, évidemment 😄'},{t:'Combien de monde, combien d\'exposants, combien d\'argent. Merci !'}]},
    {t:'À « Comment ? »',
     re:[{t:'Ah, j\'aurais dit pareil… mais non 😅'},{t:'« Comment », c\'est l\'organisation : les bénévoles, le matériel. Là, ce ne sont que des chiffres, donc c\'est « Combien ? ».'}]},
    {t:'À « Quoi ? »',
     re:[{t:'Tu es sûr·e ? 🤔'},{t:'« Quoi », c\'est le projet lui-même : une fête agricole d\'une journée. Des exposants, des visiteurs, un budget… ce sont des quantités. Donc « Combien ? ».'}]}
   ],bonne:'Les quantités (exposants, visiteurs, budget) répondent à la question « Combien ? ».'},

  {id:'entretien',theme:'Recueillir des avis détaillés',
   camille:[
    {v:'t-q4',s:10,
     t:'Autre chose. J\'aimerais vraiment comprendre ce que les producteurs et nos partenaires attendent de la fête. Leurs besoins, leurs craintes, tout ça, dans le détail. Je m\'y prends comment ?',
     oral:'Autre chose. J\'aimerais vraiment comprendre c\'que les producteurs et nos partenaires attendent de la fête. Leurs besoins, leurs craintes, tout ça, dans l\'détail. J\'m\'y prends comment ?'}
   ],
   choix:[
    {t:'Tu les rencontres un par un, en entretien, avec des questions ouvertes.',ok:true,
     re:[{t:'C\'est ce que je sentais 👌'},{t:'Un entretien, ça laisse le temps de creuser. Je prépare mon guide avec des questions ouvertes.'}]},
    {t:'Tu leur envoies un questionnaire à cases à cocher.',
     re:[{t:'Hmm, j\'hésite… 🤔'},{t:'Avec des cases à cocher, j\'aurai des réponses rapides, mais pas les nuances. Pour du détaillé, il faut que je les voie en entretien.'}]},
    {t:'Tu les observes pendant le marché du samedi.',
     re:[{t:'Ça ne me dira pas ce qu\'ils pensent 😅'},{t:'En observant, je vois ce qu\'ils font, pas ce qu\'ils attendent. Pour ça, il n\'y a que l\'entretien.'}]}
   ],bonne:'Pour des informations détaillées et nuancées, on choisit l\'entretien.'},

  {id:'questionnaire',theme:'Interroger beaucoup de monde',
   camille:[
    {t:'Dernière question et je te laisse tranquille 🙏'},
    {t:'On a déjà 60 bénévoles inscrits. Il faut que je connaisse leurs disponibilités, leur expérience, leurs envies, pour faire les équipes. Je fais ça comment ?'}
   ],
   choix:[
    {t:'Avec un questionnaire : les mêmes questions pour tout le monde, et tu tries les réponses.',ok:true,
     re:[{t:'Parfait ✅'},{t:'Un questionnaire en ligne, dix questions maximum, et j\'ai mes équipes en une soirée.'}]},
    {t:'Avec un entretien d\'une demi-heure par bénévole.',
     re:[{t:'Trente heures d\'entretiens ?! 😱'},{t:'Je n\'aurai jamais le temps. Quand il y a beaucoup de monde et des infos simples à récolter, c\'est le questionnaire qu\'il faut.'}]},
    {t:'Avec une grille d\'observation pendant la réunion des bénévoles.',
     re:[{t:'Mmh… 🤔'},{t:'Je ne peux pas deviner leurs disponibilités en les regardant ! Là, il faut leur poser la question à tous : donc un questionnaire.'}]}
   ],bonne:'Pour organiser beaucoup de personnes avec des informations simples, on choisit le questionnaire.'}
 ],
 fins:{
  haut:{seuil:4,messages:[{v:'t-fin-haut',s:8,
    t:'Franchement, merci. Grâce à toi, j\'y vois très clair. On a un vrai diagnostic, et je sais quelle méthode utiliser à chaque fois. On va la réussir, cette fête !',
    oral:'Franchement, merci. Grâce à toi, j\'y vois super clair. On a un vrai diagnostic, et j\'sais quelle méthode utiliser à chaque fois. On va la réussir, cette fête !'},{t:'Je t\'envoie le récap 👇'}]},
  moyen:{seuil:2,messages:[{v:'t-fin-moyen',s:10,
    t:'Merci pour ton aide ! On s\'est un peu emmêlé les pinceaux sur une ou deux questions, mais c\'est en discutant qu\'on y voit clair. Jette un œil au récap, tout est dedans.',
    oral:'Merci pour ton aide ! On s\'est un peu emmêlé les pinceaux sur une ou deux questions, mais c\'est en discutant qu\'on y voit clair. Jette un œil au récap, tout est d\'dans.'},{t:'Le voilà 👇'}]},
  bas:{seuil:0,messages:[{v:'t-fin-bas',s:8,
    t:'Bon… on a encore quelques points à revoir, tous les deux. Ce n\'est pas grave, c\'est pour ça qu\'on se pose les questions avant ! Regarde le récap, et on refait le point quand tu veux.',
    oral:'Bon… on a encore quelques trucs à revoir, tous les deux. C\'est pas grave, c\'est pour ça qu\'on s\'pose les questions avant ! Regarde le récap, et on r\'fait l\'point quand tu veux.'},{t:'Tiens 👇'}]}
 },
 // Les autres discussions : on peut les lire, pas y répondre.
 autres:[
  {id:'asso',nom:'Asso Fête des Récoltes',sous:'Camille, Bernard, Lucie, Théo et 14 autres',av:'🎪',coul:'#f6c445',apercu:'Réunion jeudi 19 h à la mairie',
   messages:[
    {de:'Bernard (président)',t:'Bonjour à tous ! Pour le chapiteau, j\'ai un devis. Il faut répondre avant vendredi.',h:'09:12'},
    {de:'Lucie',t:'On est sûrs du lieu, déjà ? L\'an dernier, le parking a été une galère.',h:'09:20'},
    {de:'Camille',t:'Justement, je fais le diagnostic cette semaine : observation sur place et entretiens. Je vous présente tout jeudi.',h:'09:31'},
    {de:'Théo',t:'Je peux aider pour le questionnaire aux bénévoles 🙋',h:'09:40'},
    {de:'Bernard (président)',t:'Très bien. On ne signe rien avant jeudi, alors.',h:'10:02'},
    {de:'Lucie',t:'Réunion jeudi 19 h à la mairie 📌',h:'10:05'}]},
  {id:'mairie',nom:'Mairie de Combelune',sous:'Secrétariat · transféré par Camille',av:'🏛️',coul:'#8fd0e8',apercu:'Le champ de foire est libre le 21.',
   messages:[
    {de:'Camille',t:'Bonjour, est-ce que le champ de foire est disponible le dimanche 21 septembre ? C\'est pour la Fête des Récoltes.',h:'Hier'},
    {de:'Mairie de Combelune',t:'Bonjour Camille. Le champ de foire est libre le 21.',h:'Hier'},
    {de:'Mairie de Combelune',t:'Pensez à nous transmettre le plan d\'accès et de stationnement un mois avant, pour l\'arrêté municipal.',h:'Hier'},
    {de:'Camille',t:'C\'est noté, merci ! Je passe repérer le terrain samedi.',h:'Hier'}]},
  {id:'nadia',nom:'Nadia (fromagerie)',sous:'Groupe exposants',av:'🧀',coul:'#ef6f4a',apercu:'Je prends un stand, c\'est sûr !',
   messages:[
    {de:'Camille',t:'Bonjour Nadia ! Merci pour l\'échange de ce matin sur le marché.',h:'11:48'},
    {de:'Nadia',t:'Avec plaisir. Et n\'oubliez pas l\'électricité, hein 😉',h:'11:52'},
    {de:'Camille',t:'C\'est en haut de ma liste !',h:'11:53'},
    {de:'Nadia',t:'Je prends un stand, c\'est sûr !',h:'11:55'}]}
 ]
};
