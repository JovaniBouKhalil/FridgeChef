import { useState } from 'react'
import Icon from './Icon'

export default function RecipeSearch({ query, onSearch }) {
  const [draft, setDraft] = useState(query)
  return (
    <form
      className="search-form"
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        onSearch(draft.trim())
      }}
    >
      <Icon name="search" size={21} />
      <label htmlFor="recipe-search" className="sr-only">
        Search recipes by name
      </label>
      <input
        id="recipe-search"
        type="search"
        placeholder="What are you craving? Try pasta, chicken, soup…"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        maxLength={100}
      />
      <button className="button button-small" type="submit">
        Find recipes <Icon name="arrow" size={16} />
      </button>
    </form>
  )
}
