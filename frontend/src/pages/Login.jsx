import { Eye, EyeOff, LockKeyhole, LogIn, Mail, Send } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { appConfig } from '../config/env'
import { API_URL } from '../data/catalog'

function Login({ user, onLogin }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [requiresVerification, setRequiresVerification] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      })
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403 && data.requiresVerification) {
          setVerificationEmail(data.email || email.trim())
          setRequiresVerification(true)
          setError('')
          return
        }
        throw new Error(data.message || 'Unable to sign in')
      }

      if (data.requiresVerification) {
        setVerificationEmail(email.trim())
        setRequiresVerification(true)
        setError('')
        return
      }

      await onLogin(data)
      navigate(location.state?.from || '/', { replace: true })
    } catch (loginError) {
      setError(loginError.message === 'Failed to fetch'
        ? 'Sign in is temporarily unavailable. Please try again shortly.'
        : loginError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerify = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail || email.trim(), code: verificationCode.trim() }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to verify your email')
      }

      await onLogin(data)
      navigate(location.state?.from || '/', { replace: true })
    } catch (loginError) {
      setError(loginError.message === 'Failed to fetch'
        ? 'Verification is temporarily unavailable. Please try again shortly.'
        : loginError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendCode = async () => {
    if (!verificationEmail && !email.trim()) return
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail || email.trim() }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to resend the verification code')
      }

      setError('')
      setVerificationCode('')
      setMode('login')
    } catch (loginError) {
      setError(loginError.message === 'Failed to fetch'
        ? 'The resend request is temporarily unavailable.'
        : loginError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <img className="auth-logo" src="/logo/lapreh-logo.png" alt={`${appConfig.name} logo`} />
        <p className="eyebrow">{appConfig.name} Account</p>
        <h1>Welcome back.</h1>
        <p>Sign in or create an account to save your cart, checkout securely, and track purchases.</p>
        <div className="auth-feature">
          <LockKeyhole size={20} />
          <span>Your account details are kept secure</span>
        </div>
      </section>

      <section className="auth-card" aria-labelledby="login-title">
        <div>
          <p className="eyebrow">Secure access</p>
          <h2 id="login-title">{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
          <p>{mode === 'login' ? 'Enter your account details to continue.' : 'Create an account for checkout and order tracking.'}</p>
        </div>

        <form className="auth-form" onSubmit={requiresVerification ? handleVerify : handleSubmit}>
          {!requiresVerification && mode === 'register' && (
            <label>
              <span>Full name</span>
              <div className="auth-input">
                <input value={name} onChange={(event) => setName(event.target.value)} required />
              </div>
            </label>
          )}
          <label>
            <span>Email address</span>
            <div className="auth-input">
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (requiresVerification) setVerificationEmail(event.target.value)
                }}
                autoComplete="email"
                required
              />
            </div>
          </label>

          {(mode === 'register' || requiresVerification) && (
            <p className="auth-note">
              Verification code may arrive in your spam or junk folder. Please check there if you don't see it in your inbox.
            </p>
          )}

          {!requiresVerification && (
            <label>
              <span>Password</span>
              <div className="auth-input">
                <LockKeyhole size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          )}

          {requiresVerification && (
            <>
              <label>
                <span>Verification code</span>
                <div className="auth-input">
                  <Send size={18} />
                  <input
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                  />
                </div>
              </label>
              <button className="auth-switch" type="button" onClick={handleResendCode} disabled={isSubmitting}>
                Resend code
              </button>
            </>
          )}

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            <LogIn size={18} />
            {isSubmitting ? 'Please wait...' : requiresVerification ? 'Verify Email' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {!requiresVerification && (
            <button className="auth-switch" type="button" onClick={() => { setMode((current) => current === 'login' ? 'register' : 'login'); setError(''); setName(''); setPassword(''); setVerificationCode(''); }}>
              {mode === 'login' ? 'New customer? Create an account' : 'Already have an account? Sign in'}
            </button>
          )}

          {requiresVerification && (
            <button className="auth-switch" type="button" onClick={() => { setRequiresVerification(false); setError(''); setVerificationCode(''); }}>
              Back to sign in
            </button>
          )}
        </form>
      </section>
    </main>
  )
}

export default Login
