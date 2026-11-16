import Icon from './Icon'

export function Spinner() {
  return <span className="spinner" aria-hidden="true" />
}

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
        <div className="recipe-card skeleton" key={id} aria-hidden="true">
          <div className="recipe-photo-wrap skeleton-image skeleton-block" />
          <div className="recipe-card-body">
            <div className="skeleton-meta skeleton-block" />
            <div className="skeleton-title skeleton-block" />
            <div className="recipe-card-footer">
              <div className="skeleton-meta skeleton-block" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Loading recipes…</span>
    </div>
  )
}
