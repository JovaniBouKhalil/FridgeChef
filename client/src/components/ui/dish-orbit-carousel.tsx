import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowLeft, ArrowRight, BookOpen, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ARC_SWEEP,
  arcPath,
  arcRest,
  fitSize,
  scrollSteps,
  segmentFor,
  stepDirection,
  wrapIndex,
} from './dish-orbit-carousel.utils'
import './dish-orbit-carousel.css'

gsap.registerPlugin(ScrollTrigger)

export type Dish = {
  id?: string
  title: string
  subtitle: string
  image: string
  alt?: string
  eyebrow?: string
  label?: string
  description: string
  ingredients?: string[]
  accent: string
  source?: string
  video?: string
  rating?: number
  chef?: string
  kitchen?: string
}

export type DishOrbitCarouselProps = {
  dishes: Dish[]
  height?: string
  backdrop?: string
  loop?: boolean
  /** Optional desktop scroll showcase. Normal app pages use explicit controls. */
  scrollDriven?: boolean
  fontSrc?: string | null
  onPlay?: (dish: Dish, index: number) => void
  onOrder?: (dish: Dish, index: number) => void
  onChange?: (index: number) => void
  renderAction?: (dish: Dish, index: number) => ReactNode
  className?: string
}

const HIDE_FIRST = 'inset(0% 0% 0% 100%)'
const HIDE_SECOND = 'inset(0% 100% 0% 0%)'
const SHOW = 'inset(0% 0% 0% 0%)'

export function DishOrbitCarousel({
  dishes,
  height,
  backdrop,
  loop = true,
  scrollDriven = false,
  fontSrc = '/fonts/outfit-latin.woff2',
  onPlay,
  onOrder,
  onChange,
  renderAction,
  className,
}: DishOrbitCarouselProps) {
  const [selected, setSelected] = useState(0)
  const [tab, setTab] = useState<'overview' | 'ingredients'>('overview')
  const [reduced, setReduced] = useState(
    () =>
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  )
  const n = dishes.length
  const index = Math.min(selected, Math.max(0, n - 1))
  const dish = dishes[index]
  const root = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const strip = useRef<HTMLDivElement>(null)
  const thumbs = useRef<(HTMLButtonElement | null)[]>([])
  const orbits = useRef<(HTMLDivElement | null)[]>([])
  const heads = useRef<(HTMLDivElement | null)[]>([])
  const bodies = useRef<(HTMLDivElement | null)[]>([])
  const band = useRef<SVGPathElement>(null)
  const shown = useRef(-1)
  const current = useRef(0)
  const direction = useRef<1 | -1>(1)
  const timeline = useRef<gsap.core.Timeline | null>(null)
  const scrollTrigger = useRef<ScrollTrigger | null>(null)
  const segment = useRef(0)
  const swipe = useRef<{ x: number; y: number; pointer: number } | null>(null)
  const changeCallback = useRef(onChange)
  const panelId = useId()
  const steps = scrollSteps(n, loop)

  useEffect(() => {
    changeCallback.current = onChange
  }, [onChange])
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    function update() {
      setReduced(preference.matches)
    }
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  const select = useCallback((next: number, dir: 1 | -1) => {
    if (next === current.current) return
    direction.current = dir
    current.current = next
    setSelected(next)
    changeCallback.current?.(next)
  }, [])

  // Keep the supplied orbital plate motion, opposing title wipes and arc morph.
  // Context reversion handles rapid changes, StrictMode and route unmounts.
  useLayoutEffect(() => {
    if (!n || !root.current) return
    const from = shown.current
    const to = index
    const rest = arcRest(to)
    const arc = {
      a0: arcRest(Math.max(0, from))[0],
      a1: arcRest(Math.max(0, from))[1],
    }
    const draw = () =>
      band.current?.setAttribute(
        'd',
        arcPath(arc.a0, arc.a1, 299, -450, 650, 118),
      )
    const context = gsap.context(() => {
      const incoming = [
        orbits.current[to],
        heads.current[to],
        bodies.current[to],
      ]
      gsap.set(
        [...orbits.current, ...heads.current, ...bodies.current].filter(
          Boolean,
        ),
        { autoAlpha: 0, rotation: 0, y: 0 },
      )
      const title = heads.current[to]
      if (from < 0 || from === to || from >= n || reduced) {
        gsap.set(incoming, { autoAlpha: 1 })
        gsap.set(title?.querySelectorAll('.dsh-t1,.dsh-t2') ?? [], {
          clipPath: SHOW,
        })
        arc.a0 = rest[0]
        arc.a1 = rest[1]
        draw()
        gsap.set(band.current, { fill: dishes[to].accent })
        return
      }
      const outgoing = [
        orbits.current[from],
        heads.current[from],
        bodies.current[from],
      ]
      gsap.set(outgoing, { autoAlpha: 1 })
      const oldTitle = heads.current[from]
      const first = title?.querySelector('.dsh-t1')
      const second = title?.querySelector('.dsh-t2')
      const tl = gsap.timeline()
      timeline.current = tl
      tl.to(
        orbits.current[from],
        {
          rotation: 50 * direction.current,
          autoAlpha: 0,
          duration: 0.42,
          ease: 'power2.in',
        },
        0,
      )
        .fromTo(
          orbits.current[to],
          { autoAlpha: 1, rotation: -50 * direction.current },
          { rotation: 0, duration: 0.7, ease: 'power3.out' },
          0.18,
        )
        .to(
          oldTitle?.querySelector('.dsh-t1') ?? [],
          { clipPath: HIDE_FIRST, duration: 0.24 },
          0,
        )
        .to(
          oldTitle?.querySelector('.dsh-t2') ?? [],
          { clipPath: HIDE_SECOND, duration: 0.24 },
          0.04,
        )
        .set(heads.current[from], { autoAlpha: 0 }, 0.28)
        .set(heads.current[to], { autoAlpha: 1 }, 0.28)
        .fromTo(
          first ?? [],
          { clipPath: HIDE_FIRST },
          { clipPath: SHOW, duration: 0.5, ease: 'power3.out' },
          0.28,
        )
        .fromTo(
          second ?? [],
          { clipPath: HIDE_SECOND },
          { clipPath: SHOW, duration: 0.5, ease: 'power3.out' },
          0.33,
        )
        .to(bodies.current[from], { autoAlpha: 0, y: -6, duration: 0.2 }, 0)
        .fromTo(
          bodies.current[to],
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: 0.35 },
          0.25,
        )
        .to(
          arc,
          {
            a0: ARC_SWEEP[0],
            a1: ARC_SWEEP[1],
            duration: 0.32,
            onUpdate: draw,
          },
          0,
        )
        .to(
          arc,
          {
            a0: rest[0],
            a1: rest[1],
            duration: 0.55,
            ease: 'power3.out',
            onUpdate: draw,
          },
          0.32,
        )
        .fromTo(
          band.current,
          { fill: dishes[from].accent },
          { fill: dishes[to].accent, duration: 0.7 },
          0,
        )
    }, root)
    shown.current = index
    return () => {
      timeline.current?.kill()
      timeline.current = null
      context.revert()
    }
  }, [index, dishes, n, reduced])

  useEffect(() => {
    const container = strip.current
    const button = thumbs.current[index]
    if (container && button)
      container.scrollTo?.({
        left: Math.max(
          0,
          button.offsetLeft - (container.clientWidth - button.clientWidth) / 2,
        ),
        behavior: reduced ? 'instant' : 'smooth',
      })
  }, [index, reduced])

  // Optional original scroll-driven presentation; never enabled on phones or
  // with reduced motion. The app's featured view leaves normal page scroll intact.
  useEffect(() => {
    if (!scrollDriven || steps < 1 || reduced) return
    const media = gsap.matchMedia()
    media.add('(min-width: 901px) and (pointer: fine)', () => {
      const trigger = ScrollTrigger.create({
        trigger: track.current,
        start: 'top top',
        end: 'bottom bottom',
        snap: {
          snapTo: 1 / steps,
          duration: { min: 0.15, max: 0.4 },
          delay: 0.08,
        },
        onUpdate: (self) => {
          if (loop && self.progress >= 1 && self.direction > 0) {
            segment.current = 0
            self.scroll(self.start + 1)
            select(0, 1)
            return
          }
          const next = Math.round(self.progress * steps)
          if (next !== segment.current) {
            const dir = next > segment.current ? 1 : -1
            segment.current = next
            select(wrapIndex(next, n), dir)
          }
        },
      })
      scrollTrigger.current = trigger
      let frame = 0
      function onWheel(event: WheelEvent) {
        const position = trigger.scroll()
        if (
          !loop ||
          event.deltaY >= 0 ||
          position < trigger.start - 1 ||
          position > trigger.start + 1
        )
          return
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => {
          segment.current = n - 1
          trigger.scroll(
            trigger.start + ((trigger.end - trigger.start) * (n - 1)) / steps,
          )
          select(n - 1, -1)
        })
      }
      window.addEventListener('wheel', onWheel, { passive: true })
      return () => {
        cancelAnimationFrame(frame)
        window.removeEventListener('wheel', onWheel)
        trigger.kill()
        scrollTrigger.current = null
      }
    })
    return () => media.revert()
  }, [scrollDriven, steps, loop, n, select, reduced])

  function go(to: number, dir?: 1 | -1) {
    if (n < 2) return
    const next = loop ? wrapIndex(to, n) : Math.max(0, Math.min(to, n - 1))
    const trigger = scrollTrigger.current
    if (trigger?.isActive) {
      const nextSegment = segmentFor(next, segment.current, n, loop)
      segment.current = nextSegment
      trigger.scroll(
        trigger.start + ((trigger.end - trigger.start) * nextSegment) / steps,
      )
    }
    select(next, dir ?? stepDirection(index, next, n))
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (
      (event.target as HTMLElement).closest(
        '[role="tablist"],input,textarea,[contenteditable="true"]',
      )
    )
      return
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      go(index + 1, 1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      go(index - 1, -1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      go(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      go(n - 1)
    }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (
      !event.isPrimary ||
      (event.pointerType === 'mouse' && event.button !== 0)
    )
      return
    swipe.current = {
      x: event.clientX,
      y: event.clientY,
      pointer: event.pointerId,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = swipe.current
    swipe.current = null
    if (!start || start.pointer !== event.pointerId) return
    const dx = event.clientX - start.x
    if (
      Math.abs(dx) > 40 &&
      Math.abs(dx) > Math.abs(event.clientY - start.y) * 1.4
    )
      go(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1)
  }

  const style = {
    '--dish-height': height || '100svh',
    '--dish-stretches': 1 + steps * 0.7,
  } as CSSProperties
  if (!dish)
    return (
      <div className="dsh-empty" role="status">
        No featured recipes are available.
      </div>
    )

  return (
    <div
      ref={track}
      className={cn(
        'dsh-track-root',
        scrollDriven && 'dsh-scroll-track',
        className,
      )}
      style={style}
    >
      <div
        ref={root}
        className="dsh-root"
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured recipes"
        tabIndex={0}
        onKeyDown={onKeyDown}
        style={{ fontFamily: fontSrc ? 'dish-outfit, sans-serif' : 'inherit' }}
      >
        {fontSrc && (
          <style>{`@font-face{font-family:dish-outfit;src:url("${fontSrc}") format("woff2");font-weight:100 900;font-display:swap}`}</style>
        )}
        {backdrop && (
          <>
            <img className="dsh-backdrop" src={backdrop} alt="" />
            <div className="dsh-backdrop-wash" />
          </>
        )}
        <div className="dsh-toolbar">
          <span>
            Featured recipe {index + 1} / {n}
          </span>
          <div className="dsh-controls">
            <button
              type="button"
              className="dsh-button"
              aria-label="Previous recipe"
              disabled={n < 2 || (!loop && index === 0)}
              onClick={() => go(index - 1, -1)}
            >
              <ArrowLeft size={20} />
            </button>
            <button
              type="button"
              className="dsh-button"
              aria-label="Next recipe"
              disabled={n < 2 || (!loop && index === n - 1)}
              onClick={() => go(index + 1, 1)}
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
        <div className="dsh-stage">
          <svg className="dsh-arc" viewBox="0 0 960 520" aria-hidden="true">
            <path ref={band} opacity="0.3" />
          </svg>
          <div
            className="dsh-plates"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => {
              swipe.current = null
            }}
          >
            {dishes.map((item, i) => (
              <div
                key={item.id ?? i}
                ref={(element) => {
                  orbits.current[i] = element
                }}
                className="dsh-orbit"
                data-active={i === index}
                aria-hidden={i !== index}
              >
                <img
                  src={item.image}
                  alt={item.alt ?? `${item.title} ${item.subtitle}`}
                  width={300}
                  height={300}
                  draggable={false}
                />
              </div>
            ))}
          </div>
          <div className="dsh-main">
            <div className="dsh-head">
              {dishes.map((item, i) => (
                <div
                  key={item.id ?? i}
                  ref={(element) => {
                    heads.current[i] = element
                  }}
                  className="dsh-heading"
                  data-active={i === index}
                  aria-hidden={i !== index}
                >
                  <p className="dsh-eyebrow">
                    {item.eyebrow ?? 'Recipe inspiration'}
                  </p>
                  <h2>
                    <span
                      className="dsh-t1"
                      style={{
                        fontSize: fitSize(item.title.length, 39, 280, 0.55),
                      }}
                    >
                      {item.title}
                    </span>
                    <span
                      className="dsh-t2"
                      style={{
                        fontSize: fitSize(item.subtitle.length, 48, 280, 0.62),
                      }}
                    >
                      {item.subtitle}
                    </span>
                  </h2>
                </div>
              ))}
            </div>
            <div className="dsh-actions">
              {onOrder && (
                <button
                  type="button"
                  className="button"
                  onClick={() => onOrder(dish, index)}
                >
                  <BookOpen size={17} />
                  View recipe
                </button>
              )}
              {onPlay && dish.video && (
                <button
                  type="button"
                  className="dsh-text-button"
                  onClick={() => onPlay(dish, index)}
                >
                  <Play size={16} />
                  Watch video
                </button>
              )}
            </div>
            {renderAction && (
              <div className="dsh-extra-action">
                {renderAction(dish, index)}
              </div>
            )}
          </div>
          <div className="dsh-card">
            <div
              className="dsh-tabs"
              role="tablist"
              aria-label="Recipe information"
            >
              {(['overview', 'ingredients'] as const).map((name) => (
                <button
                  key={name}
                  type="button"
                  className="dsh-tab"
                  id={`${panelId}-${name}`}
                  role="tab"
                  aria-selected={tab === name}
                  aria-controls={`${panelId}-panel`}
                  tabIndex={tab === name ? 0 : -1}
                  onClick={() => setTab(name)}
                  onKeyDown={(event) => {
                    if (
                      ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(
                        event.key,
                      )
                    ) {
                      event.preventDefault()
                      const next =
                        event.key === 'Home'
                          ? 'overview'
                          : event.key === 'End'
                            ? 'ingredients'
                            : name === 'overview'
                              ? 'ingredients'
                              : 'overview'
                      setTab(next)
                      document.getElementById(`${panelId}-${next}`)?.focus()
                    }
                  }}
                >
                  {name === 'overview' ? 'Overview' : 'Ingredients'}
                </button>
              ))}
            </div>
            <div
              id={`${panelId}-panel`}
              role="tabpanel"
              aria-labelledby={`${panelId}-${tab}`}
              tabIndex={0}
              className="dsh-bodies"
            >
              {dishes.map((item, i) => (
                <div
                  key={item.id ?? i}
                  ref={(element) => {
                    bodies.current[i] = element
                  }}
                  className="dsh-body"
                  data-active={i === index}
                  aria-hidden={i !== index}
                  inert={i !== index}
                >
                  <div className="dsh-fact">
                    <span style={{ background: item.accent }}>
                      {item.rating !== undefined
                        ? item.rating.toFixed(1)
                        : (item.ingredients?.length ?? 0)}
                    </span>
                    <p>
                      {item.rating !== undefined
                        ? 'rating out of 5'
                        : 'ingredients'}
                      <small>
                        {item.chef ?? item.source ?? 'Recipe details'}
                      </small>
                    </p>
                  </div>
                  {item.kitchen && <p className="dsh-source">{item.kitchen}</p>}
                  {tab === 'overview' ? (
                    <p className="dsh-description">{item.description}</p>
                  ) : (
                    <ul className="dsh-ingredients">
                      {item.ingredients?.map((ingredient) => (
                        <li key={ingredient}>{ingredient}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div
          className="dsh-thumbnail-strip"
          ref={strip}
          role="group"
          aria-label="Choose a recipe"
        >
          {dishes.map((item, i) => (
            <button
              key={item.id ?? i}
              ref={(element) => {
                thumbs.current[i] = element
              }}
              type="button"
              className="dsh-thumbnail"
              aria-label={`Show ${item.label ?? `${item.title} ${item.subtitle}`}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => go(i)}
            >
              <img
                src={item.image}
                alt=""
                width={56}
                height={56}
                loading="lazy"
              />
              <span>{item.label ?? `${item.title} ${item.subtitle}`}</span>
            </button>
          ))}
        </div>
        <p
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          Recipe {index + 1} of {n}: {dish.title} {dish.subtitle}
        </p>
      </div>
    </div>
  )
}

export default DishOrbitCarousel
