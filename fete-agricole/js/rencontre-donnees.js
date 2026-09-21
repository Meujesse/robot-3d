// Rencontre avec Camille : trois échanges, pas de bonne ni de mauvaise réponse, elle réagit à ton choix.
// La voix de Camille ne s'entend qu'à l'accueil (r1) et à la fin (r3) : entre les deux, elle parle par bulles, comme Lisa.
// dit = ce qui s'affiche (français écrit normal) · oral = ce qui est dit par la voix (français parlé, avec élisions)
window.RENCONTRE={
 etapes:[
  {pose:'salut',plan:'americain',voix:'r1',
   dit:'Salut ! Moi, c\'est Camille. Cette année, c\'est moi qui organise la Fête des Récoltes, à Combelune. Et franchement, j\'aurais bien besoin d\'un coup de main. Ça te dit ?',
   oral:'Salut ! Moi, c\'est Camille. Cette année, c\'est moi qui organise la Fête des Récoltes, à Combelune. Et franchement… j\'aurais bien besoin d\'un coup d\'main. Ça te dit ?',
   choix:[
    {t:'Carrément ! On commence par quoi ?',re:{pose:'bravo',plan:'americain',
      dit:'Ah, génial ! Je savais que je pouvais compter sur toi.',oral:'Ah, génial ! J\'savais que j\'pouvais compter sur toi.'}},
    {t:'Euh… je n\'y connais rien, moi.',re:{pose:'explique',plan:'buste',
      dit:'Ne t\'inquiète pas, moi non plus, au début ! On va y aller étape par étape.',oral:'T\'inquiète, moi non plus, au début ! On va y aller étape par étape.'}}
   ]},
  {pose:'reflechit',plan:'buste',
   dit:'Avant de réserver quoi que ce soit, il y a une chose qu\'on oublie tout le temps : regarder ce qui existe déjà. Ça s\'appelle le diagnostic. À ton avis, on s\'y prend comment ?',
   oral:'Alors, avant de réserver quoi qu\'ce soit, y a un truc qu\'on oublie tout l\'temps : regarder c\'qui existe déjà. Ça s\'appelle le diagnostic. À ton avis, on s\'y prend comment ?',
   choix:[
    {t:'On va voir sur place et on parle aux gens.',re:{pose:'bravo',plan:'buste',
      dit:'Exactement ce que je me disais. On observe, et on pose des questions.',oral:'Exactement c\'que j\'me disais. On observe, et on pose des questions.'}},
    {t:'On réserve la salle, on verra après.',re:{pose:'doute',plan:'buste',
      dit:'Ha ! J\'ai failli faire pareil. Mais si on réserve sans savoir ce que les gens attendent, on risque de se planter. On va d\'abord observer, et poser des questions.',
      oral:'Ha ! J\'ai failli faire pareil. Mais si on réserve sans savoir c\'que les gens attendent… on risque de s\'planter. On va d\'abord observer, et poser des questions.'}}
   ]},
  {pose:'telephone',plan:'americain',voix:'r3',
   dit:'Allez, je t\'emmène au village. Je te confie mon carnet de bord : tout ce que tu trouves, tu le notes dedans. Et si tu as besoin, je ne suis jamais loin !',
   oral:'Allez, j\'t\'emmène au village. J\'te confie mon carnet de bord : tout c\'que tu trouves, tu l\'notes dedans. Et si t\'as besoin, j\'suis jamais loin !',
   fin:'Direction le village'}
 ]
};
