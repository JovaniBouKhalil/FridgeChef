import { useEffect, useRef } from 'react'

// Content is visible by default, even without JS observer support. Animate once.
export default function Reveal({
  as: Element = 'div',
  children,
  className = '',
  ...props
}) {
  const element = useRef(null)
  useEffect(() => {
    if (
      !window.IntersectionObserver ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    )
      return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          element.current?.setAttribute('data-revealed', 'true')
          observer.disconnect()
        }
      },
      { threshold: 0.08 },
    )
    observer.observe(element.current)
    return () => observer.disconnect()
  }, [])
  return (
    <Element {...props} ref={element} className={`reveal ${className}`}>
      {children}
    </Element>
  )
}
