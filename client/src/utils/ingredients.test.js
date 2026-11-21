import { describe, expect, it } from 'vitest'
import {
  matchIngredients,
  normalizeIngredient,
  rankRecipes,
  recipeIngredients,
} from './ingredients'

const pasta = {
  strMeal: 'Pasta',
  strIngredient1: 'Tomatoes',
  strIngredient2: 'Garlic cloves',
  strIngredient3: 'Penne',
  strIngredient4: ' ',
  strMeasure1: '2 whole',
}

describe('ingredient matching', () => {
  it.each([
    ['ONIONS', 'onion'],
    ['Potatoes', 'potato'],
    ['POTATOS', 'potato'],
    ['artichokes', 'artichoke'],
    ['leeks', 'leek'],
    ['radishes', 'radish'],
    ['mushrooms', 'mushroom'],
    ['berries', 'berry'],
    ['strawberries', 'strawberry'],
    ['peaches', 'peach'],
    ['leaves', 'leaf'],
    ['walnuts', 'walnut'],
    ['anchovies', 'anchovy'],
    ['mussels', 'mussel'],
    ['tortillas', 'tortilla'],
    ['Dried Bay Leaves', 'dried bay leaf'],
    ['  RED   BELL PEPPERS  ', 'red bell pepper'],
    ['black-eyed peas', 'black eyed pea'],
    ['beans in brine', 'bean in brine'],
    ['spring-onions', 'spring onion'],
    ['garlic cloves', 'garlic'],
    ['JALAPEÑOS', 'jalapeno'],
    ['Chilies', 'chilli'],
    ['Chillies', 'chilli'],
    ['Yoghurt', 'yogurt'],
    ['banannas', 'banana'],
    ['avacados', 'avocado'],
    ['brocolli', 'broccoli'],
  ])('normalizes %s using general ingredient rules', (input, expected) => {
    expect(normalizeIngredient(input)).toBe(expected)
    expect(normalizeIngredient(expected)).toBe(expected)
    expect(
      matchIngredients({ strIngredient1: input }, [
        { ingredientName: expected },
      ]).percentage,
    ).toBe(100)
  })
  it.each([
    'asparagus',
    'couscous',
    'hummus',
    'molasses',
    'haggis',
    'watercress',
    'citrus',
    'rice',
    'salt',
    'salmon',
    'fish',
    'swiss cheese',
  ])('preserves singular and mass food names such as %s', (name) => {
    expect(normalizeIngredient(name)).toBe(name)
  })
  it.each([
    ['rice', 'rice flour'],
    ['red pepper', 'black pepper'],
    ['milk', 'coconut milk'],
    ['chickpea', 'chicken'],
    ['onion', 'union'],
  ])('keeps %s separate from %s', (first, second) => {
    expect(normalizeIngredient(first)).not.toBe(normalizeIngredient(second))
  })
  it.each(['tomato', ' TOmato ', 'tomatoes', 'tomatos', 'TOMATOS'])(
    'treats %s as the same tomato ingredient',
    (name) => {
      expect(normalizeIngredient(name)).toBe('tomato')
      expect(
        matchIngredients(pasta, [{ ingredientName: name }]).available[0].name,
      ).toBe('Tomatoes')
    },
  )
  it('normalizes food plurals and internal spaces without collapsing different foods', () => {
    expect(normalizeIngredient(' RED   ONIONS ')).toBe('red onion')
    expect(normalizeIngredient('carrots')).toBe('carrot')
    expect(normalizeIngredient('Cherry Tomato')).toBe('tomato')
    expect(normalizeIngredient('red pepper')).not.toBe(
      normalizeIngredient('black pepper'),
    )
    for (const name of ['rice', 'salt', 'asparagus', 'couscous']) {
      expect(normalizeIngredient(name)).toBe(name)
    }
    expect(normalizeIngredient('constructor')).toBe('constructor')
  })
  it('matches aliases and whitespace without treating unrelated ingredients as equivalent', () => {
    const result = matchIngredients(pasta, [
      { ingredientName: ' tomato ' },
      { ingredientName: 'GARLIC' },
      { ingredientName: 'rice' },
    ])
    expect(result.percentage).toBe(67)
    expect(result.available.map((item) => item.name)).toEqual([
      'Tomatoes',
      'Garlic cloves',
    ])
    expect(result.missing.map((item) => item.name)).toEqual(['Penne'])
  })
  it('ignores empty API slots and keeps measurements', () => {
    expect(recipeIngredients(pasta)).toHaveLength(3)
    expect(recipeIngredients(pasta)[0]).toEqual({
      name: 'Tomatoes',
      measure: '2 whole',
    })
    expect(matchIngredients({})).toMatchObject({ percentage: 0, missing: [] })
  })
  it('ranks by the proportion of complete ingredients without mutating results', () => {
    const meals = [pasta, { strMeal: 'Garlic soup', strIngredient1: 'Garlic' }]
    const ranked = rankRecipes(meals, [{ ingredientName: 'Garlic' }])
    expect(ranked[0].strMeal).toBe('Garlic soup')
    expect(meals[0]).toBe(pasta)
  })
})
