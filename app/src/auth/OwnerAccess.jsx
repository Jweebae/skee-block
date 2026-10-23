import { useState } from 'react'
import logo from '../assets/skee-logo-white.svg'
import { supabase } from '../lib/supabase'
import './OwnerAccess.css'

export default function OwnerAccess({ auth, setupError = '' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const changingPassword = auth.needsPassword && auth.user
  async function submit(event) {
    event.preventDefault(); setError(''); setMessage(''); setBusy(true)
    try {
      if (changingPassword) {
        if (password !== confirmPassword) throw new Error('The passwords do not match.')
        const { error: problem } = await supabase.auth.updateUser({ password })
        if (problem) throw new Error(problem.message)
        setPassword(''); setConfirmPassword(''); auth.finishPasswordSetup()
      } else {
        const { error: problem } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (problem) throw new Error('Could not sign in. Check your email and password, then try again.')
        setPassword('')
      }
    } catch (problem) { setError(problem.message) }
    finally { setBusy(false) }
  }
  async function resetPassword() {
    setError(''); setMessage('')
    if (!email.trim()) { setError('Enter your owner email address first.'); return }
    setBusy(true)
    try {
      const { error: problem } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}${window.location.pathname}#admin` })
      if (problem) throw problem
      setMessage('If an account matches this email, a password-reset link will arrive shortly.')
    } catch { setError('Could not request the reset email. Please try again later.') }
    finally { setBusy(false) }
  }
  return <main className="owner-access"><a className="owner-logo" href="#top"><img src={logo} alt="SKEE" /><span>Studio access</span></a><section className="owner-card">
    <span className="lbl">Skee Block · Owner</span><h1 className="serif">{changingPassword ? 'Set your password.' : 'Your studio.'}</h1>
    {setupError ? <p role="alert">{setupError}</p> : auth.phase === 'loading' ? <p role="status">Checking your sign-in…</p> : auth.phase === 'error' ? <><p role="alert">{auth.error}</p><button className="admin-save" onClick={auth.retry}>Try again</button></> : auth.phase === 'denied' && !changingPassword ? <><p>This account does not have owner access to Skee Block.</p><button className="admin-outline" onClick={() => auth.signOut().catch(problem => setError(problem.message))}>Sign out</button></> : <form onSubmit={submit}>
      <p>{changingPassword ? 'Choose a password to finish setting up your owner account.' : 'Sign in to manage the menu, add-ons and working hours.'}</p>
      <fieldset disabled={busy}>{!changingPassword && <label>Email<input type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} /></label>}
      <label>{changingPassword ? 'New password' : 'Password'}<input type="password" autoComplete={changingPassword ? 'new-password' : 'current-password'} minLength={changingPassword ? 12 : undefined} required value={password} onChange={event => setPassword(event.target.value)} /></label>
      {changingPassword && <label>Confirm password<input type="password" autoComplete="new-password" minLength={12} required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label>}
      <button type="submit" className="admin-save">{busy ? 'Please wait…' : changingPassword ? 'Save password' : 'Sign in'}</button>
      {!changingPassword && <button type="button" className="owner-reset" onClick={resetPassword}>Forgot your password?</button>}</fieldset>
    </form>}
    {error && <p className="admin-error" role="alert">{error}</p>}{message && <p className="admin-message" role="status">{message}</p>}<a className="owner-home" href="#top">← Back to the website</a>
  </section></main>
}
