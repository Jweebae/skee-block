# 3kee email templates

All emails share one layout (black background, 3kee logo, gold rule, bone button, footer with website, Instagram, privacy and `contact@3kee.site`). Edit `build.mjs`, then run `node emails/build.mjs` to regenerate `html/`. Open `html/index.html` in a browser to preview every template. The logo image is `app/public/email/3kee-logo.png`, served at `https://3kee.site/email/3kee-logo.png`; it must stay on the website or the emails show no logo.

The brand name in every email is **3kee** only.

## 1. Account emails: paste into Supabase (done by hand)

Supabase sends these. In the Supabase dashboard open **Authentication → Emails → Templates**, pick the template, set the subject, switch the editor to source/HTML, replace everything with the file's contents, and save. They use Supabase's `{{ .Variable }}` placeholders; keep them exactly as written.

| Supabase template | Subject | File |
|---|---|---|
| Magic Link (this is the "Email me a code" email: it must contain `{{ .Token }}`) | Your 3kee code | `html/auth-code.html` |
| Reset Password (owner "Forgot your password?" link) | Reset your 3kee password | `html/auth-reset-password.html` |
| Confirm signup | Confirm your email for 3kee | `html/auth-confirm-signup.html` |
| Invite user | You’re invited to 3kee | `html/auth-invite.html` |
| Change Email Address | Confirm your new email for 3kee | `html/auth-change-email.html` |
| Reauthentication | Your 3kee verification code | `html/auth-reauthentication.html` |
| Security notification: Password changed (only if the dashboard offers notifications) | Your 3kee password was changed | `html/auth-password-changed.html` |
| Security notification: Email address changed (same) | Your 3kee email was changed | `html/auth-email-changed.html` |

The two security notifications use `{{ .Email }}` / `{{ .OldEmail }}`; check the variable list Supabase shows beside that editor and adjust if its names differ.

Sender settings (Authentication → **SMTP Settings**): custom SMTP is enabled through the verified 3kee Resend domain. Use sender name **3kee**, sender email `contact@3kee.site`, host `smtp.resend.com`, port 465, username `resend`, and a Resend API key with **sending access only**, restricted to `3kee.site`. The key belongs only in Supabase's encrypted SMTP password field; never store it in this repository or project notes.

## 2. Website and booking emails: sent through Resend

`build.mjs` also publishes these files at `app/public/email/templates/` (live at `https://3kee.site/email/templates/<name>.html`). The Edge Functions fetch them, use the `<title>` as the subject, fill the `{{snake_case}}` placeholders and send through Resend from `3kee <contact@3kee.site>`.

- `supabase/functions/send-email` sends **welcome** once per completed client account and only to the signed-in user's own address.
- `supabase/functions/bookings` sends the request, owner-alert, confirmation, decline, cancellation and moved-appointment messages from server-validated booking actions.
- The morning reminder and next-day review request are prepared but still need the scheduled-message phase before they send automatically.

| When | Subject | File | Placeholders |
|---|---|---|---|
| Client finishes creating an account | Welcome to 3kee | `html/welcome.html` | `first_name` |
| Client sends a booking request | We received your request | `html/booking-received.html` | `first_name, code, service, extras, date, time, duration, total` |
| Client sends a booking request (owner alert) | New request `code`: `date` at `time` | `html/owner-new-request.html` | `code, client_name, service, extras, date, time, duration, total, phone, notes, admin_url` |
| Barber confirms | Your 3kee appointment is confirmed | `html/booking-confirmed.html` | `first_name, code, service, extras, date, time, total, location_url` |
| Barber declines | We couldn’t take this time | `html/booking-declined.html` | `first_name, date, time` |
| Morning of the appointment day | Today at 3kee: `time` | `html/booking-reminder.html` | `first_name, service, time, total, location_url` |
| Appointment moved | Your 3kee appointment has moved | `html/booking-changed.html` | `first_name, service, date, time, total` |
| Appointment cancelled | Your 3kee appointment was cancelled | `html/booking-cancelled.html` | `first_name, date, time` |
| Client cancels (owner alert) | Cancelled `code`: `date` at `time` | `html/owner-cancelled.html` | `code, client_name, service, date, time, phone, admin_url` |
| Day after a visit | How was your cut? | `html/review-request.html` | `first_name, review_url` |

Rules carried over from the project: the exact studio location appears only in the confirmed and reminder emails (`location_url`), never before confirmation; the appointment-day morning reminder is required; reviews appear on the site only after approval. Placeholder values must be HTML-escaped by the sender.
