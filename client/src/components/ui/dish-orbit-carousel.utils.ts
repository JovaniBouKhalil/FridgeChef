// Geometry and navigation helpers from the supplied Dish Orbit Carousel.
export function wrapIndex(i: number, n: number): number {
  if (n <= 0) return 0
  return ((Math.round(i) % n) + n) % n
}

/** Which way to swing when jumping from one dish to another: the shorter way round. */
export function stepDirection(from: number, to: number, n: number): 1 | -1 {
  if (n <= 0) return 1
  const fwd = (((to - from) % n) + n) % n
  return fwd <= n - fwd ? 1 : -1
}

/** Scroll stretches in the section: one per dish change, plus one back round to the first when looping. */
export function scrollSteps(n: number, loop: boolean): number {
  return Math.max(0, loop ? n : n - 1)
}

/** The scroll stretch for dish `i` nearest the current one (when looping, dish 0 is also the last stretch). */
export function segmentFor(
  i: number,
  current: number,
  n: number,
  loop: boolean,
): number {
  return loop && i === 0 && current > n / 2 ? n : i
}

/** First thumbnail shown in the strip window, keeping the current one in view. */
export function stripStart(index: number, n: number, visible: number): number {
  if (n <= visible) return 0
  return Math.max(0, Math.min(index - 1, n - visible))
}

/** Title font size so a line of `chars` characters fits `width` px at `em` average glyph width. */
export function fitSize(
  chars: number,
  max: number,
  width: number,
  em: number,
): number {
  return Math.min(max, width / (Math.max(1, chars) * em))
}
/**
 * The pastel band: a thick stroke along the plates' orbit circle, tapering at
 * both ends. Angles in degrees, screen space (0 = right, 90 = straight down).
 */
export function arcPath(
  a0: number,
  a1: number,
  cx: number,
  cy: number,
  r: number,
  w: number,
  steps = 48,
): string {
  const outer: string[] = []
  const inner: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = ((a0 + (a1 - a0) * t) * Math.PI) / 180
    const h = (w / 2) * Math.pow(Math.sin(Math.PI * t), 0.45)
    const c = Math.cos(a)
    const s = Math.sin(a)
    outer.push(
      (cx + c * (r + h)).toFixed(1) + ' ' + (cy + s * (r + h)).toFixed(1),
    )
    inner.push(
      (cx + c * (r - h)).toFixed(1) + ' ' + (cy + s * (r - h)).toFixed(1),
    )
  }
  return 'M' + outer.join('L') + 'L' + inner.reverse().join('L') + 'Z'
}

/** Where the band rests for each dish, as [start, end] angles along the orbit. Measured off the reference. */
export const ARC_REST = [
  [50, 98],
  [46, 124],
  [60, 126],
  [40, 100],
]
export function arcRest(index: number): number[] {
  return ARC_REST[
    ((index % ARC_REST.length) + ARC_REST.length) % ARC_REST.length
  ]
}

/** The band mid-swap: it stretches to trail between the outgoing and incoming plate. */
export const ARC_SWEEP = [38, 146]
