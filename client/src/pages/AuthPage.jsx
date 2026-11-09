import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import Icon from '../components/Icon'
import { ErrorMessage, Spinner } from '../components/Feedback'
import Reveal from '../components/Reveal'
import { focusFirstError, validateAuth } from '../utils/validation'

export default function AuthPage({ mode = 'login' }) {
  const signup = mode === 'signup'
  const { token, expired, authenticate, startDemo } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [touched, setTouched] = useState({})
  const errors = validateAuth(form, signup)
  const [serverError, setServerError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const from = location.state?.from
  const destination =
    typeof from === 'string' &&
    from.startsWith('/') &&
    !from.startsWith('//') &&
    !/^\/(login|signup)/.test(from)
      ? from
      : '/pantry'

  if (token) return <Navigate to={destination} replace />

  function onChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
    setServerError(null)
  }

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setTouched(
      Object.fromEntries(Object.keys(form).map((name) => [name, true])),
    )
    if (Object.keys(errors).length) {
      focusFirstError(event.currentTarget, errors)
      return
    }
    setBusy(true)
    setServerError(null)
    try {
      await authenticate(mode, {
        ...(signup && { name: form.name.trim() }),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })
      navigate(destination, { replace: true })
    } catch (error) {
      setServerError(error)
    } finally {
      setBusy(false)
    }
  }

  function field(name, label, type, placeholder, autoComplete) {
    const error = touched[name] && errors[name]
    return (
      <div className="field" key={name}>
        <label htmlFor={name}>{label}</label>
        <div className={name === 'password' ? 'password-input' : ''}>
          <input
            id={name}
            name={name}
            type={name === 'password' && showPassword ? 'text' : type}
            placeholder={placeholder}
            value={form[name]}
            onChange={onChange}
            onBlur={() =>
              setTouched((previous) => ({ ...previous, [name]: true }))
            }
            disabled={busy}
            autoComplete={autoComplete}
            maxLength={name.toLowerCase().includes('password') ? 128 : 100}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : undefined}
          />
          {name === 'password' && (
            <button
              type="button"
              className="icon-button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              disabled={busy}
            >
              <Icon name="eye" size={19} />
            </button>
          )}
        </div>
        <span
          className="field-error field-message"
          id={`${name}-error`}
          aria-live="polite"
        >
          {error && (
            <>
              <Icon name="info" size={13} />
              {error}
            </>
          )}
        </span>
      </div>
    )
  }

  return (
    <div className="auth-layout">
      <Reveal as="section" className="auth-story">
        <h2>Keep track of your ingredients.</h2>
        <p>Save recipes and build a shopping list from what’s missing.</p>
        <img
          src="/images/52977.jpg"
          alt="A warming bowl of lentil soup"
          width="500"
          height="500"
        />
        <span className="auth-story-caption">Corba · Turkish lentil soup</span>
      </Reveal>
      <Reveal as="section" className="auth-form-panel">
        <h1>{signup ? 'Create an account' : 'Sign in'}</h1>
        <p>
          {signup
            ? 'Keep your pantry, saved recipes, and shopping list in one place.'
            : 'Sign in to manage your pantry and saved recipes.'}
        </p>
        {expired && (
          <div className="small-note" role="status">
            <Icon name="lock" size={18} />
            Your session has expired. Please sign in again.
          </div>
        )}
        <form onSubmit={submit} noValidate aria-busy={busy}>
          {signup && field('name', 'Name', 'text', 'Your name', 'name')}
          {field('email', 'Email address', 'email', 'you@example.com', 'email')}
          {field(
            'password',
            'Password',
            'password',
            signup ? 'At least 8 characters' : 'Your password',
            signup ? 'new-password' : 'current-password',
          )}
          {signup &&
            field(
              'confirmPassword',
              'Confirm password',
              'password',
              'Re-enter your password',
              'new-password',
            )}
          <ErrorMessage error={serverError} />
          <button type="submit" className="button button-full" disabled={busy}>
            {busy ? 'One moment…' : signup ? 'Create account' : 'Sign in'}
            {busy ? <Spinner /> : <Icon name="arrow" size={18} />}
          </button>
        </form>
        <p className="auth-switch">
          {signup ? 'Already have an account?' : 'Don’t have an account?'}{' '}
          <Link
            to={signup ? '/login' : '/signup'}
            state={{ from: destination }}
          >
            {signup ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
        <div className="auth-divider">
          <span>or try it first</span>
        </div>
        <button
          className="button button-outline button-full"
          onClick={() => {
            startDemo()
            navigate(destination)
          }}
        >
          Try demo kitchen <Icon name="arrow" size={17} />
        </button>
        <p className="auth-demo-note">Sample data. No account required.</p>
      </Reveal>
    </div>
  )
}
