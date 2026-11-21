import pluralize from 'pluralize'

// Mirrored in client/src/utils and server/utils for independent deployments.
// The server contract test checks these copies stay identical.

// These food names are singular or mass nouns despite their endings.
for (const name of ['asparagus', 'couscous', 'hummus', 'molasses', 'haggis']) {
  pluralize.addUncountableRule(name)
}

// English plural rules handle any ingredient, including names added later.
// Keep spelling corrections explicit so similar foods are not merged by typo
// distance (for example, rice and spice, or onion and union).
const wordAliases = {
  chili: 'chilli',
  chilies: 'chilli',
  chillies: 'chilli',
  chilis: 'chilli',
  chillis: 'chilli',
  yoghurt: 'yogurt',
  avacado: 'avocado',
  bananna: 'banana',
  brocolli: 'broccoli',
  brocoli: 'broccoli',
  cauliflour: 'cauliflower',
  spinich: 'spinach',
  zuchini: 'zucchini',
  zuccini: 'zucchini',
  cinnimon: 'cinnamon',
}

const phraseAliases = {
  'garlic clove': 'garlic',
  'chopped tomato': 'tomato',
  'cherry tomato': 'tomato',
  'chicken breast': 'chicken',
  'green onion': 'spring onion',
  'penne rigate': 'penne',
}

function aliasWord(word) {
  return Object.hasOwn(wordAliases, word) ? wordAliases[word] : word
}

export function normalizeIngredient(value = '') {
  const name = value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[-\u2010-\u2015]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
  const singular = name
    .split(' ')
    .map((word) => aliasWord(pluralize.singular(aliasWord(word))))
    .join(' ')
  return Object.hasOwn(phraseAliases, singular)
    ? phraseAliases[singular]
    : singular
}

export const unspecifiedQuantity = 'Not specified'
