// Micro-trottoir : trois personnes, trois façons de poser la question.
// re / bonjour = texte affiché (français écrit) · oral / oralB = texte dit par la voix (français parlé)
window.MICRO={
 types:{
  ouverte:{nom:'Question ouverte',gain:3,camille:'Question <b>ouverte</b> : la personne raconte, et toi tu récoltes. C\'est noté dans le carnet !'},
  fermee:{nom:'Question fermée',gain:1,camille:'Question <b>fermée</b> : on te répond oui ou non. Pratique pour vérifier un fait, pas pour comprendre.'},
  orientee:{nom:'Question orientée',gain:0,camille:'Question <b>orientée</b> : tu lui as soufflé la réponse. Du coup, tu ne sais pas ce qu\'elle pense vraiment.'}
 },
 gens:[
  {id:'nadia',nom:'Nadia',role:'Productrice de fromages, exposante',x:420,y:470,
   bonjour:'Bonjour ! C\'est vous qui organisez la fête cette année ? Allez-y, je vous écoute. Mais vite, j\'ai du monde !',
   oralB:'Bonjour ! C\'est vous qui organisez la fête, cette année ? Allez-y, j\'vous écoute. Mais vite, hein, j\'ai du monde !',
   questions:[
    {type:'fermee',t:'Vous aviez un stand l\'an dernier ?',voix:'n-f',re:'Oui, oui. Comme tous les ans.',oral:'Oui, oui. Comme tous les ans.'},
    {type:'orientee',t:'C\'était plutôt bien organisé l\'an dernier, non ?',voix:'n-o',re:'Euh… oui, oui. Ça allait.',oral:'Bah… oui, oui. Ça allait.'},
    {type:'ouverte',t:'Qu\'est-ce qui vous aiderait à mieux vendre le jour de la fête ?',voix:'n-v',
     re:'Déjà, de l\'électricité ! L\'an dernier, j\'ai tenu toute la journée avec des glacières, mes fromages ont souffert. Et puis être placée à l\'ombre, sur le passage. Pas au fond du champ, là où personne ne va.',
     oral:'Ah ben déjà, de l\'électricité ! L\'an dernier, j\'ai tenu toute la journée avec des glacières, mes fromages, ils ont souffert. Et puis être placée à l\'ombre, sur le passage. Pas au fond du champ, là où personne va.',
     note:'<b>Exposants :</b> il faut de l\'électricité et des emplacements à l\'ombre, sur le passage.'}
   ]},
  {id:'marcel',nom:'Marcel',role:'Habitant du village, retraité',x:800,y:520,
   bonjour:'Ah, la Fête des Récoltes ! Je n\'en ai pas raté une seule en quarante ans. Qu\'est-ce que vous voulez savoir ?',
   oralB:'Ah, la Fête des Récoltes ! J\'en ai pas raté une seule, en quarante ans. Qu\'est-ce que vous voulez savoir ?',
   questions:[
    {type:'fermee',t:'Vous venez à la fête chaque année ?',voix:'m-f',re:'Ah oui ! Tous les ans, sans faute.',oral:'Ah oui ! Tous les ans, sans faute.'},
    {type:'orientee',t:'Vous ne trouvez pas que ça fait trop de bruit, cette fête ?',voix:'m-o',re:'Oh, du bruit, du bruit… Si vous le dites.',oral:'Oh, du bruit, du bruit… Si vous l\'dites.'},
    {type:'ouverte',t:'Comment ça s\'est passé pour vous, la dernière fois ?',voix:'m-v',
     re:'Bien, bien… Mais pour se garer, quelle histoire ! Ma femme marche avec une canne, et on a dû se mettre tout au bout du pré. Et à part la buvette, il n\'y avait pas un banc pour s\'asseoir.',
     oral:'Bien, bien… Mais pour se garer, alors là, quelle histoire ! Ma femme, elle marche avec une canne, et on a dû s\'mettre tout au bout du pré. Et à part la buvette, y avait pas un banc pour s\'asseoir.',
     note:'<b>Habitants :</b> stationnement trop loin pour les personnes âgées, pas assez de bancs.'}
   ]},
  {id:'ines',nom:'Inès',role:'Lycéenne, 17 ans',x:1180,y:480,
   bonjour:'Euh… salut. C\'est pour un sondage ? OK, vas-y, mais mon car passe dans cinq minutes.',
   oralB:'Euh… salut. C\'est pour un sondage ? OK, vas-y. Mais mon car, il passe dans cinq minutes.',
   questions:[
    {type:'fermee',t:'Tu connais la Fête des Récoltes ?',voix:'i-f',re:'Oui, vite fait.',oral:'Ouais, vite fait.'},
    {type:'orientee',t:'C\'est un peu ringard pour les jeunes, non ?',voix:'i-o',re:'Euh… oui, un peu. Je ne sais pas, en vrai.',oral:'Bah… ouais, un peu. J\'sais pas, en vrai.'},
    {type:'ouverte',t:'Qu\'est-ce qui te donnerait envie de venir avec tes amis ?',voix:'i-v',
     re:'Franchement ? De la musique le soir. Et de quoi manger sans se ruiner. Et puis… qu\'on soit au courant ! L\'an dernier, je l\'ai su le lendemain. Il n\'y avait rien sur les réseaux.',
     oral:'Franchement ? De la musique le soir. Et un truc à manger pas trop cher. Et puis… qu\'on soit au courant ! L\'an dernier, j\'l\'ai su le lendemain. Y avait rien sur les réseaux.',
     note:'<b>Jeunes :</b> un concert le soir, des petits prix, et une communication sur les réseaux.'}
   ]}
 ],
 bilan:{
  titre:'Ce que ton micro-trottoir t\'apprend',
  lignes:[
   'Avec une question <b>ouverte</b>, la personne raconte : c\'est la base d\'un bon <b>entretien</b>.',
   'Une question <b>fermée</b> vérifie un fait. Elle a toute sa place dans un <b>questionnaire</b>.',
   'Une question <b>orientée</b> fausse la réponse. À éviter, toujours.'],
  camille:'Trois personnes, c\'est un début. Pour avoir l\'avis des 600 habitants, l\'entretien serait trop long : là, on passera par un <b>questionnaire</b>.'
 }
};
