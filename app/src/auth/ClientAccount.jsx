import { useState } from 'react'
import { MIN_PASSWORD } from './useClientSession'
import './ClientAccount.css'

// Runs a form action, showing a readable message instead of an error screen.
function useAction() {
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState('')
  async function run(task) {
    setProblem(''); setBusy(true)
    try { await task() } catch (failure) { setProblem(failure.message) } finally { setBusy(false) }
  }
  return { busy, problem, run }
}

function Field({ label, hint, ...props }) {
  return <label>{label}<input {...props} />{hint && <span className="client-hint">{hint}</span>}</label>
}

function Messages({ error, notice, problem }) {
  return <>
    {(problem || error) && <p role="alert" className="client-error">{problem || error}</p>}
    {notice && <p role="status" className="client-notice">{notice}</p>}
  </>
}

function GoogleButton({ client, children, verify }) {
  return <button type="button" className="btn btn-bone dialog-account-button" onClick={() => client.startGoogle({ verify })}>{children}</button>
}

function SignedOut({ client }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { busy, problem, run } = useAction()
  return <>
    <h2 id="dialog-title" className="serif">Your place at the Block.</h2>
    <div className="client-tabs" role="group" aria-label="Account">
      <button type="button" aria-pressed={mode === 'signin'} onClick={() => setMode('signin')}>Sign in</button>
      <button type="button" aria-pressed={mode === 'signup'} onClick={() => setMode('signup')}>Create account</button>
    </div>
    {mode === 'signin' ? <>
      <form className="client-form" onSubmit={event => { event.preventDefault(); run(() => client.signInWithPassword(email, password)) }}>
        <fieldset disabled={busy}>
          <Field label="Email" type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} />
          <Field label="Password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} />
          <button type="submit" className="btn btn-bone dialog-account-button">{busy ? 'Please wait…' : 'Sign in'}</button>
        </fieldset>
      </form>
      <p className="client-or">or</p>
      <GoogleButton client={client}>Continue with Google</GoogleButton>
      <button type="button" className="client-link" onClick={() => client.startGoogle({ verify: true })}>Forgot your password? Confirm with Google</button>
    </> : <>
      <p>Create your account in two steps. First we confirm your email with Google. Then you choose your name and a password.</p>
      <GoogleButton client={client}>Continue with Google</GoogleButton>
      <p className="client-hint">We only receive your name and email address from Google.</p>
    </>}
    <Messages error={client.error} problem={problem} />
  </>
}

function FinishAccount({ client, onLater }) {
  const meta = client.user.user_metadata || {}
  const [first, ...rest] = String(meta.full_name || meta.name || '').trim().split(/\s+/)
  const [fields, setFields] = useState({ firstName: first || '', lastName: rest.join(' '), password: '', confirm: '' })
  const { busy, problem, run } = useAction()
  const set = key => event => setFields(current => ({ ...current, [key]: event.target.value }))
  return <>
    <h2 id="dialog-title" className="serif">Almost done.</h2>
    <p>Your email is confirmed. Choose how Skee should know you, and set a password so you can also sign in without Google.</p>
    <form className="client-form" onSubmit={event => { event.preventDefault(); run(() => client.completeProfile(fields)) }}>
      <fieldset disabled={busy}>
        <div className="client-two">
          <Field label="First name" autoComplete="given-name" required maxLength={60} value={fields.firstName} onChange={set('firstName')} />
          <Field label="Last name" autoComplete="family-name" required maxLength={60} value={fields.lastName} onChange={set('lastName')} />
        </div>
        <Field label="Password" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD} hint={`At least ${MIN_PASSWORD} characters.`} value={fields.password} onChange={set('password')} />
        <Field label="Confirm password" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD} value={fields.confirm} onChange={set('confirm')} />
        <button type="submit" className="btn btn-bone dialog-account-button">{busy ? 'Please wait…' : 'Create my account'}</button>
      </fieldset>
    </form>
    <button type="button" className="client-link" onClick={onLater}>Not now</button>
    <Messages error={client.error} problem={problem} />
  </>
}

function ChoosePassword({ client }) {
  const [fields, setFields] = useState({ password: '', confirm: '' })
  const { busy, problem, run } = useAction()
  const set = key => event => setFields(current => ({ ...current, [key]: event.target.value }))
  return <>
    <h2 id="dialog-title" className="serif">Choose a new password.</h2>
    <p>Google confirmed it is you. Pick a new password for signing in with your email.</p>
    <form className="client-form" onSubmit={event => { event.preventDefault(); run(() => client.changePassword(fields)) }}>
      <fieldset disabled={busy}>
        <Field label="New password" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD} hint={`At least ${MIN_PASSWORD} characters.`} value={fields.password} onChange={set('password')} />
        <Field label="Confirm new password" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD} value={fields.confirm} onChange={set('confirm')} />
        <button type="submit" className="btn btn-bone dialog-account-button">{busy ? 'Please wait…' : 'Save password'}</button>
      </fieldset>
    </form>
    <button type="button" className="client-link" onClick={client.cancelPasswordChange}>Cancel</button>
    <Messages error={client.error} problem={problem} />
  </>
}

function SignedIn({ client }) {
  const meta = client.user.user_metadata || {}
  const name = meta.first_name || String(meta.full_name || meta.name || '').trim().split(/\s+/)[0] || ''
  return <>
    <h2 id="dialog-title" className="serif">{name ? `Hello, ${name}.` : 'Welcome back.'}</h2>
    <p>Signed in as {client.user.email}. Booking history and saved preferences are coming soon; bookings are not connected yet.</p>
    <Messages error={client.error} notice={client.notice} />
    <button type="button" className="btn btn-ghost dialog-account-button" onClick={() => client.startGoogle({ verify: true })}>Change password</button>
    <p className="client-hint">For your security we ask you to confirm with Google again first.</p>
    <button type="button" className="btn btn-ghost dialog-account-button" onClick={client.signOut}>Sign out</button>
  </>
}

export default function ClientAccount({ client, onLater }) {
  if (!client.ready) return <><h2 id="dialog-title" className="serif">Your place at the Block.</h2><p role="status">Checking your sign-in…</p></>
  if (!client.user) return <SignedOut client={client} />
  if (client.canChangePassword) return <ChoosePassword client={client} />
  if (!client.profileComplete) return <FinishAccount client={client} onLater={onLater} />
  return <SignedIn client={client} />
}
