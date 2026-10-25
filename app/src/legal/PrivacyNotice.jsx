import { useEffect } from 'react'
import logo from '../assets/skee-logo-white.svg'
import { PRIVACY_CONTACT, PRIVACY_UPDATED } from './privacy'
import HeaderAvatar from '../auth/HeaderAvatar'
import './PrivacyNotice.css'

// Plain-language notice. Describe only what the site actually does; update it with every data-related feature.
export default function PrivacyNotice({ client, profileStatus }) {
  useEffect(() => { window.scrollTo(0, 0) }, [])
  const mail = <a href={`mailto:${PRIVACY_CONTACT}`}>{PRIVACY_CONTACT}</a>
  return <main className="privacy-page">
    <a className="privacy-head" href="#top"><img src={logo} alt="SKEE" /><span>Privacy</span>{client?.user && <HeaderAvatar user={client.user} status={profileStatus} size={32} className="privacy-avatar" />}</a>
    <article className="privacy-body">
      <span className="lbl">Skee Block · 3kee.site</span>
      <h1 className="serif">Privacy notice.</h1>
      <p className="privacy-updated">Last updated {PRIVACY_UPDATED}</p>
      <p>This notice explains what personal information the Skee Block website collects, why we use it, who helps us handle it, and the choices you have.</p>

      <h2>Who is responsible</h2>
      <p>Skee Block, a barbershop in M’Sila, Algeria (“we”). For anything about your personal information, write to {mail}.</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>When you create an account:</strong> your first name, last name, email address and a password. The password is stored only as a secure, scrambled code by our account provider; nobody at Skee Block can see it. We also record the date you accepted this notice.</li>
        <li><strong>If you use Google to sign in:</strong> Google shares your name, email address and the link to your profile picture. We never receive your Google password or anything else from your Google account.</li>
        <li><strong>When you sign in:</strong> technical records needed to keep accounts secure, such as the time of sign-in and your device’s internet address (IP address), kept in our account provider’s logs.</li>
        <li><strong>Your username:</strong> chosen by you or created from your name, so you can sign in without typing your email.</li>
        <li><strong>When you book:</strong> your WhatsApp number, the cut, extras, date and time you choose, your preferences and notes, how you want reminders, and the history of your appointments (requested, confirmed, completed, cancelled or missed).</li>
        <li><strong>If you verify your WhatsApp number:</strong> the code message you send to our business number, so we can confirm the number is yours.</li>
        <li><strong>Your profile photo, if you add one:</strong> it is optional and private. Skee sees it with your appointments so he knows who is in the chair. Other visitors only see it next to a review if you choose so when you write the review.</li>
        <li><strong>When you contact us:</strong> messages you send by email, WhatsApp or Instagram, so we can reply. WhatsApp and Instagram handle those conversations under their own privacy terms.</li>
      </ul>
      <p>We do not use advertising or analytics trackers, and we do not sell or rent your personal information.</p>

      <h2>Why we use it</h2>
      <p>To create and run your account, recognise you when you sign in, help you recover a forgotten password, answer your messages, arrange your appointments, and send you confirmations, changes and reminders by email (and by WhatsApp if you choose it). Skee uses your optional profile photo only to know who is in the chair. We do not use your information for advertising, and we do not use automated face recognition.</p>

      <h2>Who helps us</h2>
      <ul>
        <li><strong>Supabase</strong> runs our accounts, database and photo storage, on servers in Paris, France.</li>
        <li><strong>Resend</strong> sends our emails, such as booking confirmations and reminders.</li>
        <li><strong>Meta (WhatsApp)</strong> carries WhatsApp messages between you and our business number when you verify your number or choose WhatsApp reminders.</li>
        <li><strong>GitHub Pages</strong> hosts the website and may log visitors’ IP addresses for security.</li>
        <li><strong>Google</strong> handles Google sign-in when you choose it, and delivers email sent to our 3kee.site addresses to our inbox.</li>
        <li><strong>Namecheap</strong> manages the 3kee.site domain and its email.</li>
      </ul>
      <p>Some of these companies process information outside Algeria. They only handle it to provide their service to us.</p>

      <h2>What is stored on your device</h2>
      <p>Your browser keeps your sign-in session (so you stay signed in), a copy of our public menu and opening hours, and a short-lived marker while you reset a password. We use no advertising cookies.</p>

      <h2>How long we keep it</h2>
      <p>We keep your account details while your account is open. If you ask us to delete your account, we remove your details within 30 days. Messages are kept only as long as needed to answer you and manage your visit.</p>

      <h2>Your rights</h2>
      <p>You can ask to see, correct or delete your personal information, or object to how we use it, by writing to {mail}. We reply within 30 days. We handle personal information in line with Algeria’s Law No. 18-07 of 10 June 2018 on the protection of personal data, and you can also contact the national personal-data protection authority (ANPDP).</p>

      <h2>Keeping it safe</h2>
      <p>Passwords are never stored in readable form, the connection to our site is encrypted, and only the studio owners can change the studio’s settings.</p>

      <h2>Changes to this notice</h2>
      <p>If we change this notice, we update the date at the top. For important changes, we tell account holders.</p>

      <a className="privacy-home" href="#top">← Back to the website</a>
    </article>
  </main>
}
