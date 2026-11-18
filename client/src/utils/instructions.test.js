import { describe, expect, it } from 'vitest'
import { parseInstructions } from './instructions'

describe('parseInstructions', () => {
  it('removes standalone number markers from TheMealDB instructions', () => {
    const instructions = `For the caramel place sugar in a frying pan.\n\n2\nPreheat oven to 150 degrees Celsius.\n\n3\nHeat the milk and stir the eggs gently.\n\n4\nChill overnight and serve.`

    expect(parseInstructions(instructions)).toEqual([
      'For the caramel place sugar in a frying pan.',
      'Preheat oven to 150 degrees Celsius.',
      'Heat the milk and stir the eggs gently.',
      'Chill overnight and serve.',
    ])
  })

  it('removes STEP headings and keeps each step together', () => {
    const instructions = `STEP 1\nPrepare the rice.\nKeep it warm.\n\nSTEP 2:\nAdd the filling.`

    expect(parseInstructions(instructions)).toEqual([
      'Prepare the rice. Keep it warm.',
      'Add the filling.',
    ])
  })

  it('keeps ordinary newline-separated instructions as separate steps', () => {
    expect(parseInstructions('Boil the water.\r\nAdd the pasta.\r\nServe.')).toEqual(
      ['Boil the water.', 'Add the pasta.', 'Serve.'],
    )
  })

  it('ignores blank or missing instructions', () => {
    expect(parseInstructions(' \n\n ')).toEqual([])
    expect(parseInstructions(null)).toEqual([])
  })
})
