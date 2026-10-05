// Contenus pédagogiques (français). Vue de face : la droite du patient est à gauche de l'écran.

export const GROUPS = [
  { id: 'cavites', name: 'Les 4 cavités', kicker: 'Cavité' },
  { id: 'valves', name: 'Les 4 valves', kicker: 'Valve' },
  { id: 'vaisseaux', name: 'Les gros vaisseaux', kicker: 'Gros vaisseau' },
  { id: 'coronaires', name: 'Les artères coronaires', kicker: 'Artère coronaire' }
];

export const ELEMENTS = {
  od: {
    group: 'cavites', name: 'Oreillette droite', short: 'Oreillette droite', color: '#EE9AA3',
    text: "Elle reçoit le sang pauvre en oxygène qui revient du corps par les veines caves, puis le fait passer dans le ventricule droit à travers la valve tricuspide. Sa paroi abrite le nœud sinusal, le « chef d'orchestre » qui déclenche chaque battement."
  },
  vd: {
    group: 'cavites', name: 'Ventricule droit', short: 'Ventricule droit', color: '#F3A097',
    text: "Il propulse le sang pauvre en oxygène vers les poumons, par l'artère pulmonaire. Il travaille à basse pression : sa paroi est environ trois fois plus fine que celle du ventricule gauche."
  },
  og: {
    group: 'cavites', name: 'Oreillette gauche', short: 'Oreillette gauche', color: '#E68A98',
    text: "Située en arrière, elle reçoit le sang riche en oxygène qui revient des poumons par les quatre veines pulmonaires, puis le transmet au ventricule gauche à travers la valve mitrale."
  },
  vg: {
    group: 'cavites', name: 'Ventricule gauche', short: 'Ventricule gauche', color: '#E57373',
    text: "La cavité la plus musclée : elle éjecte le sang riche en oxygène dans l'aorte, vers tout l'organisme. Elle forme la pointe du cœur ; sa paroi mesure environ 1 cm d'épaisseur."
  },
  tricuspide: {
    group: 'valves', name: 'Valve tricuspide', short: 'Valve tricuspide', color: '#F2C66D', inner: true,
    text: "Entre l'oreillette droite et le ventricule droit, elle compte trois feuillets. Ouverte pendant le remplissage, elle se ferme au début de la contraction du ventricule pour empêcher le sang de refluer vers l'oreillette."
  },
  pulmonaire: {
    group: 'valves', name: 'Valve pulmonaire', short: 'Valve pulmonaire', color: '#F2C66D', inner: true,
    text: "À la sortie du ventricule droit, ses trois valvules en forme de nid de pigeon s'ouvrent quand le ventricule se contracte, puis se ferment pour que le sang ne revienne pas de l'artère pulmonaire."
  },
  mitrale: {
    group: 'valves', name: 'Valve mitrale', short: 'Valve mitrale', color: '#F2C66D', inner: true,
    text: "Entre l'oreillette gauche et le ventricule gauche, c'est la seule valve à deux feuillets. Sa fermeture, avec celle de la tricuspide, produit le premier bruit du cœur (B1)."
  },
  aortique: {
    group: 'valves', name: 'Valve aortique', short: 'Valve aortique', color: '#F2C66D', inner: true,
    text: "À la sortie du ventricule gauche, ses trois valvules s'ouvrent pendant l'éjection puis se ferment : avec la valve pulmonaire, elle produit le deuxième bruit du cœur (B2). Les coronaires naissent juste au-dessus."
  },
  vcs: {
    group: 'vaisseaux', name: 'Veine cave supérieure', short: 'Veine cave sup.', color: '#5B7FD6',
    text: "Elle ramène vers l'oreillette droite le sang pauvre en oxygène de la tête, du cou et des bras."
  },
  vci: {
    group: 'vaisseaux', name: 'Veine cave inférieure', short: 'Veine cave inf.', color: '#5B7FD6',
    text: "Elle ramène vers l'oreillette droite le sang pauvre en oxygène de l'abdomen et des jambes, en traversant le diaphragme."
  },
  ap: {
    group: 'vaisseaux', name: 'Artère pulmonaire', short: 'Artère pulmonaire', color: '#5B7FD6',
    text: "Le tronc pulmonaire part du ventricule droit et se divise en artères pulmonaires droite et gauche, vers les poumons. C'est une artère, mais elle transporte du sang pauvre en oxygène."
  },
  vp: {
    group: 'vaisseaux', name: 'Veines pulmonaires', short: 'Veines pulmonaires', color: '#E8505B',
    text: "Quatre veines, deux de chaque poumon, ramènent le sang riche en oxygène vers l'oreillette gauche. Ce sont des veines, mais elles transportent du sang oxygéné."
  },
  aorte: {
    group: 'vaisseaux', name: 'Aorte', short: 'Aorte', color: '#E63946',
    text: "La plus grosse artère du corps. Elle part du ventricule gauche, forme la crosse d'où naissent les artères de la tête et des bras, puis descend vers l'abdomen."
  },
  cd: {
    group: 'coronaires', name: 'Coronaire droite', short: 'Coronaire droite', color: '#D62839', terr: '#F0A02E', the: 'la coronaire droite',
    text: "Elle naît de l'aorte et chemine dans le sillon entre oreillette et ventricule droits, puis sous le cœur. Elle irrigue le ventricule droit et, le plus souvent, la paroi inférieure du ventricule gauche.",
    zone: "Ventricule droit, paroi inférieure du ventricule gauche et partie arrière du septum. Elle nourrit aussi, le plus souvent, le nœud sinusal et le nœud auriculo-ventriculaire.",
    infarct: "Infarctus inférieur : sus-décalage du segment ST en D2, D3 et aVF ; bradycardie ou bloc auriculo-ventriculaire possibles."
  },
  iva: {
    group: 'coronaires', name: 'Interventriculaire antérieure', short: 'Interventriculaire ant.', color: '#D62839', terr: '#1B998B', the: "l'interventriculaire antérieure",
    text: "Branche du tronc commun de la coronaire gauche, souvent appelée IVA. Elle descend dans le sillon entre les deux ventricules, à l'avant, jusqu'à la pointe du cœur.",
    zone: "Paroi antérieure du ventricule gauche, deux tiers avant du septum et pointe du cœur. C'est le plus grand territoire.",
    infarct: "Infarctus antérieur, souvent étendu : sus-décalage du segment ST de V1 à V4."
  },
  cx: {
    group: 'coronaires', name: 'Circonflexe', short: 'Circonflexe', color: '#D62839', terr: '#5C7CFA', the: 'la circonflexe',
    text: "Autre branche du tronc commun gauche. Elle contourne le cœur par la gauche, dans le sillon entre l'oreillette et le ventricule gauches.",
    zone: "Paroi latérale du ventricule gauche (et oreillette gauche).",
    infarct: "Infarctus latéral : sus-décalage du segment ST en D1, aVL, V5 et V6. Il est parfois peu visible sur l'ECG."
  }
};
export const ORDER = ['od', 'vd', 'og', 'vg', 'tricuspide', 'pulmonaire', 'mitrale', 'aortique', 'vcs', 'vci', 'ap', 'vp', 'aorte', 'cd', 'iva', 'cx'];

// Cycle cardiaque (fractions du cycle)
export const PHASES = [
  { id: 'as', name: 'Systole auriculaire', short: 'Systole\nauriculaire',
    text: "Les oreillettes se contractent et terminent le remplissage des ventricules. Les valves tricuspide et mitrale sont ouvertes." },
  { id: 'vs', name: 'Systole ventriculaire', short: 'Systole\nventriculaire',
    text: "Les ventricules se contractent : les valves tricuspide et mitrale se ferment (B1), puis les valves pulmonaire et aortique s'ouvrent et le sang est éjecté." },
  { id: 'd', name: 'Diastole', short: 'Diastole',
    text: "Le cœur se relâche : les valves pulmonaire et aortique se ferment (B2), les valves tricuspide et mitrale s'ouvrent et les ventricules se remplissent." }
];

// Circulation du sang
export const STEPS = [
  { title: 'Retour par les veines caves', text: "Le sang pauvre en oxygène revient du corps par les veines caves supérieure et inférieure et remplit l'oreillette droite." },
  { title: 'Oreillette droite → ventricule droit', text: "Il traverse la valve tricuspide et passe dans le ventricule droit." },
  { title: 'Vers les poumons', text: "Le ventricule droit le propulse à travers la valve pulmonaire dans l'artère pulmonaire, qui se divise vers chaque poumon." },
  { title: 'Dans les poumons', text: "Au contact des alvéoles, le sang rejette le gaz carbonique et se charge en oxygène : de bleu, il devient rouge." },
  { title: 'Retour par les veines pulmonaires', text: "Le sang riche en oxygène revient par les quatre veines pulmonaires et remplit l'oreillette gauche." },
  { title: 'Oreillette gauche → ventricule gauche', text: "Il traverse la valve mitrale et passe dans le ventricule gauche." },
  { title: "Vers tout le corps par l'aorte", text: "Le ventricule gauche l'éjecte à travers la valve aortique dans l'aorte, qui le distribue à tout l'organisme." }
];
