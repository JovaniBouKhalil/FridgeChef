import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Icon from './Icon'

export default function BackToTop() {
  const [visible, setVisible] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => {
    function update() {
      setVisible(window.scrollY > Math.max(500, window.innerHeight * 0.75))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [pathname])

  if (!visible) return null
  return (
    <button
      type="button"
      className="back-to-top"
      aria-label="Back to top"
      title="Back to top"
      onClick={() => {
        document.getElementById('main-content')?.focus({ preventScroll: true })
        const reduced = window.matchMedia?.(
          '(prefers-reduced-motion: reduce)',
        ).matches
        window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' })
      }}
    >
      <Icon name="up" size={20} />
    </button>
  )
}
