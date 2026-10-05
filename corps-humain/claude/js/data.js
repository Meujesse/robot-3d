// Contenus pédagogiques (français) : rôle, anecdote, légendes d'animation, greffe.
// Vue de face : la droite du patient est à gauche de l'écran.

export const ORGANS = {
  coeur: {
    name: 'Le cœur', short: 'Cœur', color: '#E63946',
    role: "Le cœur est un muscle creux, gros comme un poing, qui fonctionne comme une double pompe. Le côté droit envoie le sang vers les poumons, le côté gauche le propulse dans tout le corps. Au repos, il bat 60 à 80 fois par minute.",
    fact: "Il pèse environ 300 g et bat plus de 100 000 fois par jour.",
    captions: [
      "Le sang pauvre en oxygène (bleu) revient au cœur droit par les veines caves.",
      "Le cœur droit l'envoie aux poumons, où il se recharge en oxygène.",
      "Le cœur gauche propulse le sang oxygéné (rouge) dans l'aorte, vers tout le corps."
    ],
    legend: [['#E63946', 'Sang riche en oxygène'], ['#4F72C9', 'Sang pauvre en oxygène']],
    greffe: { ok: true, article: 'le cœur', delay: 'environ 4 heures' }
  },
  'poumon-droit': {
    name: 'Le poumon droit', short: 'Poumon droit', color: '#F39C93',
    role: "Les poumons font passer l'oxygène de l'air dans le sang et rejettent le gaz carbonique. Le poumon droit, un peu plus gros que le gauche, compte trois lobes. L'air y arrive jusqu'à des millions de minuscules sacs : les alvéoles.",
    fact: "Déplissées, les alvéoles des deux poumons couvriraient environ 70 m², la surface d'un appartement.",
    captions: [
      "Inspiration : le diaphragme descend, les poumons se gonflent d'air.",
      "Dans les alvéoles, l'oxygène passe dans le sang.",
      "Expiration : l'air chargé en gaz carbonique ressort."
    ],
    legend: [['#7CC4F0', 'Air inspiré (oxygène)'], ['#A99BCB', 'Air expiré (gaz carbonique)']],
    greffe: { ok: true, article: 'le poumon', delay: 'environ 6 à 8 heures', note4: "On greffe souvent les deux poumons en même temps." }
  },
  'poumon-gauche': {
    name: 'Le poumon gauche', short: 'Poumon gauche', color: '#F39C93',
    role: "Les poumons font passer l'oxygène de l'air dans le sang et rejettent le gaz carbonique. Le poumon gauche n'a que deux lobes : il laisse de la place au cœur, logé dans une petite échancrure.",
    fact: "Nous respirons environ 12 à 20 fois par minute au repos, sans y penser.",
    captions: [
      "Inspiration : le diaphragme descend, les poumons se gonflent d'air.",
      "Dans les alvéoles, l'oxygène passe dans le sang.",
      "Expiration : l'air chargé en gaz carbonique ressort."
    ],
    legend: [['#7CC4F0', 'Air inspiré (oxygène)'], ['#A99BCB', 'Air expiré (gaz carbonique)']],
    greffe: { ok: true, article: 'le poumon', delay: 'environ 6 à 8 heures', note4: "On greffe souvent les deux poumons en même temps." }
  },
  foie: {
    name: 'Le foie', short: 'Foie', color: '#B9583E',
    role: "Le foie est le plus gros organe interne : il pèse environ 1,5 kg. Il trie et transforme ce que les intestins absorbent, stocke de l'énergie et neutralise les substances toxiques. Il fabrique aussi la bile, qui aide à digérer les graisses.",
    fact: "Le foie peut se régénérer : on peut donc greffer une partie seulement d'un foie.",
    captions: [
      "Le sang venu des intestins arrive au foie par la veine porte.",
      "Le foie trie : il garde les nutriments utiles et neutralise les toxines.",
      "Il fabrique la bile (vert), stockée dans la vésicule biliaire."
    ],
    legend: [['#C9A227', 'Nutriments et toxines'], ['#4F72C9', 'Sang filtré'], ['#7CB66A', 'Bile']],
    greffe: { ok: true, article: 'le foie', delay: 'environ 10 à 12 heures', living: "Une partie du foie peut aussi être donnée de son vivant à un proche : elle repousse." }
  },
  estomac: {
    name: "L'estomac", short: 'Estomac', color: '#EE8FA6',
    role: "L'estomac est une poche musclée en forme de J. Il reçoit les aliments par l'œsophage, les brasse et les mélange au suc gastrique, très acide. La bouillie obtenue passe ensuite peu à peu dans l'intestin.",
    fact: "Vide, il est petit ; plein, il peut contenir 1 à 1,5 litre.",
    captions: [
      "Les aliments descendent par l'œsophage.",
      "Les muscles de l'estomac brassent les aliments avec le suc gastrique.",
      "La bouillie obtenue passe peu à peu dans l'intestin."
    ],
    legend: [['#E3B26B', 'Aliments']],
    greffe: { ok: false, note: "En cas de maladie, les chirurgiens retirent ou réparent plutôt une partie de l'estomac : on peut vivre sans une partie, voire sans la totalité de l'estomac." }
  },
  rate: {
    name: 'La rate', short: 'Rate', color: '#8E6BB0',
    role: "La rate, logée en haut à gauche de l'abdomen, filtre le sang. Elle élimine les globules rouges usés et participe à la défense contre les infections.",
    fact: "On peut vivre sans rate : d'autres organes prennent en partie le relais.",
    captions: [
      "Le sang traverse la rate.",
      "Les globules rouges usés sont retenus et recyclés.",
      "La rate abrite aussi des globules blancs qui défendent l'organisme."
    ],
    legend: [['#E63946', 'Globules rouges'], ['#6B2A2A', 'Globules rouges usés']],
    greffe: { ok: false, note: "On peut vivre sans rate : si elle est abîmée, elle est retirée, avec une vaccination adaptée pour protéger contre les infections." }
  },
  pancreas: {
    name: 'Le pancréas', short: 'Pancréas', color: '#F2C14E',
    role: "Le pancréas, caché derrière l'estomac, a deux rôles. Il verse dans l'intestin des sucs qui digèrent les aliments. Il fabrique aussi des hormones, dont l'insuline, qui règlent le taux de sucre dans le sang.",
    fact: "Le diabète de type 1 survient quand le pancréas ne fabrique plus d'insuline.",
    captions: [
      "Le pancréas déverse ses sucs digestifs dans l'intestin.",
      "Il libère l'insuline dans le sang pour régler le taux de sucre."
    ],
    legend: [['#9BC53D', 'Sucs digestifs'], ['#1B998B', 'Insuline']],
    greffe: { ok: true, article: 'le pancréas', delay: 'environ 10 à 12 heures', note4: "Il est souvent greffé en même temps qu'un rein, chez des personnes diabétiques." }
  },
  'rein-droit': {
    name: 'Le rein droit', short: 'Rein droit', color: '#C0485E',
    role: "Les reins, en forme de haricot, filtrent le sang en continu : environ 180 litres par jour. Ils éliminent les déchets et l'excès d'eau sous forme d'urine, qui descend vers la vessie par les uretères.",
    fact: "On peut vivre normalement avec un seul rein.",
    captions: [
      "Le sang arrive dans le rein par l'artère rénale.",
      "Le rein filtre le sang et retient les déchets.",
      "L'urine descend par l'uretère jusqu'à la vessie."
    ],
    legend: [['#E63946', 'Sang à filtrer'], ['#4F72C9', 'Sang filtré'], ['#E9B949', 'Urine']],
    greffe: { ok: true, article: 'le rein', delay: "jusqu'à 24 à 36 heures", living: "Un rein peut aussi être donné de son vivant, par exemple à un proche.", note4: "Le rein greffé est placé dans le bas du ventre ; les reins malades restent souvent en place." }
  },
  'rein-gauche': {
    name: 'Le rein gauche', short: 'Rein gauche', color: '#C0485E',
    role: "Les reins, en forme de haricot, filtrent le sang en continu : environ 180 litres par jour. Ils éliminent les déchets et l'excès d'eau sous forme d'urine, qui descend vers la vessie par les uretères.",
    fact: "Le rein gauche est un peu plus haut que le droit, repoussé par le foie.",
    captions: [
      "Le sang arrive dans le rein par l'artère rénale.",
      "Le rein filtre le sang et retient les déchets.",
      "L'urine descend par l'uretère jusqu'à la vessie."
    ],
    legend: [['#E63946', 'Sang à filtrer'], ['#4F72C9', 'Sang filtré'], ['#E9B949', 'Urine']],
    greffe: { ok: true, article: 'le rein', delay: "jusqu'à 24 à 36 heures", living: "Un rein peut aussi être donné de son vivant, par exemple à un proche.", note4: "Le rein greffé est placé dans le bas du ventre ; les reins malades restent souvent en place." }
  },
  intestins: {
    name: 'Les intestins', short: 'Intestins', color: '#F4A98E',
    role: "L'intestin grêle, long d'environ 6 mètres, termine la digestion et fait passer les nutriments dans le sang. Le gros intestin (le côlon) réabsorbe l'eau et forme les selles. Des vagues de contraction font avancer leur contenu.",
    fact: "Repliés dans le ventre, les intestins mesurent au total plus de 7 mètres.",
    captions: [
      "Des vagues de contraction (le péristaltisme) font avancer les aliments.",
      "Dans l'intestin grêle, les nutriments passent dans le sang.",
      "Le côlon réabsorbe l'eau avant l'élimination."
    ],
    legend: [['#E3B26B', 'Aliments digérés'], ['#9C6B4E', 'Résidus']],
    greffe: { ok: true, article: "l'intestin grêle", delay: 'environ 6 à 8 heures', note4: "La greffe d'intestin est rare et très spécialisée." }
  },
  vessie: {
    name: 'La vessie', short: 'Vessie', color: '#EFCB72',
    role: "La vessie est un réservoir musculaire qui stocke l'urine fabriquée par les reins. Elle se remplit doucement et contient en général 300 à 500 ml. Quand elle est pleine, des signaux nerveux donnent l'envie d'uriner.",
    fact: "Sa paroi est très élastique : elle s'étire à mesure qu'elle se remplit.",
    captions: [
      "L'urine arrive goutte à goutte par les deux uretères.",
      "La vessie se remplit et sa paroi s'étire.",
      "Quand elle est pleine, le cerveau reçoit le signal : c'est l'envie d'uriner."
    ],
    legend: [['#E9B949', 'Urine']],
    greffe: { ok: false, note: "Si nécessaire, les chirurgiens peuvent fabriquer une nouvelle poche avec un morceau d'intestin du patient." }
  }
};

export const ORDER = ['coeur', 'poumon-droit', 'poumon-gauche', 'foie', 'estomac', 'rate', 'pancreas', 'rein-droit', 'rein-gauche', 'intestins', 'vessie'];

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const GREFFE_STEPS = [
  {
    title: 'Le don',
    text: (o) => "Le donneur est le plus souvent une personne décédée à l'hôpital. En France, chacun est considéré comme donneur, sauf s'il a fait connaître son refus. Les proches sont toujours consultés." + (o.greffe.living ? ' ' + o.greffe.living : '')
  },
  {
    title: 'Le prélèvement',
    text: (o) => `Au bloc opératoire, une équipe spécialisée prélève ${o.greffe.article} avec le plus grand soin. Le corps du donneur est respecté et rendu à sa famille.`
  },
  {
    title: 'Le transport',
    text: (o) => `${cap(o.greffe.article)} est placé dans un liquide de conservation, au froid (environ 4 °C), puis transporté au plus vite vers l'hôpital du receveur.`,
    chip: (o) => `Délai à respecter : ${o.greffe.delay}`
  },
  {
    title: 'La greffe',
    text: (o) => "Le receveur est choisi selon la compatibilité (groupe sanguin, tissus, taille), l'urgence et la distance. L'équipe de greffe implante l'organe, qui reprend sa fonction. Un traitement anti-rejet suivra." + (o.greffe.note4 ? ' ' + o.greffe.note4 : '')
  }
];
