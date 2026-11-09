import Icon from './Icon'

export function ErrorMessage({ error, onRetry }) {
  if (!error) return null
  return (
    <div className="error-message" role="alert">
      <Icon name="info" />
      <span>{error.message || error}</span>
      {onRetry && (
        <button className="text-button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ icon = 'leaf', title, children }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={30} />
      </span>
      <h2>{title}</h2>
      {children}
    </div>
  )
}

export function RecipeSkeletons() {
  return (
    <div className="recipe-grid" aria-label="Loading recipes" role="status">
      {[1, 2, 3, 4].map((id) => (
        <div className="recipe-card skeleton" key={id}>
          <div className="skeleton-image" />
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
      ))}
      <span className="sr-only">Loading recipes…</span>
    </div>
  )
}
