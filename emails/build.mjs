// Builds every 3kee email from one shared layout so they stay consistent.
// Run: node emails/build.mjs  → writes emails/dist/*.html and a preview page emails/dist/index.html.
// Email clients ignore <style> blocks and SVG inconsistently, so everything is inline styles, tables and a PNG logo.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'dist')
const SITE = 'https://3kee.site'
const LOGO = `${SITE}/email/3kee-logo.png` // app/public/email/3kee-logo.png, served by the website
const CONTACT = 'contact@3kee.site'
const INSTAGRAM = 'https://www.instagram.com/skeeondablock/'
const C = { ink: '#0B0B0B', onyx: '#131313', line: '#262626', bone: '#F2EFE9', muted: '#BDB8B0', smoke: '#8E8B85', gilt: '#C9A96A' }
const SERIF = "Georgia, 'Times New Roman', Times, serif"
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif"

const label = text => `<p style="margin:0 0 18px;font:500 11px/1.4 ${SANS};letter-spacing:3px;text-transform:uppercase;color:${C.gilt}">${text}</p>`
const heading = text => `<h1 style="margin:0 0 20px;font:400 34px/1.15 ${SERIF};color:${C.bone}">${text}</h1>`
const para = html => `<p style="margin:0 0 18px;font:400 16px/1.65 ${SANS};color:${C.muted}">${html}</p>`
const small = html => `<p style="margin:18px 0 0;font:400 13px/1.6 ${SANS};color:${C.smoke}">${html}</p>`
const button = (text, href) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 10px"><tr><td bgcolor="${C.bone}" style="border-radius:2px"><a href="${href}" style="display:inline-block;padding:16px 30px;font:600 13px/1 ${SANS};letter-spacing:2px;text-transform:uppercase;color:${C.ink};text-decoration:none">${text}</a></td></tr></table>`
const code = token => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:6px 0 10px"><tr><td align="center" style="border:1px solid ${C.gilt};padding:22px 12px;font:600 34px/1 'Courier New',Courier,monospace;letter-spacing:10px;color:${C.bone}">${token}</td></tr></table>`
const details = rows => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:6px 0 22px;border-top:1px solid ${C.line}">${rows.map(([k, v]) => `<tr><td style="padding:12px 0;border-bottom:1px solid ${C.line};font:400 12px/1.4 ${SANS};letter-spacing:2px;text-transform:uppercase;color:${C.smoke};width:38%">${k}</td><td style="padding:12px 0;border-bottom:1px solid ${C.line};font:400 15px/1.4 ${SANS};color:${C.bone}">${v}</td></tr>`).join('')}</table>`

function layout({ title, preheader, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${C.ink}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.ink}">${preheader}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${C.ink}" style="background:${C.ink}">
<tr><td align="center" style="padding:32px 16px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px">
<tr><td align="center" style="padding:0 0 28px"><a href="${SITE}"><img src="${LOGO}" width="160" height="100" alt="3kee" style="display:block;border:0;width:160px;height:auto"></a></td></tr>
<tr><td bgcolor="${C.onyx}" style="background:${C.onyx};border:1px solid ${C.line};border-top:2px solid ${C.gilt};padding:40px 36px">
${body}
</td></tr>
<tr><td align="center" style="padding:28px 12px 0;font:400 12px/1.7 ${SANS};color:${C.smoke}">
3kee · M’Sila, Algeria<br>
<a href="${SITE}" style="color:${C.muted}">3kee.site</a> &nbsp;·&nbsp; <a href="${INSTAGRAM}" style="color:${C.muted}">Instagram</a> &nbsp;·&nbsp; <a href="${SITE}/#privacy" style="color:${C.muted}">Privacy</a><br>
Questions? Write to <a href="mailto:${CONTACT}" style="color:${C.muted}">${CONTACT}</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
`
}

const ignore = small('If you did not ask for this, you can ignore this email. Nothing will change.')

// Supabase account emails: paste into Supabase → Authentication → Emails. They use Supabase's {{ .Variable }} syntax.
// App emails: sent by the website once bookings are stored. They use {{snake_case}} placeholders filled by the sender.
const TEMPLATES = [
  {
    file: 'auth-code.html', group: 'supabase', where: 'Magic Link (also used for "Email me a code")', subject: 'Your 3kee code',
    preheader: 'Your one-time code to confirm it’s you.',
    body: label('Account') + heading('Your code.') + para('Enter this code on 3kee.site to confirm it’s you. You can then choose a new password.') + code('{{ .Token }}') + small('The code works once and expires in 60 minutes.') + ignore,
  },
  {
    file: 'auth-reset-password.html', group: 'supabase', where: 'Reset Password', subject: 'Reset your 3kee password',
    preheader: 'Choose a new password for your 3kee account.',
    body: label('Account') + heading('Choose a new password.') + para('We received a request to reset the password for your 3kee account.') + button('Choose a new password', '{{ .ConfirmationURL }}') + small('This link works once and expires soon.') + ignore,
  },
  {
    file: 'auth-confirm-signup.html', group: 'supabase', where: 'Confirm signup', subject: 'Confirm your email for 3kee',
    preheader: 'One click to confirm your email address.',
    body: label('Welcome') + heading('Confirm your email.') + para('Thank you for joining 3kee. Confirm your email address to finish creating your account.') + button('Confirm email', '{{ .ConfirmationURL }}') + ignore,
  },
  {
    file: 'auth-invite.html', group: 'supabase', where: 'Invite user', subject: 'You’re invited to 3kee',
    preheader: 'Accept your invitation and set your password.',
    body: label('Invitation') + heading('You’re invited.') + para('You have been invited to a 3kee account. Accept the invitation to choose your password.') + button('Accept invitation', '{{ .ConfirmationURL }}') + ignore,
  },
  {
    file: 'auth-change-email.html', group: 'supabase', where: 'Change Email Address', subject: 'Confirm your new email for 3kee',
    preheader: 'Confirm the change of your account email.',
    body: label('Account') + heading('Confirm your new email.') + para('You asked to change your 3kee account email from <strong style="color:#F2EFE9">{{ .Email }}</strong> to <strong style="color:#F2EFE9">{{ .NewEmail }}</strong>.') + button('Confirm new email', '{{ .ConfirmationURL }}') + ignore,
  },
  {
    file: 'auth-reauthentication.html', group: 'supabase', where: 'Reauthentication', subject: 'Your 3kee verification code',
    preheader: 'Your code to confirm a sensitive change.',
    body: label('Security') + heading('Confirm it’s you.') + para('Enter this code to confirm the change to your 3kee account.') + code('{{ .Token }}') + ignore,
  },
  {
    file: 'auth-password-changed.html', group: 'supabase', where: 'Security notification: Password changed (if your dashboard offers it)', subject: 'Your 3kee password was changed',
    preheader: 'A quick security notice about your account.',
    body: label('Security') + heading('Your password was changed.') + para('The password for your 3kee account <strong style="color:#F2EFE9">{{ .Email }}</strong> was just changed.') + para('If this was you, there is nothing else to do. If it wasn’t, sign in with Google on 3kee.site and choose a new password right away, then tell us at ' + CONTACT + '.') + button('Go to 3kee', SITE),
  },
  {
    file: 'auth-email-changed.html', group: 'supabase', where: 'Security notification: Email address changed (if your dashboard offers it)', subject: 'Your 3kee email was changed',
    preheader: 'A quick security notice about your account.',
    body: label('Security') + heading('Your email was changed.') + para('The email address on your 3kee account was changed from <strong style="color:#F2EFE9">{{ .OldEmail }}</strong> to <strong style="color:#F2EFE9">{{ .Email }}</strong>.') + para('If this wasn’t you, write to ' + CONTACT + ' right away.'),
  },
  {
    file: 'welcome.html', group: 'app', where: 'After the client finishes creating an account', subject: 'Welcome to 3kee',
    preheader: 'Your chair is waiting.',
    body: label('Welcome') + heading('Welcome, {{first_name}}.') + para('Your 3kee account is ready. One client, one chair, no rush: choose your cut, add the extras you like and pick your hour.') + button('Book your chair', SITE) + small('You can sign in with your email and password, or with Google.'),
  },
  {
    file: 'booking-received.html', group: 'app', where: 'When a client sends a booking request', subject: 'We received your request',
    preheader: 'Your appointment is under review.',
    body: label('Appointment request') + heading('Under review.') + para('Thank you, {{first_name}}. Your request is under review and we usually reply within 10 minutes.') + details([['Service', '{{service}}'], ['Extras', '{{extras}}'], ['Date', '{{date}}'], ['Time', '{{time}}'], ['Duration', '{{duration}}'], ['Total', '{{total}}']]) + small('This is not a confirmation yet. You will receive a second email once your appointment is confirmed.'),
  },
  {
    file: 'booking-confirmed.html', group: 'app', where: 'When the barber confirms the appointment', subject: 'Your 3kee appointment is confirmed',
    preheader: '{{date}} at {{time}}. The chair is yours.',
    body: label('Confirmed') + heading('The chair is yours.') + para('{{first_name}}, your appointment is confirmed.') + details([['Service', '{{service}}'], ['Extras', '{{extras}}'], ['Date', '{{date}}'], ['Time', '{{time}}'], ['Total', '{{total}}']]) + para('The studio’s exact location is shared with confirmed clients only.') + button('Open the location', '{{location_url}}') + small('Need to change or cancel? Reply to this email as early as you can.'),
  },
  {
    file: 'booking-reminder.html', group: 'app', where: 'Morning of the appointment day', subject: 'Today at 3kee: {{time}}',
    preheader: 'Your appointment is today at {{time}}.',
    body: label('Today') + heading('See you at {{time}}.') + para('Good morning, {{first_name}}. A reminder of your appointment today.') + details([['Service', '{{service}}'], ['Time', '{{time}}'], ['Total', '{{total}}']]) + button('Open the location', '{{location_url}}') + small('Running late or can’t make it? Reply to this email so the slot can be offered to someone else.'),
  },
  {
    file: 'booking-changed.html', group: 'app', where: 'When an appointment is moved', subject: 'Your 3kee appointment has moved',
    preheader: 'New time: {{date}} at {{time}}.',
    body: label('Updated') + heading('Your appointment has moved.') + para('{{first_name}}, here are your new details.') + details([['Service', '{{service}}'], ['New date', '{{date}}'], ['New time', '{{time}}'], ['Total', '{{total}}']]) + small('If the new time doesn’t work for you, reply to this email.'),
  },
  {
    file: 'booking-cancelled.html', group: 'app', where: 'When an appointment is cancelled', subject: 'Your 3kee appointment was cancelled',
    preheader: 'Your appointment on {{date}} was cancelled.',
    body: label('Cancelled') + heading('Appointment cancelled.') + para('{{first_name}}, your appointment on {{date}} at {{time}} has been cancelled.') + para('We hope to see you in the chair soon.') + button('Book another time', SITE),
  },
  {
    file: 'review-request.html', group: 'app', where: 'The day after a visit', subject: 'How was your cut?',
    preheader: 'Two minutes to tell us about your visit.',
    body: label('After your visit') + heading('How was your cut?') + para('Thank you for coming in, {{first_name}}. Your review helps other clients choose their chair. Reviews appear on the website only after they are approved.') + button('Leave a review', '{{review_url}}'),
  },
]

mkdirSync(OUT, { recursive: true })
for (const t of TEMPLATES) writeFileSync(join(OUT, t.file), layout({ title: t.subject, preheader: t.preheader, body: t.body }))

const rows = TEMPLATES.map(t => `<tr><td>${t.group === 'supabase' ? 'Supabase' : 'Website'}</td><td>${t.where}</td><td>${t.subject}</td><td><a href="${t.file}">${t.file}</a></td></tr>`).join('\n')
writeFileSync(join(OUT, 'index.html'), `<!doctype html><meta charset="utf-8"><title>3kee email templates</title>
<body style="font:15px/1.5 ${SANS};margin:32px;background:#f4f4f4"><h1>3kee email templates</h1>
<table cellpadding="8" border="1" style="border-collapse:collapse;background:#fff"><tr><th>Sent by</th><th>When / Supabase template</th><th>Subject</th><th>File</th></tr>
${rows}</table>
${TEMPLATES.map(t => `<h2 id="${t.file}">${t.subject}</h2><iframe src="${t.file}" style="width:640px;height:760px;border:1px solid #ccc;background:#0B0B0B"></iframe>`).join('\n')}
</body>`)
console.log(`Built ${TEMPLATES.length} templates in ${OUT}`)
