import { describe, expect, it } from 'vitest'
import {
  arcPath,
  fitSize,
  scrollSteps,
  segmentFor,
  stepDirection,
  stripStart,
  wrapIndex,
} from './dish-orbit-carousel.utils'

describe('orbit carousel navigation and geometry', () => {
  it('wraps both ways and chooses the shortest direction across the boundary', () => {
    expect(wrapIndex(-1, 5)).toBe(4)
    expect(wrapIndex(11, 5)).toBe(1)
    expect(wrapIndex(0, 0)).toBe(0)
    expect(stepDirection(4, 0, 5)).toBe(1)
    expect(stepDirection(0, 4, 5)).toBe(-1)
  })
  it('keeps optional scroll segments and thumbnail windows within bounds', () => {
    expect(scrollSteps(5, false)).toBe(4)
    expect(scrollSteps(5, true)).toBe(5)
    expect(segmentFor(0, 4, 5, true)).toBe(5)
    expect(stripStart(4, 5, 4)).toBe(1)
    expect(stripStart(0, 2, 4)).toBe(0)
  })
  it('produces closed finite SVG geometry and fits long titles', () => {
    const path = arcPath(50, 98, 299, -450, 650, 118)
    expect(path.startsWith('M')).toBe(true)
    expect(path.endsWith('Z')).toBe(true)
    expect(path).not.toMatch(/NaN|Infinity/)
    expect(fitSize(40, 48, 280, 0.62)).toBeLessThan(20)
    expect(fitSize(0, 48, 280, 0.62)).toBe(48)
  })
})
