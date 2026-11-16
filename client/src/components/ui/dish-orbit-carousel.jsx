import { useEffect, useId, useRef, useState } from 'react'
import Icon from '../Icon'
import {
  arcPath,
  arcRest,
  fitSize,
  wrapIndex,
} from './dish-orbit-carousel.utils'
import './dish-orbit-carousel.css'

// React state selects the dish; ordinary CSS handles its entrance animation.
export default function DishOrbitCarousel({
  dishes,
  backdrop,
  loop = true,
  onPlay,
  onOrder,
  onChange,
  renderAction,
  className = '',
}) {
  const [selected, setSelected] = useState(0)
  const [tab, setTab] = useState('overview')
  const strip = useRef(null)
  const thumbs = useRef([])
  const swipe = useRef(null)
  const panelId = useId()
  const count = dishes.length
  const index = Math.min(selected, Math.max(0, count - 1))
  const dish = dishes[index]

  useEffect(() => {
    const container = strip.current
    const button = thumbs.current[index]
    if (!container || !button) return
    const reduced = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches
    container.scrollTo?.({
      left: Math.max(
        0,
        button.offsetLeft - (container.clientWidth - button.clientWidth) / 2,
      ),
      behavior: reduced ? 'instant' : 'smooth',
    })
  }, [index])

  function go(position) {
    if (count < 2) return
    const next = loop
      ? wrapIndex(position, count)
      : Math.max(0, Math.min(position, count - 1))
    if (next === index) return
    setSelected(next)
    onChange?.(next)
  }

  function onKeyDown(event) {
    if (
      event.target.closest(
        '[role="tablist"],input,textarea,[contenteditable="true"]',
      )
    )
      return
    const positions = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: count - 1,
    }
    if (Object.hasOwn(positions, event.key)) {
      event.preventDefault()
      go(positions[event.key])
    }
  }

  function onPointerDown(event) {
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

  function onPointerUp(event) {
    const start = swipe.current
    swipe.current = null
    if (!start || start.pointer !== event.pointerId) return
    const distance = event.clientX - start.x
    if (
      Math.abs(distance) > 40 &&
      Math.abs(distance) > Math.abs(event.clientY - start.y) * 1.4
    ) {
      go(index + (distance < 0 ? 1 : -1))
    }
  }

  if (!dish)
    return (
      <div className="dsh-empty" role="status">
        No featured recipes are available.
      </div>
    )
  const [arcStart, arcEnd] = arcRest(index)

  return (
    <div className={['dsh-track-root', className].filter(Boolean).join(' ')}>
      <div
        className="dsh-root"
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured recipes"
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {backdrop && (
          <>
            <img className="dsh-backdrop" src={backdrop} alt="" />
            <div className="dsh-backdrop-wash" />
          </>
        )}
        <div className="dsh-toolbar">
          <span>
            Featured recipe {index + 1} / {count}
          </span>
          <div className="dsh-controls">
            <button
              type="button"
              className="dsh-button"
              aria-label="Previous recipe"
              disabled={count < 2 || (!loop && index === 0)}
              onClick={() => go(index - 1)}
            >
              <Icon name="back" />
            </button>
            <button
              type="button"
              className="dsh-button"
              aria-label="Next recipe"
              disabled={count < 2 || (!loop && index === count - 1)}
              onClick={() => go(index + 1)}
            >
              <Icon name="arrow" />
            </button>
          </div>
        </div>
        <div className="dsh-stage">
          <svg className="dsh-arc" viewBox="0 0 960 520" aria-hidden="true">
            <path
              d={arcPath(arcStart, arcEnd, 299, -450, 650, 118)}
              fill={dish.accent}
              opacity="0.3"
            />
          </svg>
          <div
            className="dsh-plates"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => {
              swipe.current = null
            }}
          >
            {dishes.map((item, position) => (
              <div
                key={item.id}
                className="dsh-orbit"
                data-active={position === index}
                aria-hidden={position !== index}
              >
                <img
                  src={item.image}
                  alt={item.alt || `${item.title} ${item.subtitle}`}
                  width="300"
                  height="300"
                  draggable={false}
                />
              </div>
            ))}
          </div>
          <div className="dsh-main">
            <div className="dsh-head">
              {dishes.map((item, position) => (
                <div
                  key={item.id}
                  className="dsh-heading"
                  data-active={position === index}
                  aria-hidden={position !== index}
                >
                  <p className="dsh-eyebrow">
                    {item.eyebrow || 'Recipe inspiration'}
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
                  <Icon name="book" size={17} />
                  View recipe
                </button>
              )}
              {onPlay && dish.video && (
                <button
                  type="button"
                  className="dsh-text-button"
                  onClick={() => onPlay(dish, index)}
                >
                  <Icon name="play" size={16} />
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
              {['overview', 'ingredients'].map((name) => (
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
                      !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(
                        event.key,
                      )
                    )
                      return
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
              {dishes.map((item, position) => (
                <div
                  key={item.id}
                  className="dsh-body"
                  data-active={position === index}
                  aria-hidden={position !== index}
                  inert={position !== index}
                >
                  <div className="dsh-fact">
                    <span style={{ background: item.accent }}>
                      {item.ingredients?.length || 0}
                    </span>
                    <p>
                      ingredients
                      <small>{item.source || 'Recipe details'}</small>
                    </p>
                  </div>
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
          {dishes.map((item, position) => (
            <button
              key={item.id}
              ref={(element) => {
                thumbs.current[position] = element
              }}
              type="button"
              className="dsh-thumbnail"
              aria-label={`Show ${item.label || `${item.title} ${item.subtitle}`}`}
              aria-current={position === index ? 'true' : undefined}
              onClick={() => go(position)}
            >
              <img
                src={item.image}
                alt=""
                width="56"
                height="56"
                loading="lazy"
              />
              <span>{item.label || `${item.title} ${item.subtitle}`}</span>
            </button>
          ))}
        </div>
        <p
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          Recipe {index + 1} of {count}: {dish.title} {dish.subtitle}
        </p>
      </div>
    </div>
  )
}
