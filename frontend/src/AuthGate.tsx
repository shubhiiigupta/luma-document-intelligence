import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import App from './App'
import { Spark } from './components/Icons'
import { supabase } from './lib/supabase'
import './Auth.css'

type Mode = 'signin' | 'signup' | 'forgot' | 'reset'
const recoveryKey = 'luma-password-recovery'
const incoming = new URLSearchParams(window.location.hash.slice(1))
const recovering = incoming.get('type') === 'recovery' || sessionStorage.getItem(recoveryKey) === 'true'
const callbackError = incoming.get('error_description')

export default function AuthGate() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(!!supabase)
  const [mode, setMode] = useState<Mode>(recovering ? 'reset' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(callbackError ? 'This email link is invalid or expired. Request a new link below.' : '')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const client = supabase
    if (!client) return
    let alive = true
    const { data: { subscription } } = client.auth.onAuthStateChange((event, next) => {
      if (!alive) return
      if (event === 'PASSWORD_RECOVERY') {
        sessionStorage.setItem(recoveryKey, 'true')
        setMode('reset')
      }
      if (event === 'SIGNED_OUT') sessionStorage.removeItem(recoveryKey)
      setSession(next)
      setLoading(false)
    })
    client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!alive) return
      if (sessionError) setError('Could not restore your session. Please sign in again.')
      setSession(data.session)
      setLoading(false)
    }).catch(() => {
      if (alive) { setError('Could not connect. Check your connection and try again.'); setLoading(false) }
    })
    return () => { alive = false; subscription.unsubscribe() }
  }, [])

  function changeMode(next: Mode) {
    if (next !== 'reset') sessionStorage.removeItem(recoveryKey)
    setMode(next); setPassword(''); setConfirm(''); setError(''); setMessage(''); setShowPassword(false)
  }

  async function signOut() {
    if (!supabase) return
    setBusy(true); setError('')
    try {
      const { error: authError } = await supabase.auth.signOut({ scope: 'local' })
      if (authError) throw authError
      sessionStorage.removeItem(recoveryKey)
      setSession(null); changeMode('signin')
    } catch { setError('Sign-out failed. Check your connection and try again.') }
    finally { setBusy(false) }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || busy) return
    setError(''); setMessage('')
    if ((mode === 'signup' || mode === 'reset') && password !== confirm) { setError('The passwords do not match.'); return }
    if (mode === 'reset' && !session) { setError('Open a fresh password-reset link from your email first.'); return }
    setBusy(true)
    const redirect = window.location.origin + window.location.pathname
    try {
      if (mode === 'signin') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (authError) throw authError
      } else if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: redirect } })
        if (authError) throw authError
        if (!data.session) { setMessage('Check your email for a confirmation link, then return to sign in.'); setPassword(''); setConfirm('') }
      } else if (mode === 'forgot') {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirect })
        if (authError) throw authError
        setMessage('If an account exists for that email, you’ll receive a password-reset link.')
      } else {
        const { error: authError } = await supabase.auth.updateUser({ password })
        if (authError) throw authError
        sessionStorage.removeItem(recoveryKey)
        changeMode('signin')
      }
      setPassword(''); setConfirm('')
    } catch (cause) {
      const code = (cause as { code?: string }).code
      setError(code === 'invalid_credentials' ? 'Email or password is incorrect.'
        : code === 'email_not_confirmed' ? 'Confirm your email before signing in. Check your inbox and spam folder.'
        : code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' ? 'Too many attempts. Please wait a few minutes and try again.'
        : code === 'weak_password' ? 'Choose a stronger password that meets your project’s password requirements.'
        : mode === 'reset' ? 'Could not update your password. Try a different password or request a new reset link.'
        : 'Could not complete this request. Check your connection and Supabase settings, then try again.')
    } finally { setBusy(false) }
  }

  if (loading) return <main className="auth-page auth-loading" aria-busy="true"><Spark /><p>Opening your workspace…</p></main>
  if (session && mode !== 'reset') return <><App key={session.user.id} userId={session.user.id} email={session.user.email ?? 'Your account'} onSignOut={signOut} signingOut={busy} />{error && <div className="auth-toast" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}</>

  const title = { signin: 'Welcome back.', signup: 'A little more clarity\nstarts here.', forgot: 'Let’s get you back in.', reset: 'A fresh start.' }[mode]
  return <main className="auth-page">
    <section className="auth-story" aria-label="About Luma">
      <div className="auth-brand"><Spark />luma<span>.</span></div>
      <div className="auth-story-content"><div className="auth-orb"><Spark /></div><span className="auth-eyebrow">YOUR KNOWLEDGE, CONNECTED.</span><h1>Your documents.<br /><span>Clear answers.</span></h1><p>A place to explore your information,<br />follow the sources, and find clarity.</p></div>
      <p className="auth-story-footer">LESS SEARCHING. MORE UNDERSTANDING.</p>
    </section>
    <section className="auth-form-side"><div className="auth-card">
      <span className="auth-eyebrow">YOUR PERSONAL WORKSPACE</span><h2>{title}</h2><p className="auth-subtitle">{mode === 'signin' ? 'Sign in to continue your curiosity.' : mode === 'signup' ? 'Create your Luma account with your email.' : mode === 'forgot' ? 'We’ll email you a link to reset your password.' : 'Choose a new password for your account.'}</p>
      {!supabase && <div className="auth-setup" role="status"><strong>One setup step remaining</strong><p>Connect your Supabase project to activate accounts. Follow AUTH_SETUP.md in the frontend folder, then restart the website.</p></div>}
      {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
      {message && <p className="auth-feedback auth-success" role="status">{message}</p>}
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          {mode !== 'reset' && <label className="auth-field">Email address<input type="email" name="email" autoComplete="email" placeholder="you@example.com" value={email} required maxLength={254} onChange={(event) => setEmail(event.target.value)} /></label>}
          {mode !== 'forgot' && <><label className="auth-field">{mode === 'reset' ? 'New password' : 'Password'}<span className="auth-password"><input type={showPassword ? 'text' : 'password'} name="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} placeholder={mode === 'signin' ? 'Enter your password' : 'At least 8 characters'} minLength={mode === 'signin' ? 1 : 8} required value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></span></label>{(mode === 'signup' || mode === 'reset') && <label className="auth-field">Confirm password<input type={showPassword ? 'text' : 'password'} name="confirm" autoComplete="new-password" required minLength={8} value={confirm} placeholder="Enter it once more" onChange={(event) => setConfirm(event.target.value)} /></label>}</>}
          {mode === 'signin' && <button className="auth-link auth-forgot" type="button" onClick={() => changeMode('forgot')}>Forgot password?</button>}
          <button className="auth-submit" disabled={!supabase || (mode === 'reset' && !session)} type="submit">{busy ? 'Please wait…' : { signin: 'Sign in', signup: 'Create account', forgot: 'Send reset link', reset: 'Save new password' }[mode]}<span aria-hidden="true">↗</span></button>
        </fieldset>
      </form>
      <div className="auth-switch">{mode === 'signin' ? <>New to Luma? <button disabled={busy} className="auth-link" onClick={() => changeMode('signup')}>Create an account</button></> : mode === 'signup' ? <>Already have an account? <button disabled={busy} className="auth-link" onClick={() => changeMode('signin')}>Sign in</button></> : <button disabled={busy} className="auth-link" onClick={() => { if (session) void signOut(); else changeMode('signin') }}>← Back to sign in</button>}</div>
      {mode === 'reset' && !session && <button className="auth-link" onClick={() => changeMode('forgot')}>Request a new reset link</button>}
      <p className="auth-footnote">Accounts are managed by Supabase.<br />Private document storage. AI answers coming next.</p>
    </div></section>
  </main>
}
