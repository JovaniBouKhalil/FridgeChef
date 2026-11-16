import { describe, expect, it } from 'vitest'
import { matchIngredients, rankRecipes, recipeIngredients } from './ingredients'

const pasta = {
  strMeal: 'Pasta',
  strIngredient1: 'Tomatoes',
  strIngredient2: 'Garlic cloves',
  strIngredient3: 'Penne',
  strIngredient4: ' ',
  strMeasure1: '2 whole',
}

describe('ingredient matching', () => {
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
