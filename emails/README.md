# 3kee email templates

All emails share one layout (black background, 3kee logo, gold rule, bone button, footer with website, Instagram, privacy and `contact@3kee.site`). Edit `build.mjs`, then run `node emails/build.mjs` to regenerate `dist/`. Open `dist/index.html` in a browser to preview every template. The logo image is `app/public/email/3kee-logo.png`, served at `https://3kee.site/email/3kee-logo.png`; it must stay on the website or the emails show no logo.

The brand name in every email is **3kee** only.

## 1. Account emails: paste into Supabase (done by hand)

Supabase sends these. In the Supabase dashboard open **Authentication → Emails → Templates**, pick the template, set the subject, switch the editor to source/HTML, replace everything with the file's contents, and save. They use Supabase's `{{ .Variable }}` placeholders; keep them exactly as written.

| Supabase template | Subject | File |
|---|---|---|
| Magic Link (this is the "Email me a code" email: it must contain `{{ .Token }}`) | Your 3kee code | `dist/auth-code.html` |
| Reset Password (owner "Forgot your password?" link) | Reset your 3kee password | `dist/auth-reset-password.html` |
| Confirm signup | Confirm your email for 3kee | `dist/auth-confirm-signup.html` |
| Invite user | You’re invited to 3kee | `dist/auth-invite.html` |
| Change Email Address | Confirm your new email for 3kee | `dist/auth-change-email.html` |
| Reauthentication | Your 3kee verification code | `dist/auth-reauthentication.html` |
| Security notification: Password changed (only if the dashboard offers notifications) | Your 3kee password was changed | `dist/auth-password-changed.html` |
| Security notification: Email address changed (same) | Your 3kee email was changed | `dist/auth-email-changed.html` |

The two security notifications use `{{ .Email }}` / `{{ .OldEmail }}`; check the variable list Supabase shows beside that editor and adjust if its names differ.

Sender settings (Authentication → **SMTP Settings**): sender name **3kee**, sender email a Gmail "Send mail as"-verified address such as `contact@3kee.site`, host `smtp.gmail.com`, port 465, username = that Gmail address, password = a Gmail App Password typed in by the owner (never stored in this repository).

## 2. Website emails: sent by the site once bookings are stored (not active yet)

Bookings are not saved online yet, so nothing sends these today. When the booking backend is built, a Supabase Edge Function (or similar) fills the `{{snake_case}}` placeholders and sends them through the same SMTP account.

| When | Subject | File | Placeholders |
|---|---|---|---|
| Client finishes creating an account | Welcome to 3kee | `dist/welcome.html` | `first_name` |
| Client sends a booking request | We received your request | `dist/booking-received.html` | `first_name, service, extras, date, time, duration, total` |
| Barber confirms | Your 3kee appointment is confirmed | `dist/booking-confirmed.html` | `first_name, service, extras, date, time, total, location_url` |
| Morning of the appointment day | Today at 3kee: `time` | `dist/booking-reminder.html` | `first_name, service, time, total, location_url` |
| Appointment moved | Your 3kee appointment has moved | `dist/booking-changed.html` | `first_name, service, date, time, total` |
| Appointment cancelled | Your 3kee appointment was cancelled | `dist/booking-cancelled.html` | `first_name, date, time` |
| Day after a visit | How was your cut? | `dist/review-request.html` | `first_name, review_url` |

Rules carried over from the project: the exact studio location appears only in the confirmed and reminder emails (`location_url`), never before confirmation; the appointment-day morning reminder is required; reviews appear on the site only after approval. Placeholder values must be HTML-escaped by the sender.
