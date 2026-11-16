import { useEffect, useId, useRef, useState } from 'react'
import { readJSON } from '../utils/storage'
import Icon from './Icon'

const HISTORY_KEY = 'fridgechef.recentSearches.v1'
const ideas = ['Pasta', 'Chicken', 'Soup', 'Pancakes', 'Salmon']

export default function RecipeSearch({ query, onSearch }) {
  const [draft, setDraft] = useState(query)
  const [previousQuery, setPreviousQuery] = useState(query)
  const [recent, setRecent] = useState(() => {
    const saved = readJSON(localStorage, HISTORY_KEY, [])
    return Array.isArray(saved)
      ? saved
          .filter(
            (value) =>
              typeof value === 'string' && value.trim() && value.length <= 100,
          )
          .slice(0, 5)
      : []
  })
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const root = useRef(null)
  const input = useRef(null)
  const listId = useId()
  const hintId = useId()

  // Keep the draft aligned with browser Back/Forward without remounting the input.
  if (previousQuery !== query) {
    setPreviousQuery(query)
    setDraft(query)
    setOpen(false)
    setActive(-1)
  }

  useEffect(() => {
    function outside(event) {
      if (!root.current?.contains(event.target)) {
        setOpen(false)
        setActive(-1)
      }
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [])

  function storeHistory(next) {
    setRecent(next)
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
    } catch {
      /* Searching still works if browser storage is unavailable. */
    }
  }

  const recentMatches = recent.filter((value) =>
    value.toLowerCase().includes(draft.trim().toLowerCase()),
  )
  const suggestions = [
    ...recentMatches.map((value) => ({ value, recent: true })),
    ...ideas
      .filter(
        (value) =>
          value.toLowerCase().includes(draft.trim().toLowerCase()) &&
          !recent.some((item) => item.toLowerCase() === value.toLowerCase()),
      )
      .map((value) => ({ value, recent: false })),
  ].slice(0, 6)
  const expanded = open && suggestions.length > 0

  useEffect(() => {
    if (expanded && active >= 0) {
      document
        .getElementById(`${listId}-${active}`)
        ?.scrollIntoView?.({ block: 'nearest' })
    }
  }, [expanded, active, listId])

  function search(value) {
    const trimmed = value.trim()
    if (trimmed)
      storeHistory(
        [
          trimmed,
          ...recent.filter(
            (item) => item.toLowerCase() !== trimmed.toLowerCase(),
          ),
        ].slice(0, 5),
      )
    input.current?.focus()
    setDraft(trimmed)
    setOpen(false)
    setActive(-1)
    onSearch(trimmed)
  }

  return (
    <div
      className="recipe-search"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false)
          setActive(-1)
        }
      }}
    >
      <form
        className="search-form"
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          search(draft)
        }}
      >
        <Icon name="search" size={21} />
        <label htmlFor="recipe-search" className="sr-only">
          Search recipes by name
        </label>
        <input
          id="recipe-search"
          ref={input}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded ? listId : undefined}
          aria-activedescendant={
            expanded && active >= 0 ? `${listId}-${active}` : undefined
          }
          aria-describedby={expanded ? hintId : undefined}
          autoComplete="off"
          placeholder="Recipe name"
          value={draft}
          maxLength={100}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(event) => {
            setDraft(event.target.value)
            setOpen(true)
            setActive(-1)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              setOpen(false)
              setActive(-1)
            } else if (
              (event.key === 'ArrowDown' || event.key === 'ArrowUp') &&
              suggestions.length
            ) {
              event.preventDefault()
              setOpen(true)
              setActive((index) =>
                event.key === 'ArrowDown'
                  ? (index + 1) % suggestions.length
                  : (index <= 0 ? suggestions.length : index) - 1,
              )
            } else if (
              event.key === 'Enter' &&
              expanded &&
              active >= 0 &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault()
              search(suggestions[active].value)
            }
          }}
        />
        {draft && (
          <button
            className="icon-button search-clear"
            type="button"
            aria-label="Clear recipe search"
            onClick={() => {
              setDraft('')
              setActive(-1)
              setOpen(true)
              input.current?.focus()
              if (query) onSearch('')
            }}
          >
            <Icon name="close" size={16} />
          </button>
        )}
        <button
          className="button button-small"
          type="submit"
          aria-label="Find recipes"
        >
          Search <Icon name="arrow" size={16} />
        </button>
      </form>
      {expanded && (
        <div className="search-suggestions">
          <p className="suggestions-heading">Suggestions</p>
          <div className="suggestion-columns">
            <ul id={listId} role="listbox" aria-label="Recipe suggestions">
              {suggestions.map((item, index) => (
                <li
                  id={`${listId}-${index}`}
                  key={item.value}
                  role="option"
                  aria-selected={active === index}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => search(item.value)}
                  onPointerMove={() => setActive(index)}
                >
                  <Icon name={item.recent ? 'history' : 'book'} size={16} />
                  <span>{item.value}</span>
                  <small>{item.recent ? 'Recent' : 'Try it'}</small>
                </li>
              ))}
            </ul>
            <div
              className="suggestion-remove-controls"
              role="group"
              aria-label="Manage recent searches"
            >
              {suggestions.map((item) =>
                item.recent ? (
                  <button
                    type="button"
                    className="icon-button"
                    key={item.value}
                    aria-label={`Remove recent search ${item.value}`}
                    onClick={() => {
                      storeHistory(
                        recent.filter((value) => value !== item.value),
                      )
                      setActive(-1)
                      input.current?.focus()
                    }}
                  >
                    <Icon name="close" size={15} />
                  </button>
                ) : (
                  <span key={item.value} aria-hidden="true" />
                ),
              )}
            </div>
          </div>
          <p id={hintId} className="suggestions-hint">
            Use ↑ ↓ to browse, Enter to choose, Esc to close.
          </p>
        </div>
      )}
    </div>
  )
}
