import { useEffect, useState } from 'react'
import { MIN_PASSWORD } from './useClientSession'
import './ClientAccount.css'

const RESEND_AFTER = 60 // seconds; Supabase also refuses a new code for the same email within about a minute

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

// Opens in a new tab so a half-filled form is not lost.
function PrivacyLink() {
  return <a href="#privacy" target="_blank" rel="noreferrer">privacy notice</a>
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

function GoogleButton({ client, children, reset, quiet }) {
  return <button type="button" className={`btn ${quiet ? 'btn-ghost' : 'btn-bone'} dialog-account-button`} onClick={() => client.startGoogle({ reset })}>{children}</button>
}

function SignedOut({ client }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [failed, setFailed] = useState(false)
  const [step, setStep] = useState('password')
  const [code, setCode] = useState('')
  const [info, setInfo] = useState('')
  const [wait, setWait] = useState(0)
  const { busy, problem, run } = useAction()
  useEffect(() => {
    if (!wait) return
    const timer = setTimeout(() => setWait(left => left - 1), 1000)
    return () => clearTimeout(timer)
  }, [wait])
  const signIn = event => {
    event.preventDefault()
    run(async () => {
      try { await client.signInWithPassword(email, password) } catch (failure) { setFailed(true); throw failure }
    })
  }
  const emailCode = () => run(async () => {
    if (!email.trim()) throw new Error('Enter your email address first.')
    await client.sendCode(email)
    setInfo(step === 'code' ? 'A new code is on its way. Use the newest one.' : 'If this email has an account, a 6-digit code is on its way. It can take a minute.')
    setCode(''); setStep('code'); setWait(RESEND_AFTER)
  })
  return <>
    <h2 id="dialog-title" className="serif">Your place at the Block.</h2>
    <div className="client-tabs" role="group" aria-label="Account">
      <button type="button" aria-pressed={mode === 'signin'} onClick={() => setMode('signin')}>Sign in</button>
      <button type="button" aria-pressed={mode === 'signup'} onClick={() => setMode('signup')}>Create account</button>
    </div>
    {mode === 'signup' ? <>
      <p>Create your account in two steps. First we confirm your email with Google. Then you choose your name and a password.</p>
      <GoogleButton client={client}>Continue with Google</GoogleButton>
      <p className="client-hint">Google shares only your name, email address and profile picture link with us. By creating an account you accept our <PrivacyLink />.</p>
    </> : step === 'code' ? <>
      <p>Enter the 6-digit code we emailed to {email.trim()}.</p>
      <form className="client-form" onSubmit={event => { event.preventDefault(); run(() => client.verifyCode(email, code)) }}>
        <fieldset disabled={busy}>
          <Field label="6-digit code" inputMode="numeric" autoComplete="one-time-code" required maxLength={8} value={code} onChange={event => setCode(event.target.value)} />
          <button type="submit" className="btn btn-bone dialog-account-button">{busy ? 'Please wait…' : 'Confirm code'}</button>
        </fieldset>
      </form>
      <p className="client-hint">No email? Check your spam folder, ask for a new code, or confirm with Google instead.</p>
      <button type="button" className="client-link" disabled={busy || wait > 0} onClick={emailCode}>{wait > 0 ? `Send a new code in ${wait} s` : 'Send a new code'}</button>
      <button type="button" className="client-link" onClick={() => { setStep('password'); setCode(''); setInfo('') }}>Back</button>
      <GoogleButton client={client} reset quiet>Confirm with Google</GoogleButton>
    </> : <>
      <form className="client-form" onSubmit={signIn}>
        <fieldset disabled={busy}>
          <Field label="Email" type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} />
          <Field label="Password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} />
          <button type="submit" className="btn btn-bone dialog-account-button">{busy ? 'Please wait…' : 'Sign in'}</button>
        </fieldset>
      </form>
      <p className="client-or">or</p>
      <GoogleButton client={client}>Continue with Google</GoogleButton>
      <p className="client-hint">New to Skee Block? Continuing with Google creates your account, and means you accept our <PrivacyLink />.</p>
    </>}
    {step === 'password' && failed && mode === 'signin' && <div className="client-recover">
      <p>Forgot your password? First prove this email is yours, then you can choose a new password.</p>
      <GoogleButton client={client} reset quiet>Confirm with Google</GoogleButton>
      <button type="button" className="btn btn-ghost dialog-account-button" disabled={busy} onClick={emailCode}>Email me a code</button>
    </div>}
    {info && step === 'code' && <p role="status" className="client-notice">{info}</p>}
    <Messages error={client.error} problem={problem} />
  </>
}

function FinishAccount({ client, onLater }) {
  const meta = client.user.user_metadata || {}
  const [first, ...rest] = String(meta.full_name || meta.name || '').trim().split(/\s+/)
  const [fields, setFields] = useState({ firstName: first || '', lastName: rest.join(' '), password: '', confirm: '', accepted: false })
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
        <label className="client-check"><input type="checkbox" required checked={fields.accepted} onChange={event => setFields(current => ({ ...current, accepted: event.target.checked }))} /><span>I have read and accept the <PrivacyLink />.</span></label>
        <button type="submit" className="btn btn-bone dialog-account-button">{busy ? 'Please wait…' : 'Create my account'}</button>
      </fieldset>
    </form>
    <button type="button" className="client-link" onClick={onLater}>Not now</button>
    <Messages error={client.error} problem={problem} />
  </>
}

function ChoosePassword({ client, intro, onCancel, onDone }) {
  const [fields, setFields] = useState({ password: '', confirm: '' })
  const { busy, problem, run } = useAction()
  const set = key => event => setFields(current => ({ ...current, [key]: event.target.value }))
  return <>
    <h2 id="dialog-title" className="serif">Choose a new password.</h2>
    <p>{intro}</p>
    <form className="client-form" onSubmit={event => { event.preventDefault(); run(async () => { await client.changePassword(fields); onDone?.() }) }}>
      <fieldset disabled={busy}>
        <Field label="New password" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD} hint={`At least ${MIN_PASSWORD} characters.`} value={fields.password} onChange={set('password')} />
        <Field label="Confirm new password" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD} value={fields.confirm} onChange={set('confirm')} />
        <button type="submit" className="btn btn-bone dialog-account-button">{busy ? 'Please wait…' : 'Save password'}</button>
      </fieldset>
    </form>
    <button type="button" className="client-link" onClick={onCancel}>Cancel</button>
    <Messages error={client.error} problem={problem} />
  </>
}

function SignedIn({ client }) {
  const [changing, setChanging] = useState(false)
  const meta = client.user.user_metadata || {}
  const name = meta.first_name || String(meta.full_name || meta.name || '').trim().split(/\s+/)[0] || ''
  if (changing) return <ChoosePassword client={client} intro="Pick a new password for signing in with your email." onCancel={() => setChanging(false)} onDone={() => setChanging(false)} />
  return <>
    <h2 id="dialog-title" className="serif">{name ? `Hello, ${name}.` : 'Welcome back.'}</h2>
    <p>Signed in as {client.user.email}. Booking history and saved preferences are coming soon; bookings are not connected yet.</p>
    <Messages error={client.error} notice={client.notice} />
    <button type="button" className="btn btn-ghost dialog-account-button" onClick={() => setChanging(true)}>Change password</button>
    <button type="button" className="btn btn-ghost dialog-account-button" onClick={client.signOut}>Sign out</button>
  </>
}

export default function ClientAccount({ client, onLater }) {
  if (!client.ready) return <><h2 id="dialog-title" className="serif">Your place at the Block.</h2><p role="status">Checking your sign-in…</p></>
  if (!client.user) return <SignedOut client={client} />
  if (client.choosingPassword) return <ChoosePassword client={client} intro="Thank you, your email is confirmed. Pick a new password for signing in." onCancel={client.cancelPasswordChange} />
  if (!client.profileComplete) return <FinishAccount client={client} onLater={onLater} />
  return <SignedIn client={client} />
}
