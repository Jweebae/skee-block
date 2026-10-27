# Skee Barber Shop Project Memory

## Verified workspace

Project root confirmed on the Desktop:

- /Users/mac/Desktop/skee barber shop 

Verified directory structure:

- Website directory: /Users/mac/Desktop/skee barber shop /website project
- Visual Identity directory: /Users/mac/Desktop/skee barber shop /visual identity

The website project is the active development workspace. The visual identity folder is the approved design source of truth. The literal root folder name ends with a space; do not silently remove it from paths.

- Preserved Copilot conversation: `chat.json` at the workspace root (25 requests).
- `website project/brand/visual identity` duplicates the approved root assets; copies were byte-identical at recovery.
- Root-level `skee-block-app` is an incomplete leftover starter, not the active app. Leave it alone.
- Repository root: `website project`, remote `Jweebae/skee-block`. GitHub Pages deploys `main` to `https://3kee.site/`; see the 2026-10-23 milestones below.

## Project purpose

Skee Barber Shop is a premium barber brand and booking platform for Skee Block. The product is meant to combine a luxury public-facing brand experience with a usable booking workflow, client records, admin operations, and business conversion through WhatsApp and local business workflows.

The product direction is a full SaaS-style barber management system, not just a simple marketing page.

## Business requirements and confirmed decisions

- Brand name: Skee Block
- Public-facing barber identity: Skee
- Private/admin identity: Said
- Location: Msila, Algeria
- Instagram: https://www.instagram.com/skeeondablock/
- Luxury black, white, and restrained gold design language
- Premium editorial aesthetic with strong typography and dark luxury mood
- Booking workflow with visible service selection and pricing before confirmation
- Admin scheduling and multi-barber availability management
- Client database and booking history tracking
- Review moderation before publication
- Hidden location and map details until appointment confirmation
- Direct conversion through WhatsApp Business
- Reminder automation and cancellation handling with slot reopening approval
- Zero-budget starting requirement: GitHub hosting and Supabase free tier were explicitly requested; paid services require a new decision.
- Exact reproduction of the approved Claude design, not a reinterpretation (repeated explicitly in the previous conversation).
- Arabic version with RTL layout, preserving the approved visual identity; Arabic typography selection remains open.
- Clients can register/log in and retain completed, canceled and missed/ignored appointments. Clients may delete history entries but cannot modify them; admin can manage them. Exact deletion semantics remain undecided.
- Client notes and preferences must be supported; whether these can be added/changed after confirmation remains undecided.
- Admin can add, duplicate, delete, show/hide services and edit cut names, preferences/options, and durations. All base cuts have a fixed price of 800 DA; only selected add-on types increase the total. This confirmed rule supersedes the varied reference prices. Admin can add/edit/delete add-on groups and their types; every type has its own editable name, description, price, extra duration and visibility. Clients first choose an add-on, then exactly one of its available types. Protein hair treatment comes first, followed by editable Gommage samples. Do not introduce different base-cut prices.
- Admin manages each barber’s working hours and availability as more barbers join.
- Admin keeps client records and manages promotions/discounts.
- A reminder at the start of appointment day is explicitly required; the rest of the reminder schedule is not finalized.
- Cancellation alerts the barber/admin; notifying nearby/upcoming clients about the opening requires barber/admin approval.
- Rich interactions and refined motion, mobile-first usability, and step-by-step development were requested.

## Visual identity and approved resources

The Visual Identity directory contains the approved assets and source-of-truth references:

- Skee Block — Brand & Booking Platform.html
- Skee Block — Brand & Booking Platform.pdf
- Skee Block — Brand & Booking Platform-png.zip
- skee-logo-black.svg
- skee-logo-white.svg
- White 3KEE Graffiti Logo.png
- 3KEE Graffiti Tag on Black.png

These assets are treated as the approved brand reference for future design work. Reproduce them faithfully unless the user explicitly approves a change.

### Recovered design specifications

- Seven boards: Brand System; Homepage — Desktop; Booking Flow (interactive); Mobile Concept; Client Account & History; Admin Dashboard (Said); WhatsApp, Reviews & Reminders.
- Bodoni Moda for editorial headings (italic emphasis); Inter Tight for body/UI. Both are now served locally from the fonts embedded in the approved export, with the supplied OFL notices retained in `app/src/assets/fonts/LICENSE.txt`.
- Palette: Ink #0B0B0B, Onyx #131313, Graphite #1C1C1C, Smoke #8E8B85, Bone #F2EFE9, Gilt #C9A96A; hairlines #262626. Gold should occupy at most roughly 3% of the design.
- Sharp 2px corners, bone primary buttons, thin borders, broad spacing; no rounded gold-gradient redesign.
- Brand guideline: 12-column desktop grid / 4-column mobile grid, 20px phone gutters. Preserve the actual homepage export’s 1280px wrapper and clamp-based spacing for fidelity.
- Supplied logo is unchanged: white on dark, black on bone. Do not redraw, stretch, recolor gold, outline or shadow it.
- Mobile home uses the compact logo/menu header, 56px editorial hero, portrait placeholder and fixed bottom Book/WhatsApp actions.
- Motion uses cubic-bezier(.2,.7,.1,1), gentle reveals and hover movement; honor reduced motion.
- Suggested Arabic pairing in the reference: Noto Naskh Arabic + IBM Plex Sans Arabic. This is a reference suggestion, not a finalized implementation decision.

## Current website implementation

Website application path:

- /Users/mac/Desktop/skee barber shop /website project/app

Current repo state confirmed by the actual files:

- React + Vite project
- package.json includes React 19, React DOM, Vite 8, and oxlint
- Homepage is ported from the approved desktop HTML export and adapted to the approved mobile home concept. A four-step booking preview, Supabase owner access/shared studio settings, and client account screens now exist; real booking workflows remain pending.
- Current source file: app/src/App.jsx
- Styling is custom CSS currently in app/src/App.css and app/src/index.css
- Logo asset is imported from app/src/assets/skee-logo-white.svg, byte-identical to the approved white SVG. Original black SVG remains available.

### Already implemented — homepage milestone, 2026-10-22

- Original approved homepage content/layout and styles ported into React, without the Claude runtime or new npm dependencies.
- Header with approved logo/Block lockup, navigation, sign-in and booking controls.
- Editorial “The chair is yours for the hour” hero, portrait placeholder, desktop facts and animated service ticker.
- Six reference service cards retain sample names/durations; every base service now displays the user-confirmed 800 DA price. Only add-ons raise the bill. Combo descriptions clarify that extras are separately charged.
- Story section and four staggered gallery tiles, linked to the confirmed Instagram account. All four tiles show user-approved, background-cleaned client photos (see Gallery photos milestone).
- Three clearly bracketed review placeholders; no invented real testimonials, business statistics or ratings.
- Bone WhatsApp contact band; private studio Visit section with a decorative locked map. No real coordinates/address are included in the public app.
- Approved footer, desktop floating contact control, mobile menu and fixed bottom booking/WhatsApp controls with safe-area support.
- Local fonts and unchanged approved white logo; title, description and theme color updated.
- Keyboard focus styles, skip link, main landmark, labeled native dialog, Escape dismissal, and reduced-motion support.
- Booking controls now open the four-step booking interface; homepage service cards preserve the selected service. Account/review/WhatsApp controls still open explanatory dialogs with the confirmed Instagram contact link. None creates real bookings, authenticates users or sends messages.

### Not implemented yet

- Real booking database
- Authentication and client account system
- Secure owner authentication and production admin access; local studio settings editor exists
- Real availability logic
- Review moderation backend
- Promotion/discount admin settings
- Reminder automation
- Booking cancellation logic with reopened slots
- Supabase integration beyond owner access and studio settings (bookings, client profiles, reviews, reminders). Owner accounts were added by Claude; see the later owner milestones. Recheck current database state through an authorized connector before changing roles.
- Arabic translation, RTL layouts and finalized Arabic fonts
- Portrait/hero photo, approved review data, business hours, add-on prices and verified WhatsApp number

## Technology stack

- Frontend: React + Vite
- Styling: custom CSS and premium design system approach
- Database/auth: separate Skee Block organization and `skee-block` project, ref `jfojdzzafbosqneervtn`; owner access, shared settings and client auth integrated.
- Hosting: GitHub Pages at `https://3kee.site/`, deployed from `Jweebae/skee-block`.
- Messaging: WhatsApp Business for conversion
- Email: free or low-cost automation options considered
- Review workflow: admin approval model considered

## Current development milestone

As of 2026-10-23, the existing homepage and four-step booking preview are published on GitHub Pages. Owner sign-in, shared studio settings, and client account screens are implemented. Cuts stay at 800 DA; admin-editable add-on types, preferences, durations and hours retain sample values until changed by an owner. Reservations, client profile records, history and reminders are still pending. Detailed milestones below distinguish actual checks from remaining tests.

### Historical verification at the homepage milestone (2026-10-22)

- `npm run build` and `npm run lint` pass.
- Chrome browser QA: desktop 1440px and mobile 390×844 screenshots inspected; embedded Bodoni Moda regular/italic and Inter Tight fonts load locally; all six services render; no runtime errors observed.
- No document horizontal overflow at widths 320, 375, 390, 760, 768, 1024 and 1280px.
- Mobile menu opens, section navigation closes it, booking preview dialog opens and Escape dismisses it.
- Approved branding source files were not modified. No backend or communication delivery was tested because none is connected.
- Preview is started from `website project/app` using `npm run dev -- --host 127.0.0.1`; the port is assigned by Vite. Do not assume a previous 5173 tab points to this app.

## Important decisions and constraints

- Keep redesign work aligned with the approved visual identity.
- Do not assume the latest conversation is the only source of truth.
- Prefer the actual repository state over memory when they differ.
- Never store credentials, secrets, tokens, or private data in project files.
- Do not modify unrelated files or add features without clear direction.

## Pending priorities

1. Preserve and maintain accurate memory across sessions.
2. Keep the live website aligned with the approved visual identity.
3. Shared sample settings were restored and public API loading verified on 2026-10-24. Keep samples editable; authenticated owner edits should be checked during the next owner session.
4. Follow the recorded next feature order: privacy notice, then client profiles.
5. Add real booking requests, owner approval, conflict-safe reservations and business automation.

## Known limitations and unresolved issues

- The app has a homepage and interactive booking UI preview, not a production SaaS booking system.
- Desktop visual styles are directly ported; phone layout uses the approved mobile home board. The mobile concept does not specify every lower-page section, so those use a responsive adaptation of the desktop design. Final user visual review remains pending.
- Supabase owner access, settings and client auth are connected in the app; actual booking persistence is not.
- ChatGPT’s Supabase access was restored on 2026-10-23. The invalid empty shared test payload was replaced with the validated existing samples on 2026-10-24; public API reading is verified.
- The project still requires implementation of the actual end-to-end barber workflow.

## Exact next recommended development step

Add the privacy notice for the current account/sign-in data flows, then client profiles. Shared sample settings are now restored and publicly readable; keep the existing approved branding and sample details. Continue later with real booking requests, owner approval, conflict-safe reservations and server-authoritative pricing. Keep private location behind real confirmation. Authenticated owner editing remains to be checked in a real owner session without requesting passwords in chat.

## Open business inputs and reference conflicts

- Real WhatsApp Business number is missing. Placeholder wa.me links were removed rather than connected to a dummy number; contact controls currently explain this and offer the confirmed Instagram link. Floating “Skee is online” wording was changed to “WhatsApp Skee” because live status is not connected.
- In the reference review placeholder, the private admin name was replaced with neutral approval wording to respect the confirmed public/private identity rule.
- The approved homepage’s Instagram placeholder was replaced with the user-confirmed `@skeeondablock` account.
- The hero portrait, brand story, working hours, service names/durations and reviews contain reference placeholders; all four gallery photos are now approved and present. Base-cut pricing is confirmed at 800 DA; add-on prices remain editable samples. Do not present those as verified operating facts. Booking/account/WhatsApp copy describes intended future behavior, not delivered automation.
- User requires exact location available after appointment confirmation. Some reference message templates instead delay its first release until two hours before. Follow the user’s rule; a later reminder may repeat it. Keep exact location out of public assets and memory.
- User explicitly requires an appointment-day morning reminder, absent from some reference timelines. Include it when planning reminders; other timing, quiet hours and delivery providers need resolution.
- Arabic site requested; reference includes Arabic/French/English communication concepts. French website support and paid WhatsApp/SMS delivery were not explicitly finalized.
- Reference WhatsApp OTP, cancellation cutoff, rescheduling, Edahabia/card payment, Ramadan schedules and other sample dashboard behavior are design concepts, not automatically approved production rules. Resolve conflicts with the history no-edit requirement and zero-budget constraint before implementation.
- No production hosting URL, Git remote, deployment pipeline, backend project, service keys, real availability or sent reminder evidence has been established.

## Approved refinement — 2026-10-22

- User first requested the hero gradient and faint 3KEE mark from the portrait box, then extended this to a fixed back layer revealed while scrolling through only the hero/header area and “02 — The Block”. Implemented as one decorative, pointer-inert viewport-fixed backdrop using the unchanged approved white SVG at 7% opacity. Hero/story foreground content stays above it; ticker, services, reviews, contact, Visit and footer have opaque surfaces. Existing fonts, content, spacing and portrait box are preserved; desktop/mobile supported.
- All base cuts are fixed at 800 DA. Only optional add-ons increase the total; no add-on prices have been supplied. Homepage cards and pricing note now reflect this. A client-side preview now calculates 800 DA plus selected sample add-ons; real booking persistence and authoritative server-side pricing remain pending.
- Admin cut names, preferences/options and durations were initially documented as requirements; they are now editable in the local admin panel (see admin milestone). Secure production admin access is still pending.

## Booking UI milestone — 2026-10-22

User asked for the next development step after the homepage refinements.

### Implemented

- `app/src/booking/BookingFlow.jsx` and `BookingFlow.css`: full-screen native dialog with four steps matching the approved booking design: service → optional add-ons → date/time → review/notes.
- `app/src/booking/catalog.js`: shared 800 DA base constant, reference service catalog/durations, explicitly labeled sample add-ons, and preview dates based on Africa/Algiers calendar dates.
- Every homepage booking control opens the flow; each service card passes its ID so that service is already selected. Generic booking buttons start without a selection.
- Single-service selection, optional add-on toggles, live total and duration, sticky desktop summary, phone bottom controls, date rail and grouped time choices.
- Sample add-on values copied from the approved reference solely to demonstrate interaction: wash/scalp massage 400 DA +10 min; black mask facial 500 DA +15 min; brow detail 300 DA +5 min; hair design 300 DA +10 min. These are NOT approved production prices or durations.
- No add-ons selected by default. All cuts retain the confirmed fixed 800 DA base. Add-ons can be selected or removed and alone increase the total.
- Next two weeks of dates, starting tomorrow in Algeria. Initially used fixed illustrative slots; now generated from saved weekly hours, breaks and total duration. Arbitrary “taken” samples have been removed; real appointments are not queried.
- Date/time required before review. Changing the cut or extras clears the date/time because duration may change; changing the date clears the time.
- Optional notes (1000 characters maximum) and WhatsApp/email reminder preference survive back/edit navigation within the open flow. No private draft data is persisted or sent.
- Step navigation, back/edit/restart controls, keyboard-native radio/checkbox inputs, focus handling, native modal focus containment and Escape dismissal, background scroll locking/restoration.
- Final action says “Finish preview”; completion now uses the user-approved pending-review wording below. No fake booking code, sent message, payment or location unlock. Instagram remains available for arranging an actual visit.
- Closing the flow discards its in-memory draft. Refreshing also clears it. No dependencies or backend configuration added.
- Homepage fixed background remains limited to the hero and The Block; the booking screen uses its own opaque ink surface.

### Validation

- `npm run build` and `npm run lint` pass.
- Chrome end-to-end preview check passed: service-specific entry, no-service blocking, add-on pricing/duration and removal, date/time gating, disabled samples, schedule reset after extras change, retained notes/channel, honest final preview, editing, Escape dismissal and body scroll restoration.
- Desktop 1440px and mobile 390×844 screenshots inspected, including mobile date/time and fixed controls. No horizontal overflow at 320, 375, 390, 760, 768, 1024 and 1440px; no browser runtime errors observed.

### Still pending

- Production shared storage/authentication for the now-editable local service, preference, duration and add-on settings.
- Existing appointment conflicts, inter-client buffers, exceptions/holidays, atomic reservation handling and server-authoritative totals. Local weekly-hour/break and duration-based generation is implemented.
- Client authentication/contact details, persistence, actual booking confirmation and protected location access.
- Real reminder delivery, cancellation/reopening approval, promotions and production admin tools.
- Promo codes and simulated WhatsApp authentication from the reference were deliberately not activated as real business rules.

## Admin settings milestone — 2026-10-22

User explicitly approved retaining all sample details and requested admin editing of cuts, preferences, durations, add-on prices and working hours, step by step. Do not block future development waiting for finalized business values.

### Implemented

- `app/src/admin/AdminPanel.jsx` and `AdminPanel.css`: studio settings interface based on the approved admin board’s dark layout, editorial typography, sidebar and private Said identity. Sections: Cuts & preferences; Add-ons; Working hours.
- Entry: footer “Studio admin” link or `http://127.0.0.1:<vite-port>/#admin`. Customer sign-in remains a separate, unfinished feature.
- Cuts: editable name, category, description, duration, preferences (one option per line), website visibility; add a new cut. The following milestone adds duplication and deletion. Base price is locked at 800 DA and is not an admin-editable field.
- Add-ons initially had a flat price/duration. The following milestone replaces this with editable groups and nested types, each with its own price/duration. Prices may be zero; nonnegative whole DA amounts are required.
- Hours: each weekday can open/close; editable opening/closing times and optional paired break times. Sample defaults are Sat–Thu 10:00–20:00, break 13:00–14:00, Friday closed. These remain sample operating details.
- Settings module: `app/src/settings/studioSettings.js`; React hook: `useStudioSettings.js`. Versioned browser storage key `skee.studio-settings.v1`. Only non-sensitive business configuration is saved, no client notes or credentials.
- Save all changes validates the full draft before storing it and updating shared React state. Navigating admin tabs preserves the unsaved draft. Discard restores last saved state; website exit links prompt before abandoning edits; browser reload/close has a native unsaved-change guard.
- Successful saves apply to the current browser’s homepage and booking flow and survive reload. Failed saves keep the draft and do not apply it. Unsupported/corrupt local settings fall back to samples with a visible admin warning; they are not silently overwritten.
- Homepage cards now render the shared visible service catalog instead of independent hardcoded copies. Saved names, durations, categories and descriptions appear on the site. Visit includes expandable weekly hours; hero/Visit hour summaries and Friday status reflect saved settings.
- Booking uses the same visible services/add-ons. Admin-defined preferences appear as included, optional choices at review; they never add a charge. Selected preferences appear in the completed-preview summary.
- Preview times are generated every 15 minutes from opening time, must fit the full cut + extras duration before closing, and cannot overlap the break. Closed days and days with no fitting times are disabled. Real appointments/conflicts are not represented.
- All service prices remain 800 DA; totals include only chosen add-ons. No paid dependencies, backend project, production authentication or real reservation delivery added.

### Verified

- Build and lint pass.
- Browser end-to-end checks pass for editing cut name/duration/preferences, hiding cuts, changing add-on price/duration, saving weekday hours/breaks, reload persistence, homepage and booking synchronization, fixed base price, preference inclusion without a fee, and schedule constraints.
- Invalid closing-before-opening times are rejected; discard restores saved data. New cuts and unsaved-exit confirmation work.
- Browser storage failure preserves the draft and prevents a false save; malformed storage recovers sample settings with a warning.
- Desktop 1440px and mobile 390×844 admin screenshots inspected. No document horizontal overflow at 320, 375, 390, 760, 768, 1024 and 1440px; no runtime errors observed in the main flow.

### Explicit limitations

- This is a local admin preview, clearly labeled. No authentication/access control is implemented, and browser storage is not shared across devices or users. It must not be presented as a secured production admin panel.
- The current page updates immediately after saving in its admin view; other already-open tabs need reloading to read those settings. No live cross-tab synchronization is implemented.
- Single barber (Skee) only at this stage; multi-barber schedules remain a confirmed later requirement.
- No overnight hours, blocked dates, seasonal schedules, appointment-conflict checking or booking buffers yet.
- Browser Back or manual hash changes are not covered by the custom draft-exit dialog; supplied website links and reload/close are guarded.
- Samples remain in the source and are the default on a fresh browser. Test edits were made in temporary browser profiles and did not alter the user’s saved values.

## Add-on types and card management milestone — 2026-10-22

User requested adding/duplicating/deleting existing cut cards, full add-on management, and a second choice of type immediately after a client selects an add-on. Protein hair treatment is the first add-on; Gommage is also editable. Sample details remain authorized until the admin supplies final values.

### Implemented

- Cut cards: New cut, Duplicate cut, Delete cut. Copies receive independent IDs and retain the source preferences/details; every cut remains 800 DA.
- Add-on cards: New add-on, Duplicate add-on, Delete add-on, plus editable name, description and visibility. Duplicate groups copy their types with independent IDs.
- Nested type editor in `app/src/admin/AddonEditor.jsx`: New type, editable name/description/DA price/extra minutes/visibility, and Delete type. No separate parent add-on fee is charged.
- Delete dialogs identify the item (and all types when removing a group). Deletions affect the draft first; Save all changes persists them, and Discard changes restores the last saved state. Canceling a delete keeps the item. Empty menus and groups are supported; a group with no available types is omitted from booking with an explanatory admin message.
- Starting samples: Protein hair treatment with Classic protein (2000 DA / +45 min) and Premium protein (3000 DA / +60 min); Gommage with Face gommage (500 DA / +15 min) and Scalp gommage (700 DA / +20 min). These are illustrative, editable values, not confirmed treatments, product brands, prices or durations.
- The four previous sample extras remain, each with an editable Standard type carrying its previous price, description and duration.
- Client add-ons step: choosing a group immediately reveals its available type radio choices underneath. No type is automatically selected. Clients must choose one type per selected group or uncheck the group before continuing. Several different add-ons may be chosen together.
- Total = 800 DA + the price of each chosen type. Duration = cut duration + the extra time of each chosen type. Switching a type replaces its charge/time; removing a group removes its charge/time and clears its type choice. Any such change clears the selected date/time. Review/completion summaries name both the add-on and chosen type.
- Settings payload is now version 2, retaining storage key `skee.studio-settings.v1` for compatibility. Version 1 settings migrate on read: every saved flat add-on becomes one Standard type with its old values; cuts, preferences, visibility and hours are retained. Missing protein/Gommage samples are added during that migration. The next save writes version 2; subsequent loads do not recreate deleted groups or types. No real user storage was edited by QA.
- Nested prices, durations, IDs and text are validated; zero-priced/zero-minute types are supported. Limits remain 100 cuts / 100 add-ons, with up to 30 types per group. Failed validation does not replace saved settings.
- Approved fonts, logo, homepage layout and scrolling background remain in place. No dependencies or backend were added.

### Verified

- `npm run build` and `npm run lint` pass.
- Chrome checks cover cut creation/duplication/deletion; cancel/discard behavior; group duplication; type creation/editing/deletion; group deletion; Save all changes and reload persistence; and homepage updates.
- Booking checks cover immediate nested choices, required type selection, one type per group, multiple groups, replacing/removing selections, exact totals/durations, clearing the date/time after changes, and review/completion summaries.
- Existing version 1 settings retain custom names/preferences/prices/durations/visibility/hours. Negative nested prices are rejected, and version 2 deletions do not resurrect samples.
- Edge checks cover zero-price/zero-minute types, hidden types/groups, removal of the last type, deletion of all cuts, empty booking menus, and validation after switching admin tabs.
- Desktop 1440px and mobile 390×844 admin/booking screenshots inspected. No horizontal overflow at 320, 375, 390, 760, 768, 1024 or 1440px, and no runtime errors in the main flow.

### Remaining scope

- Saves still apply only to the current browser. Secure owner login, shared persistence, real reservations, authoritative server pricing and actual availability remain the next production steps.
- Sample protein/Gommage labels and prices should be replaced through the admin panel when the real menu is ready; do not require those details before continuing development.

## Completion wording refinement — 2026-10-22

- User requested the completion status: “Preview complete · No appointment has been approved yet”.
- Completion message: “Your appointment is under review by Skee.” followed immediately on a new line by the exact text “mwalf yripondi fi 10 minutes maximum”. Preserve this spelling and wording.
- This is the requested customer-facing copy for the preview. Real submission, owner review/approval and response-time tracking are not implemented; the existing design-preview notices remain. Layout, fonts, pricing and location protection are unchanged.

## Gallery photos milestone — 2026-10-22

Work started by ChatGPT (Codex), which stopped at its usage limit; resumed by Claude Code. All four photos are live; the user approved the two Higgsfield edits on 2026-10-22.

### What happened

- ChatGPT changed `App.jsx` to import four gallery images from `app/src/assets/gallery/` but the folder was never created, so the Vite dev server showed a "Failed to resolve import ./assets/gallery/curtain-taper.webp" overlay and the whole site was blank.
- Original client photos (HEIC) are at the workspace root; PNG conversions are in `website project/photo-edits/source/`; edit instructions are in `photo-edits/EDIT_PROMPTS.md`.
- ChatGPT had produced only two background-cleaned edits, saved in `/Users/mac/Desktop/skee barber shop /haircuts gallery/`. They are now copied to `photo-edits/enhanced/` as `IMG_2991-enhanced.png` and `IMG_2664-enhanced.png` (1122×1402).

### Current gallery state

All four tiles show approved photos. The user first had the two Higgsfield tiles kept empty, reviewed the candidates, then approved both as generated (2026-10-22). The same approval rule applies to any future photo edit (see AGENTS.md, "Multiple agents").

| Tile (site order) | File in `app/src/assets/gallery/` | Source | Status |
| --- | --- | --- | --- |
| 1 Curtain taper | `curtain-taper.webp` | `photo-edits/enhanced/IMG_4120-enhanced.png` | Live (Higgsfield edit, user-approved) |
| 2 Swept texture | `swept-taper.webp` | `photo-edits/enhanced/IMG_2664-enhanced.png` | Live (ChatGPT edit) |
| 3 Textured taper | `textured-taper.webp` | `photo-edits/enhanced/IMG_2991-enhanced.png` | Live (ChatGPT edit) |
| 4 Curly taper | `curly-taper.webp` | `photo-edits/enhanced/IMG_3665-enhanced.png` | Live (Higgsfield edit, user-approved) |

- WebP spec: 960×1200, quality 88 (raised from 82 on 2026-10-23 to keep the logo edges crisp), encoded with `/Users/mac/.npm-global/bin/ffmpeg` (has libwebp; macOS `sips` cannot write WebP; no cwebp/ImageMagick/Pillow).
- Watermark (user request, 2026-10-23): every gallery WebP has the Skee logo baked into the bottom-right corner, solid WHITE (changed from black the same day: the user asked for black first, then reported the logo "still doesn't show" because black disappears into the near-black corners; white-on-dark is also the approved brand usage), 165 px wide at 960 px (17.2%), 19 px from the right edge and 24 px from the bottom, identical on all four. The size and spot were set by a white box the user drew on a photo (165×113 px at 960×1200, 19 px from the right, 17 px from the bottom); the logo is fitted inside that box and centred vertically. This replaced an earlier smaller mark (108 px wide) the same day. It is cut from the approved `visual identity/White 3KEE Graffiti Logo.png` (artwork box 1310×783 at 245,79), unstretched. It protects the image source, so keep it on any new or replaced gallery photo.
- Rebuild the four WebP files with `photo-edits/make-gallery-webp.sh white` (the live setting; `black` also works; optional second argument is the output dir, default `app/src/assets/gallery/`). It reads the unwatermarked approved PNGs in `photo-edits/enhanced/`, which stay untouched. Do not hand-encode gallery files, or the watermark is lost. If a photo is replaced, update the file mapping in that script.
- Visibility note: the bottom-right corners are nearly black, so a black mark is almost invisible at the size the site shows (about 215–310 px per tile). Keep it white unless the user explicitly asks for black again, and then tell them it will be hard to see.
- No hosting exists yet, so "published" means present in the local app only.

### High-resolution update — 2026-10-23 (supersedes the 960×1200 / quality 88 numbers above)

The user asked for high-resolution images on the site, in the latest version with the logo. `photo-edits/make-gallery-webp.sh` now (default colour white) builds each gallery image at its FULL native resolution, with the logo scaled by the same fractions of the photo (width 165/960, right margin 19/960, bottom margin 24/1200 of the drawn box):

- `app/src/assets/gallery/*.webp`: what the site serves, WebP quality 90. Sizes: curtain and curly 1792×2240 (Higgsfield edits), swept and textured 1122×1402 (ChatGPT edits, which are the lower-resolution ones; they were not upscaled). All are 4:5, so the 960×1200 `width`/`height` attributes in `App.jsx` still give the right aspect ratio.
- `photo-edits/final/*.png`: lossless watermarked masters (about 2.5–7 MB each), committed to GitHub as the high-resolution backup. The clean, unwatermarked originals (`photo-edits/source/`, `photo-edits/enhanced/`) stay on the owner's Mac only and are git-ignored, so the repository holds only logo-marked versions. The script needs `enhanced/` to run, so rebuilding is only possible on this Mac.
- Logo input now comes from `brand/visual identity/White 3KEE Graffiti Logo.png` (byte-identical to the approved original in `../visual identity/`), so the script no longer reaches outside the project folder.
- Option not taken: the two ChatGPT photos could be upscaled (for example with Higgsfield upscale) for more detail; this costs credits and changes approved photos, so it needs the user's approval first.

### Higgsfield edits — approved by the user

- Made by Claude Code on the user's request. Model GPT Image 2.5 (variant flare), quality high, 2k, 4:5 → 1792×2240 PNG. 2.75 credits each (5.5 total; balance 40.4 afterwards). Job IDs: IMG_4120 `06d1aa37-e977-417f-9061-84eb181f06b2`, IMG_3665 `b4852b1b-bf5d-4190-a051-e7d7b59c645f`.
- Prompt: the shared prompt in `photo-edits/EDIT_PROMPTS.md`, plus a series-consistency paragraph and per-photo removal lists (recorded in that file).
- The approved PNGs were moved from `photo-edits/review/` to `photo-edits/enhanced/`. The review comparisons remain in `photo-edits/review/`: `IMG_4120-before-after.jpg`, `IMG_3665-before-after.jpg`, and `gallery-preview.jpg` (all four photos in site order).
- The user approved IMG_4120 as generated; the optional tighter crop was not requested.
- Claude's QA notes: backdrops match the ChatGPT edits (about #131212–#201E1C vs #141414–#222020). IMG_3665 is very faithful. IMG_4120 is the same person and haircut, but fine detail was redrawn: stronger skin texture, slightly more defined cheek/jaw shading, and a crisper temple fade than the dim original shows. Its head is also smaller in the frame than in the other three photos (a tighter crop at export would fix that without regenerating).
- Higgsfield access: this account is on a trial, so CLI generation is refused (`only_mcp_usage_on_trial_is_available`); generate through the Higgsfield MCP connector instead. CLI `higgsfield upload create <file>` works, and its IDs are accepted by the MCP generate tools.

### Procedure for adding an approved photo edit (applied to both on 2026-10-22)

1. Move it from `photo-edits/review/` to `photo-edits/enhanced/` as `<IMG name>-enhanced.png`.
2. Encode to `app/src/assets/gallery/curtain-taper.webp` or `curly-taper.webp` (spec above).
3. In `App.jsx`, restore the import (`import curtainTaper from './assets/gallery/curtain-taper.webp'` / `import curlyTaper from './assets/gallery/curly-taper.webp'`) and put the image back as the first child of its tile:
   - Curtain: `<img className="ph gallery-image" src={curtainTaper} width="960" height="1200" loading="lazy" decoding="async" alt="Three-quarter view of a center-parted wavy curtain cut with tapered sides." />`
   - Curly: `<img className="ph gallery-image" src={curlyTaper} width="960" height="1200" loading="lazy" decoding="async" alt="Right profile showing defined curls and closely tapered sides above a red barber cape." />`
4. Run `npm run build` and `npm run lint`, check the gallery in the browser, then update the table above.

If the user rejects a candidate, regenerate following their feedback and keep that tile empty in the meantime.

### Verified

- `npm run build` and `npm run lint` pass with all four photos.
- Headless Chrome (fresh profile, user's saved settings untouched): at desktop 1440px the four photos form the staggered row; in a true 390px phone view they form the staggered 2×2 grid.
- Screenshot tip: desktop Chrome will not size a window below about 500px, so `--window-size=390,...` renders a 500px layout clipped at 390 (text looks cut off; not a real bug). For a true 390px view, load the site in a 390px-wide iframe from a page served over http (e.g. `python3 -m http.server` in a scratch folder); a `file://` wrapper page stays blank.

## Return from Claude Code — verified 2026-10-23

- User resumed this chat after continuing in Claude Code during the previous usage-limit interruption. Read the updated AGENTS.md, this context, and `photo-edits/EDIT_PROMPTS.md`, and compared the handoff with the actual application.
- All four approved gallery WebPs exist and load at 960×1200. Current desktop 1440px and mobile 390px gallery screenshots were inspected: the staggered row and two-column phone grid match the handoff. The optional tighter curtain-photo crop has not been requested; preserve the approved image.
- The previous missing-gallery-import build failure is resolved. `npm run build` and `npm run lint` both pass on the current project.
- Completed the actual booking preview in a fresh browser profile: Signature Cut + Premium protein totals 3800 DA; date/time selection reaches the completion page, which preserves the exact pending-approval status and two-line review message. The completion screen was checked at desktop and phone sizes, closing the verification gap left by the earlier usage-limit failure.
- Admin controls load correctly: six sample cut cards with duplication/deletion, Protein hair treatment and Gommage with editable types, and weekly working hours. No personal browser settings were changed by verification.
- App white SVG is still byte-identical to the approved source. The existing fixed backdrop remains behind the hero and The Block only.
- Website code and approved photos were preserved during this handoff; this entry records verification. Secure owner authentication and shared settings persistence are still the next development step, followed by real requests, owner approval and conflict-safe reservations. No production backend or hosting is connected.
- For future phone QA with the available Playwright runtime, use `page.setViewportSize({ width: 390, height: 844 })` and verify `window.innerWidth`; it supplies a true narrow viewport without the desktop Chrome command-line window-size limitation described above.

## Gallery comparison in progress — 2026-10-23

- User explicitly requested Codex regenerate IMG_4120 and IMG_3665 to match the established IMG_2664/IMG_2991 photos and compare them with Claude's versions.
- New candidates will be saved separately in `photo-edits/review/`; current approved gallery assets stay in place until the user chooses replacements. Prompt record: `photo-edits/review/CODEX_REGEN_2026-10-23.md`.
- Built-in image_gen uses each original as its edit target and the two established photos as style-only references. Comparison will assess backdrop, framing, natural skin and fidelity of face/cut.
- Status 2026-10-23 (Claude Code): Codex's usage limit hit before it saved its images or finished the comparison. Claude copied its two generated images from `~/.codex/generated_images/` into `photo-edits/review/` as `IMG_4120-codex-v2.png` and `IMG_3665-codex-v2.png` (1122×1402; the file names `codex-claude-comparison.html` already expects). The website still uses the Claude/Higgsfield versions; nothing was swapped. Waiting for the user to choose per photo.
- Update 2026-10-23: the user then asked for "these right images" with the logo watermark and no swap request, so the four live photos (Claude/Higgsfield versions for curtain and curly) were kept and watermarked. The Codex v2 candidates remain in `review/` only; ask the user before using them.
- Claude's comparison: both pairs match the established backdrop. Codex v2 uses a larger head like the other gallery photos and is softer/closer to the dim original. In IMG_4120 Codex keeps the original soft fade and skin; the Higgsfield version added stubble and crisper shading. In IMG_3665 Codex warmed the hair toward brown/red and added more sheen, while the Higgsfield version keeps the original cool grey-blue hair sheen and sharper curls. Codex candidates are 1122×1402, below the 1792×2240 of the Higgsfield ones; both fit the 960×1200 gallery assets.

## Supabase / GitHub connection check — 2026-10-23 (Claude Code)

(Superseded the same day for Supabase: see "Supabase backend milestone" below. The GitHub findings in this section are still current.)

The user said they connected Supabase and GitHub and asked to move on. Findings, nothing changed in the app:

- Supabase: `claude mcp list` shows the claude.ai "Supabase" connector as Connected (`https://mcp.supabase.com/mcp`), but its tools were NOT loaded into Claude Code's already-running chat, so no database/project access happened. It likely needs a fresh Claude Code session (or `/mcp` reconnect) to appear. No Supabase CLI is installed. No `.env.local` exists; `app/.env.example` expects `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (publishable `sb_publishable_…` key only; `.env*` is git-ignored).
- GitHub: no connection found (no `gh` CLI, no GitHub connector, no SSH keys, no Git repository in the project). Needed before any push: a GitHub login for this Mac (`gh auth login`) or a GitHub connector, plus the repository name and visibility the user wants. The project contains client photos, so prefer a private repo unless the user says otherwise.
- Undocumented earlier work found in the app (written 2026-10-23 01:15, most likely by Codex): `app/src/lib/supabase.js` (client from the two env vars, validates a publishable key), `app/src/auth/useOwnerAuth.js` (session + admin check against a `studio_admins` table), `app/src/auth/OwnerAccess.jsx/.css` (owner sign-in UI). `@supabase/supabase-js` 2.118.0 is in package.json. None of it is imported by `App.jsx` or `AdminPanel.jsx` yet, so the live app behaves as before (local-only admin). There is no SQL, migration or `supabase/` folder, so the database tables (`studio_admins`, shared settings) and row-level-security policies do not exist yet.
- Next steps once the Supabase connector is usable: create or pick the dedicated Skee Block project (free tier), add the schema + RLS (`studio_admins`, `studio_settings`), wire `useStudioSettings` and the `#admin` panel to Supabase behind owner sign-in, keep the local fallback, then verify in the app.

## Supabase backend milestone — 2026-10-23 (Claude Code)

The Supabase connector became usable in a fresh Claude Code session (tools `mcp__claude_ai_Supabase__*`). The user's organization "Skee Block" (free plan, id `ffxtckjdcoyaxkgpisco`) had no projects, so Claude created one.

### Project

- Name `skee-block`, ref/id `jfojdzzafbosqneervtn`, region `eu-west-3` (Paris, closest to M'Sila), free plan, URL `https://jfojdzzafbosqneervtn.supabase.co`.
- `app/.env.local` (git-ignored, created by Claude) holds `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (the publishable `sb_publishable_…` key, browser-safe by design). Vite reads it only at startup, so restart the dev server after changing it. The dev server on port 5174 was restarted for this; another vite on port 5173 (not touched) still runs without these values until restarted. No secret/service-role key or database password is stored anywhere; Claude never saw them.

### Database (migration `studio_admins_and_settings`, applied through the MCP)

- `public.studio_admins(user_id → auth.users, created_at)`: who is an owner. RLS: an authenticated user can read only their own row; nobody can write through the API. Owners are added only by SQL (dashboard SQL editor or MCP).
- `public.studio_settings(id = 'main', payload jsonb, updated_at, updated_by)`: one shared settings document (menu, add-ons, hours; `version` 2 shape from `studioSettings.js`, max 200 KB). RLS: anyone (including visitors) can read; only owners can insert/update; nobody can delete. A trigger stamps `updated_at` and `updated_by` server-side.
- Supabase's security advisor reports no issues.
- Tested against the live database with two throwaway accounts: an owner could save and update; a signed-in non-owner got 403 on saving or adding themselves as admin; anonymous visitors could read the settings but not write, and could not read the owner list; deleting was refused; `updated_by` was stamped with the owner's id.

### App changes

- `app/src/settings/useStudioSettings.js`: when Supabase is configured it loads the shared settings on page load (falling back to the browser copy/samples, and caching the shared copy locally) and saves with an upsert to `studio_settings`; `saveSettings` is now async. Without the env vars it behaves as the old local-only preview.
- `app/src/admin/AdminGate.jsx` (new): with Supabase configured, `#admin` shows the owner sign-in (`auth/OwnerAccess.jsx`, written earlier by Codex) unless the signed-in user is in `studio_admins`; then it shows `AdminPanel`. `App.jsx` renders `AdminGate` instead of `AdminPanel`.
- `app/src/admin/AdminPanel.jsx`: optional `owner` prop adds a Sign out button, an "Owner session" note, async save with "Saved online…" wording; the local-preview wording remains when there is no owner session.
- Verified: `npm run build` and `npm run lint` pass; headless Chrome shows the owner sign-in at `#admin` and the unchanged public homepage. The full browser flow (signing in as a real owner and saving from the panel) has NOT been run yet because no real owner account exists; only the database rules were tested.

### Cleanup the user must do (declined statements)

Claude's attempts to delete its two test accounts and the test settings row were declined by the tool permissions (destructive SQL). Instead both accounts were locked (banned forever, password scrambled), so they cannot sign in. Test row left in `studio_settings`: payload with empty lists, which the app rejects as invalid and ignores (the admin shows a "shared settings could not be read" notice until the first real save replaces it). The user should run in the Supabase SQL editor (project `jfojdzzafbosqneervtn`):

```sql
delete from public.studio_settings;
delete from auth.users where email like 'tmp-%-test@example.invalid';
```

### Still to do for the owner login

1. User creates the real owner account in the Supabase dashboard: Authentication → Users → Add user → Create new user (email + a strong password of at least 12 characters, Auto Confirm on). This avoids email-redirect set-up.
2. Add that user to `studio_admins`: `insert into public.studio_admins (user_id) select id from auth.users where email = '<owner email>';` (Claude can run it once the user confirms which email is the owner; nothing was inserted for a real person).
3. Dashboard → Authentication → Sign In / Providers: turn OFF "Allow new users to sign up" (not settable through the MCP). RLS already blocks non-owners from changing data, but sign-ups should still be closed.
4. For password-reset or invite emails, set Authentication → URL Configuration → Site URL and redirect URLs to where the site runs (currently `http://127.0.0.1:5174`).
5. Then test the full flow in the browser: sign in at `#admin`, edit, Save all changes, open the site in a private window and confirm the change shows.

### Known limits

- Public visitors briefly see the browser-cached or sample menu before the shared settings load.
- Bookings, clients, reviews and reminders are still not in the database; only owner access and the studio settings are.
- GitHub: connected later on 2026-10-23. Claude installed the official GitHub CLI v2.103.0 (checksum verified) at `~/.local/bin/gh` (not on PATH; call it by full path) and the user approved the browser sign-in: logged in as `Jweebae`, HTTPS git protocol, token scopes `repo`, `read:org`, `gist`, stored in the macOS keyring (never in project files). That account's existing repos are `nexora-order-page` and `healers`; no Skee repository exists yet and the project folder is still not a git repository. (Resolved the same day: the user chose a private repository and left the name to Claude; see "GitHub repository milestone" below.) Checks done before the first commit: confirm `.gitignore` covers `.env*` (it does, except `.env.example`), `node_modules`, `dist`, and decide whether the large originals (HEIC/PNG in `photo-edits/source`, `enhanced`, `review`) belong in the repository.

## GitHub repository milestone — 2026-10-23 (Claude Code)

- Repository: https://github.com/Jweebae/skee-block (created private; made PUBLIC on 2026-10-23 for GitHub Pages, see the GitHub Pages milestone; default branch `main`). The git repository root is this `website project` folder (not the outer "skee barber shop " folder). First commit `522e667` pushed with 59 files (about 38 MB): `app/`, `brand/`, `docs/`, `photo-edits/` (script, notes, comparison page, `final/` masters), `AGENTS.md`, `PROJECT_CONTEXT.md`, `.gitignore`.
- Not in the repository (by `.gitignore`): `.env*` except `app/.env.example` (so `app/.env.local` with the Supabase URL and publishable key exists only on this Mac), `node_modules/`, `dist/`, `photo-edits/source/`, `photo-edits/enhanced/`, and review images. A fresh clone therefore needs `npm install` and its own `app/.env.local` (copy `.env.example`, fill the two values from the Supabase project `jfojdzzafbosqneervtn`).
- Commits use the local repository identity `Jweebae <337940131+Jweebae@users.noreply.github.com>` (GitHub's private no-reply address; nothing set globally). Pushing works through the GitHub CLI credential helper (`~/.local/bin/gh`, logged in as `Jweebae`).
- Publishing (superseded by the GitHub Pages milestone below): a private repository does not block publishing the site. GitHub Pages on a private repository needs a paid GitHub plan (to be verified for this account), so for the zero-budget goal use a free static host that deploys from private repositories (Cloudflare Pages, Netlify or Vercel) or make the repository public later (that would expose the code, database notes and photo masters). The build is `npm run build` in `app/` (output `app/dist`); the host must set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, and the production address must be added in Supabase Authentication → URL Configuration. No host has been chosen or configured, so nothing is published yet.

## GitHub Pages milestone — 2026-10-23 (Claude Code)

- LIVE SITE: https://jweebae.github.io/skee-block/ (owner sign-in at `…/skee-block/#admin`). The user decided to use GitHub's free hosting, which on a free account requires a public repository, so `Jweebae/skee-block` was made PUBLIC after the user was told what that exposes (code, database notes, watermarked photo masters, and these notes, including that Said is the private admin identity) and accepted it.
- Pre-publication scan by Claude: no emails, phone numbers, addresses, coordinates or key values in tracked files; the photo files carry no EXIF/GPS data; the initial commits use GitHub's no-reply address.
- Deployment: `.github/workflows/pages.yml` lints, builds with `VITE_BASE=/skee-block/` and deploys `app/dist` to Pages on every push to `main` (also manually via `workflow_dispatch`). Pages source is "GitHub Actions". First run succeeded (run 39887770480). Checked live: page, JavaScript and the four gallery photos return 200; the photos show the logo; `#admin` shows the owner sign-in; the public JavaScript contains only the Supabase URL and the publishable key (the strings `sb_secret_`/`service_role` in the bundle are supabase-js's own prefix checks, not values).
- Build settings: repository variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (public values, stored as variables, not secrets). If the Supabase project changes, update them with `gh variable set <NAME> --repo Jweebae/skee-block` and push. `app/vite.config.js` has `base: process.env.VITE_BASE || '/'`: local development stays at `/`, the Pages build uses `/skee-block/`. Routing is hash-based, so no 404 fallback is needed.
- Every push to `main` changes the live site. Keep `main` building (`npm run build` and `npm run lint` in `app/`); a failed run leaves the previous live version in place.
- Still to do, in the Supabase dashboard (not possible through the MCP): (1) Authentication → URL Configuration: Site URL `https://jweebae.github.io/skee-block/` and add it to the redirect URLs (needed for password-reset emails); (2) turn OFF "Allow new users to sign up" (more important now that the site is public); (3) DONE 2026-10-23: the user created the real owner account and Claude added it to `studio_admins` (email and password deliberately not written anywhere in this public repository; a read-only sign-in check confirmed the account passes the owner test; the full browser flow of editing and saving settings from `#admin` still needs to be run by the user or an agent); (4) run the cleanup SQL listed in the Supabase milestone.
- Not done: custom domain (costs money; the free `github.io` address is in use), real WhatsApp number, final text content (reviews, story, hours are still placeholders), Arabic version, booking storage.

## Client sign-in with Google — 2026-10-23 (Claude Code)

- Supabase side (done by the user in the dashboard): Google provider enabled with a Google Cloud OAuth client ("Skee Block web", Web application; authorized JavaScript origin `https://jweebae.github.io`, redirect URI `https://jfojdzzafbosqneervtn.supabase.co/auth/v1/callback`). The Google client secret exists only in Supabase and Google; it is not stored in this repository, notes or memory. The user pasted it in chat once, so it should be rotated (Google Cloud → client → add new secret → paste in Supabase → disable old).
- Public check of `/auth/v1/settings`: Google enabled, email sign-in enabled, auto-confirm off, and "New sign-ups blocked" TRUE at the time of writing, so a first-time Google user is refused until the user switches "Allow new users to sign up" ON (Authentication → Sign In / Providers). Existing accounts (the owner) can still sign in. Strangers still cannot touch owner data: RLS only trusts `studio_admins`.
- App: `app/src/auth/useClientSession.js` (client session, `signInWithOAuth` with Google redirecting back to the current page, sign-out, and readable error when Google returns a failure such as `signup_disabled`). `App.jsx` uses it: the header button reads "Sign in" or "Account"; the account dialog shows "Continue with Google", or "Signed in as <name>" with Sign out; if Google returns an error the dialog opens by itself with the message. Without Supabase configured the dialog keeps the old "coming soon" text. The dialog copy says booking history and saved preferences are coming soon and bookings are not connected (true: no client data tables exist yet).
- Owner access is unchanged: a signed-in client who opens `#admin` sees "This account does not have owner access".
- Verified: build and lint pass; in headless Chrome the dialog shows the Google button and, when the address carries `error_code=signup_disabled`, opens automatically with "New accounts are not open yet…". NOT verified: a complete Google sign-in (needs a real Google login) and the return redirect; this depends on Supabase → Authentication → URL Configuration having the site address (`https://jweebae.github.io/skee-block/` and, for local testing, `http://127.0.0.1:5174/**`) in the redirect URLs.
- Not built at that point (the sign-up with names and password was added later the same day, see "Client account flow"): client profile table, booking history, saved preferences, a privacy notice for client data (should exist before collecting real client data).

## Client account flow (sign up, sign in, change password) — 2026-10-23 (Claude Code)

The user confirmed Google sign-in worked and asked for a proper sign-up (first/last name and a chosen password) and for password changes to require re-confirming with Google. Built and tested; supersedes the "Google button only" dialog described above.

- Design reason: Supabase's built-in email service is very limited on the free plan (a few messages per hour and, per Supabase's docs, only to members of the project's organization), so email-link confirmation and reset emails cannot be relied on for clients. Google already verifies email ownership, so Google replaces email confirmation.
- Create account: "Create account" tab → Continue with Google → on return the dialog opens with "Almost done": first name, last name (pre-filled from Google), password (min 10 characters, entered twice). Saving calls `updateUser({ password, data: { first_name, last_name, profile_complete: true } })`. Names live in the auth user's metadata for now (no profile table yet). "Not now" skips; the form returns next time.
- Sign in: email + password form, or Continue with Google. Wrong credentials give one generic message.
- (Superseded by the Revision section below.) Change password: signed-in panel → "Change password" (also "Forgot your password? Confirm with Google" on the sign-in tab) → forced fresh Google login (`prompt=login`) → "Choose a new password". The form is only offered if the session's own sign-in record (`amr` in the access token) shows a Google (`oauth`) login within the last 10 minutes and the client asked for the change in this browser session (marker `skee.client-reauth` in sessionStorage, no secrets); submit re-checks the same.
- Files: `app/src/auth/useClientSession.js` (state and actions), `app/src/auth/ClientAccount.jsx` + `.css` (screens), `App.jsx` (dialog; auto-opens on return from Google when there is something to finish; header button reads Sign in / Account).
- Verified with a scripted Chrome session against the dev site and the real Supabase project (throwaway account `tmp-client-test@example.invalid`, now banned like the other `tmp-*-test` accounts; the cleanup SQL's `like 'tmp-%-test@example.invalid'` removes it): tabs and copy; wrong password refused; correct sign-in → "Almost done" with names pre-filled; mismatched passwords caught; completing creates the account (names, `profile_complete` saved; greeting "Hello, <first name>"; header says Account); session survives reload; sign-out; signing in with the NEW password works; "Change password" and "Forgot password" both send the browser to Supabase's Google authorize URL with `prompt=login`. `npm run build` and `npm run lint` pass with no warnings.
- NOT verified (needs a real Google login): the actual return trip from Google for a brand-new person, and the Choose-a-new-password screen after a real Google re-login. Also untested: that a password set by an OAuth-created user works for email sign-in (expected per Supabase; tested only with an email-created account).
- Known limits: (1) the 10-minute Google re-login rule is enforced in the app only; a signed-in client calling the Supabase API directly could still change their own password. Hardening option: an Edge Function that changes passwords after checking the token's `amr`, plus Supabase's "Secure password change" setting. (2) Minimum password length is enforced in the app (10); the project's own minimum is Supabase's default (shorter), and leaked-password checks need a paid plan. (3) No privacy notice yet and no profile/booking tables (next steps requested by the user, in this order: privacy notice, then client profiles). Sign-ups are currently open in Supabase, so real people can already create accounts; the notice should be added before the site is promoted.
- The owner's own account (created by the user) has no names saved, so signing in with Google as the owner shows "Almost done" once; skipping it ("Not now") is fine. Completing it would change the owner's password.

## Revision: simpler password rules and Supabase ↔ GitHub — 2026-10-23 (Claude Code)

- The user asked to remove the Google re-login when choosing or changing a password, and to require proof of ownership only for a forgotten password.
- Now: (1) Sign-up: Google confirms the email, then the first name, last name and password are simply saved. (2) A signed-in client's "Change password" opens the form directly; no re-confirmation. (3) Forgot password is offered only after a failed password sign-in, with two proofs of ownership: "Confirm with Google" (forced fresh Google login, `prompt=login`) or "Email me a code" (`signInWithOtp` with `shouldCreateUser: false`, then `verifyOtp` type `email`). After either proof the app shows "Choose a new password" (non-secret marker `skee.client-reset` in sessionStorage); saving clears it. All Google-freshness/`amr` logic was removed, so limit (1) in the section above no longer applies. The screens never reveal whether an email has an account; only a rate-limit error is shown.
- Email-code caveats (NOT configured yet): (a) Supabase's free built-in email service is heavily limited (per Supabase docs only to members of the project's organization, and a few messages per hour), so clients will not receive codes until custom SMTP is set up in the dashboard (for example a dedicated Gmail account with an App Password through smtp.gmail.com, or another provider); (b) the "Magic Link" email template must contain `{{ .Token }}` or the email shows a link instead of a code. Neither can be set through the MCP. Until both are done, use the Google proof. Verified against the live API: asking for a code for an email without an account returns 422 `otp_disabled` (the screen still shows the code step); an invalid email domain returns 400.
- Verified with a scripted Chrome session on the real Supabase project (14/14): no forgot-password offer before a failed attempt; failed attempt shows the message and both proofs; sign-in → names pre-filled → account saved with the first password; signed-in Change password has no Google round trip, catches mismatches and saves; the old password stops working and the new one works; after proof-of-ownership the next screen is "Choose a new password" and saving clears the marker; "Email me a code" calls `/auth/v1/otp` and shows the code step; a wrong code is refused; "Confirm with Google" goes to Supabase's Google authorize URL with `prompt=login`. Build and lint pass with no warnings. Not verified: delivery of a real emailed code, and a real Google return trip. Throwaway accounts `tmp-client-test` and `tmp-client2-test` are locked; the `like 'tmp-%-test@example.invalid'` cleanup SQL removes them.
- Supabase GitHub integration: the user is connecting Supabase dashboard → Project Settings → Integrations → GitHub to `Jweebae/skee-block` (working directory `.`, production branch `main`; branching/preview branches need the Pro plan and are not used). Prepared in the repo before enabling: `supabase/config.toml` (minimal, project id only; auth settings stay in the dashboard) and `supabase/migrations/20261023013842_studio_admins_and_settings.sql`, the exact baseline of what is already applied (version taken from `list_migrations`), so enabling should not re-run it. Enabling is a dashboard action Claude cannot perform or check. With "Deploy to production" on, any new migration file merged to `main` runs on the production database automatically; see the migration rule in AGENTS.md.

## Owner account recreated — 2026-10-23 (Claude Code)

- The owner account the user had created earlier no longer existed in the Supabase project (cause unknown; it may have been deleted in the dashboard). At the user's request Claude created it again with SQL: a confirmed email/password user plus its `auth.identities` row, marked `profile_complete`, and added it to `public.studio_admins`. The email and password the user gave are deliberately not recorded anywhere in the repository (it is public); they are in the user's own possession.
- Verified on the LIVE site with a scripted browser: `#admin` asks for the owner sign-in; the owner credentials open the studio panel ("Owner session", Cuts / Add-ons / Working hours, Sign out); no "no owner access" refusal; Sign out returns to the sign-in screen. No setting was saved during the check.
- Other accounts now in the project: a client account created by someone testing Google sign-in (not an owner), and four locked `tmp-*-test@example.invalid` throwaway accounts (the cleanup SQL `delete from auth.users where email like 'tmp-%-test@example.invalid'` has still not been run by the user; the locked accounts cannot sign in, but `tmp-owner-test` is still listed in `studio_admins`).
- Known cosmetic issue: `public.studio_settings` still holds the invalid empty test record from the security tests, so the owner panel shows a red notice "The shared studio settings could not be read…" and the public site falls back to the built-in sample menu (identical to the defaults). It disappears after the owner's first "Save all changes" (which upserts a valid record) or after `delete from public.studio_settings;`. Claude tried to overwrite the record with the default menu through the MCP and the tool permissions blocked it as a change beyond the request, so it was left as is.

## Custom domain 3kee.site — started 2026-10-23 (Claude Code)

- The user bought `3kee.site` at Namecheap (which also gave one free month of Namecheap shared hosting). Decision recorded: serve the site from GitHub Pages on that domain (free, permanent, deploys automatically from this repository); the Namecheap hosting is not used, because it is only free for a month and would need manual uploads.
- Status when checked: `3kee.site` returned NXDOMAIN on Google DNS (the `.site` registry had no delegation), so the registration was not active yet or the name differs. Nothing was switched.
- Prepared (no behaviour change): `.github/workflows/pages.yml` now builds with `VITE_BASE: ${{ vars.SITE_BASE || '/skee-block/' }}`.
- Switch plan once DNS answers (DNS records can only be added by the user in Namecheap → Domain List → Manage → Nameservers "Namecheap BasicDNS" → Advanced DNS): four `A` records for host `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; one `CNAME` for host `www` → `jweebae.github.io`; remove Namecheap's default parking records. Then Claude: (1) verify DNS with `dig`; (2) `gh variable set SITE_BASE --body /`; (3) set the custom domain in Pages (`gh api -X PUT repos/Jweebae/skee-block/pages -f cname=3kee.site`); (4) re-run the deploy workflow; (5) when GitHub has issued the certificate, enable HTTPS enforcement; (6) verify `https://3kee.site/` and the www redirect. Do NOT set the custom domain or `SITE_BASE` before DNS works: GitHub would redirect the old address to a domain that does not resolve yet.
- Dashboard steps for the user afterwards: Supabase → Authentication → URL Configuration: Site URL `https://3kee.site/` and add `https://3kee.site/**` (keep the old github.io address until the switch is verified); Google Cloud OAuth client: add `https://3kee.site` to Authorized JavaScript origins (the redirect URI stays the Supabase callback).

## Business email for 3kee.site — 2026-10-23 (Claude Code, findings only)

- The user created two Namecheap Private Email mailboxes: `admin@3kee.site` and `contact@3kee.site` (business addresses, fine to publish). Authoritative DNS (asked straight from `dns1.registrar-servers.com`): MX `mx1.privateemail.com` and `mx2.privateemail.com` (priority 10), SPF `v=spf1 include:spf.privateemail.com ~all`, CNAMEs `mail` and `autodiscover` → `privateemail.com`; the website records (four GitHub A records, `www` CNAME) are intact. No DKIM (`default._domainkey`) and no DMARC (`_dmarc`) record yet. Public resolvers such as 8.8.8.8 can show stale answers for up to six hours after DNS changes; use the authoritative servers when checking.
- Requested by the user: forward both mailboxes into the owners' personal Gmail inboxes and let those Gmail accounts reply as `admin@` / `contact@` ("Send mail as" over `mail.privateemail.com`, port 465, SSL, username = the full address). These are dashboard actions in Namecheap and in each Gmail account; Claude cannot perform or verify them and never asks for the mailbox passwords.
- Cost note: Namecheap Private Email is normally a free trial (about two months) and then paid; the zero-budget rule means the user must decide before it lapses (alternatives: free Namecheap email forwarding only, or keep paying a small monthly fee). Mail setup is separate from the website, which stays free.
- Possible next step: use `admin@3kee.site` as Supabase's custom SMTP (Authentication → SMTP Settings) so clients can receive emailed codes; the password is entered by the user in the Supabase dashboard, never shared.

## Second owner added — 2026-10-23 (Claude Code)

- At the user's request a second person's account (a Google-created client account that had completed the "Almost done" step, so it also has a password) was added to `public.studio_admins` by SQL. The email is not recorded here because the repository is public. Both owners have the same powers: everything the studio panel offers (menu, add-ons, working hours). Owners sign in at `#admin` with email and password (the panel has no Google button); more owners are added only by SQL. Bookings, clients and reviews management do not exist yet.

## Custom domain 3kee.site switched on — 2026-10-23 (Claude Code)

- LIVE SITE NOW: https://3kee.site/ (owner sign-in at `https://3kee.site/#admin`). The earlier address `https://jweebae.github.io/skee-block/` answers 301 → `https://3kee.site/`, and `www.3kee.site` answers 301 → `https://3kee.site/`.
- DNS (set by the user in Namecheap, BasicDNS, nameservers `dns1/dns2.registrar-servers.com`): four A records on `@` (185.199.108.153, .109.153, .110.153, .111.153) and CNAME `www` → `jweebae.github.io`. Seen on both Google and Cloudflare resolvers before switching.
- Repository side: repository variable `SITE_BASE=/` (build base is now the domain root), Pages custom domain `3kee.site` set through the API, redeploy succeeded (run 39897997893), Let's Encrypt certificate issued for `3kee.site` and `www.3kee.site` (valid to 2027-01-21), `https_enforced=true`. At the time of writing plain `http://3kee.site/` still returned 200 instead of redirecting; GitHub applies the setting with some delay, so recheck.
- Verified on `https://3kee.site/`: page and scripts load with root-based asset paths, the four gallery photos with logos show, owner sign-in opens the studio panel and Sign out works (scripted browser, nothing saved).
- Not changed: the domain is bought and renewed at Namecheap by the user (the free one-month Namecheap hosting is not used). If the repository is ever renamed or Pages is switched off, the DNS records still point at GitHub.
- Still to do in dashboards (user): Supabase → Authentication → URL Configuration: Site URL `https://3kee.site/` and Redirect URLs include `https://3kee.site/**` (keep the github.io entry until confirmed); Google Cloud → OAuth client "Skee Block web": add `https://3kee.site` and `https://www.3kee.site` to Authorized JavaScript origins (redirect URI stays the Supabase callback). Until the Supabase redirect entry exists, Google sign-in on the new domain may send people back to the old Site URL. Browser sessions are per address, so anyone signed in on the github.io address must sign in again on the new one.

## ChatGPT connection reconciliation — 2026-10-23

- Re-read the local project after the user answered the earlier organization/owner setup questions. Claude’s newer implementation supersedes the earlier unfinished ChatGPT setup plan. The independent Skee Block organization/project already exists according to the committed milestones; no duplicate was created.
- GitHub connector authenticated successfully; remote `main` and local checkout matched commit `a58dbf3` before this documentation update. The working tree was clean. App source confirms `AdminGate`, Supabase-backed `useStudioSettings`, and the client account screens are integrated.
- This chat’s Supabase `list_organizations`/`list_projects` still return only Nexora. Reading organization `ffxtckjdcoyaxkgpisco` returned “You do not have permission to perform this action”. Asked the user to reconnect the plugin with Skee Block included. No database changes or owner-role changes were attempted during this reconciliation. The supplied owner email is not stored in this public repository.
- Fresh `npm run build` and `npm run lint` pass. Build has a non-blocking JavaScript chunk-size warning (about 517 kB before gzip). No new browser or authenticated database verification was performed in this checkpoint.
- Only project documentation changed. Outstanding database condition from Claude’s notes (invalid test settings payload and locked test accounts) remains unverified in this chat; inspect after authorization instead of assuming it is still present or already resolved.

## Supabase access restored and existing state verified — 2026-10-23

- After the user authorized ChatGPT for Skee Block, the connector exposes separate connections for Skee Block and Nexora. Use the connection whose project listing contains `jfojdzzafbosqneervtn`; do not use Nexora for this website.
- Live read-only verification: `skee-block` is ACTIVE_HEALTHY in the separate Skee Block organization. Both public tables have RLS enabled. The owner membership table permits users to read their own row and denies client writes; settings have public read and owner-only insert/update policies.
- Two active owner accounts exist; the account specified by the user is already an owner. No emails, user IDs, passwords or connection identifiers are recorded here. No roles were changed and no sign-in was performed.
- Confirmed the unresolved test payload in `studio_settings`: singleton `main`, version 2, zero cuts, zero add-ons, zero working days. App validation requires seven weekly entries, so this payload is rejected and the cached/sample menu is used. No settings were overwritten during this connection check. Restore the existing samples and verify online saving before the next feature milestone.
- Security advisor reports one warning: leaked-password protection is disabled. Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . No security settings changed.

## Shared settings repaired — 2026-10-24

- User approved continuing with the shared-settings repair. Generated the payload directly from `createDefaultSettings()` and normalized it through the existing `validateSettings()`; no new cut names, prices, types or hours were invented.
- Replaced `studio_settings.main` only when its entire payload exactly matched the known empty test record (`version: 2`, three empty arrays). The guarded update succeeded, so legitimate owner edits could not be overwritten by this repair. No schema, RLS, owner roles, accounts or frontend source changed.
- Online settings now contain six cuts, six add-on groups with nested types, seven weekly schedule entries (Friday closed), and fixed base price 800 DA. Add-on prices and durations remain editable samples. The existing server trigger stamped the update; this maintenance write did not impersonate an owner session.
- Verification: separate database read confirms the saved counts and base price. Using only the configured publishable key and no signed-in session, the public REST API returned the complete payload; it passed the app validator and deep-equaled the normalized source defaults. An anonymous read of `studio_admins` was refused. No credentials or owner data were printed or added to tracked files.
- Before this repair, the live homepage at `https://3kee.site/` was inspected in-browser: six 800 DA service cards, four gallery links, booking/account controls and the Studio admin link were present. Final live browser recheck was blocked by a declined origin permission; the repair is verified through the API, not claimed as a completed visual booking/owner-save test. No alternate browser route was used.
- Build and lint pass (existing non-blocking bundle-size warning remains). Next feature step: privacy notice, then client profiles. Locked historical test accounts remain as previously documented; they were not modified.

## Availability refresh and public contact — 2026-10-24

- User requested that saved barber availability automatically change the public website, supplied the public business contact and area for publication, and confirmed that the barber retains full existing menu controls. This step took priority over the privacy-notice work.
- `app/src/settings/useStudioSettings.js` now reloads shared settings every 15 seconds while the page is visible, and on window focus, returning online, visibility return and relevant cross-tab storage events. The saving tab updates immediately. The same settings feed menu cards, hero/Visit hour summaries, Friday status, weekly hours, preferences, add-on types and preview slots. Hidden tabs pause polling; reopening them refreshes. No database migration or paid service was added.
- Read results started before a save cannot overwrite the newer saved state. Identical data avoids unnecessary renders. `AdminPanel.jsx` adopts refreshed settings when its draft is clean and preserves unsaved edits when a remote refresh arrives. Existing add/duplicate/delete/show/hide controls for cuts/add-on groups/types, preferences, durations, prices and working hours remain available behind the unchanged owner gate/RLS. Base cuts stay fixed at 800 DA.
- Public business contact is centralized in `app/src/settings/studioContact.js`. The user-approved area replaces the district placeholder; the supplied public phone replaces both phone placeholders. All homepage WhatsApp controls open that destination with a prepared message; booking-preview “Arrange a visit” now uses WhatsApp too. Opening a chat does not send a message or approve an appointment. The exact studio location remains private.
- Verification: build/lint pass. Offline behavior tests against the actual settings hook verified polling/focus updates, changed cut names, opening/closing Friday, break-aware booking slots, hidden-tab pause, stale-read/save ordering and listener cleanup. Actual homepage/admin components were also rendered through Vite SSR: correct contact values/no placeholders and existing management controls passed. WhatsApp URL destination/message were checked without sending anything. No production settings were edited for tests.
- Browser origin access for local visual QA was declined; no alternate browser route was used. Visual interaction and real owner-save checks are not claimed for this change. Existing non-blocking bundle-size warning remains. Next planned feature remains privacy notice, then client profiles.

## Browser tab icon — 2026-10-24

- Replaced the default Vite favicon with the approved white 3kee logo on the brand ink background, centered in a square icon. Original logo paths are preserved exactly; the website/header logo is unchanged.
- `app/public/favicon.svg` contains the icon; `app/index.html` uses the configured base URL and a version query so browsers request the new icon instead of their cached starter icon.
- Verified SVG parses and every logo path matches the approved app asset; build and lint pass.

## Resume check after ChatGPT's credit limit — 2026-10-24 (Claude Code)

- Read ChatGPT's milestones (reconciliation, Supabase access, shared-settings repair, availability refresh with public contact, tab icon) and compared them with the code and the live site. Everything is committed and pushed; the working tree was clean except the untracked `photo-edits/hero/` folder.
- Independently verified on `https://3kee.site/` with a scripted browser (read-only; nothing saved): six service cards at 800 DA; four gallery photos load at full size (1792/1122 px wide) once scrolled into view; WhatsApp controls present; tab icon configured; the owner sign-in opens the studio panel; the red "shared settings could not be read" notice is gone and the panel lists six cuts (so the repaired shared settings load); `http://` → `https://` and `www` → apex redirects work; authoritative DNS still has the four GitHub A records, MX/SPF for Private Email. Local `npm run build` and `npm run lint` pass (only the known chunk-size notice); the last four Pages deployments succeeded.
- Safety fix: `photo-edits/hero/source/` holds nine raw client photos (about 27 MB) that `git add -A` would have published to this public repository. `.gitignore` now ignores `photo-edits/*/source/` and any `.png/.jpg/.jpeg/.webp` in `photo-edits/*/review/`. Hero work stays local until the user supplies the final image.
- Decision: the hero portrait is paused. The user will generate the final image after the ChatGPT credits reset; until then the hero keeps its labelled placeholder.
- Content still placeholder on the live page: hero portrait label, the "next opening" time shown as `[time]`, brand story paragraphs, three review cards, and the hero photo. Sign-ups are open and a real client account already exists, so the privacy notice is the most urgent feature.
- Agreed next order: (1) privacy notice and a consent line on account creation (can name `contact@3kee.site` as the contact), (2) client profile table with the names moved out of auth metadata, plus the client's right to delete their account, (3) compute "next opening" from the saved hours, (4) email: finish forwarding/send-as in Namecheap and Gmail, then use `admin@3kee.site` as Supabase's SMTP so emailed codes reach clients, (5) later: Arabic/RTL version, bookings storage.
- Outstanding user-side items: Supabase URL Configuration and Google authorized origins for `https://3kee.site` (if not done yet), the cleanup SQL for the locked `tmp-*-test` accounts, Private Email trial cost decision, a real owner "Save all changes" test from the panel.

## Privacy notice and consent — 2026-10-24 (Claude Code)

- New page `#privacy` (`app/src/legal/PrivacyNotice.jsx` + `.css`; constants in `app/src/legal/privacy.js`: `PRIVACY_VERSION = '2026-10-24'`, contact `contact@3kee.site`). English only for now; the user decided the site opens in English by default and Arabic comes later. Footer link "Privacy" next to "Studio admin". `App.jsx` routes `#privacy` like `#admin`.
- Content (plain language, written to match what the site really does; keep it in step with every data-related feature): who is responsible (Skee Block, M'Sila; contact email); what is collected (account names, email, hashed password, acceptance date; Google name/email/profile-picture link; sign-in security logs incl. IP; booking preview stays in the browser and bookings are not stored; messages sent by email/WhatsApp/Instagram); no advertising/analytics trackers, no selling; purposes; processors (Supabase in Paris, GitHub Pages, Google for sign-in and inbox delivery, Namecheap for domain/email; some outside Algeria); browser storage (session, menu cache, reset marker; no advertising cookies); retention (while the account is open; deleted within 30 days of a request); rights (access, correction, deletion, objection via email, reply within 30 days; reference to Algeria's Law No. 18-07 of 10 June 2018 and the ANPDP); security; changes.
- Consent: the account dialog tells Google newcomers that continuing creates an account and accepts the notice; the "Almost done" step has a required checkbox "I have read and accept the privacy notice"; saving stores `privacy_version` and `privacy_accepted_at` in the user's metadata. Privacy links inside the dialog open in a new tab so a half-filled form is kept.
- Not legal advice: Law 18-07 may require a prior declaration of the processing to the ANPDP and authorisation for transfers abroad (the processors above are outside Algeria). The user should check this with a local adviser. Account self-deletion is not built yet (deletion is by email request, done by an owner in the Supabase dashboard); it is planned with the client-profile step.
- Verified in a scripted browser on the dev site (9/9): footer link; page heading/date/contact/law reference; page opens at the top; back link; consent text on both tabs; new-tab link; checkbox shown; account NOT created without ticking it; created after ticking. Database check: `privacy_version` = `2026-10-24` and acceptance time saved. Throwaway account `tmp-client3-test` is now locked (covered by the cleanup SQL). Build and lint pass.

## Business email: free route chosen — 2026-10-24 (Claude Code, plan)

- The user asked whether email can be free since the domain is theirs. Yes: Namecheap's free Email Forwarding (included with domains on Namecheap BasicDNS) forwards `admin@` and `contact@` to the owners' Gmail inboxes, and each Gmail can reply as those addresses through Gmail's own SMTP (`smtp.gmail.com`, port 465 SSL, username = that Gmail address, password = a Gmail App Password, which needs 2-Step Verification). This replaces Namecheap Private Email (paid after its trial).
- Switching means: Advanced DNS → Mail Settings → "Email Forwarding" (Namecheap swaps the MX records from `privateemail.com` to its forwarding servers, after which the Private Email mailboxes stop receiving); then add the forwarders; then make the single SPF record `v=spf1 include:spf.efwd.registrar-servers.com include:_spf.google.com ~all`; add DMARC TXT `_dmarc` = `v=DMARC1; p=none; rua=mailto:admin@3kee.site`. These are dashboard steps for the user; Claude checks the DNS afterwards.
- Status 2026-10-24 (checked on `dns1.registrar-servers.com`): Email Forwarding is ON (MX `eforward1–5.registrar-servers.com`); forwarders `admin` and `contact` each go to both owners' Gmail inboxes (addresses not recorded here). Fixed and re-checked the same day: exactly one SPF record, `v=spf1 include:spf.efwd.registrar-servers.com include:_spf.google.com ~all` (Namecheap shows it both in Host Records and, locked, under Mail Settings; it is one record), and DMARC `v=DMARC1; p=none; rua=mailto:admin@3kee.site`. Private Email mailboxes no longer receive mail; that trial runs to 2026-11-23 and auto-renew should be off. Gmail "Send mail as" (smtp.gmail.com, 465 SSL, the Gmail address as username, a Gmail App Password) and "Reply from the same address the message was sent to" are done in one owner's Gmail account (2026-10-24, reported by the user); the other owner's Gmail account had a login error earlier (wrong server/username prefilled by Gmail: it must be smtp.gmail.com and the full Gmail address, never `eforward…` or `admin`) and may still need doing. App Passwords are never recorded anywhere. Website records unchanged.
- Later the same Gmail SMTP can serve as Supabase's custom SMTP, sending as a verified address, so clients receive emailed codes (Gmail allows roughly 500 messages a day).

## Branded email templates — 2026-10-24 (Claude Code)

- The user asked for professional client emails (password forgotten, password changed, appointment notices, welcome and anything else needed), with the logo image and the brand name written as **3kee** only.
- Built in `emails/`: `build.mjs` generates every template from one shared layout (ink background, 3kee logo PNG, gold top rule, bone button, footer with 3kee.site, Instagram, privacy link and `contact@3kee.site`; inline styles and tables for email clients; Georgia/Helvetica fallbacks because email cannot load the site fonts). Output in `emails/html/` (not `dist`, which is git-ignored project-wide) plus a preview page `emails/html/index.html`. `emails/README.md` says where each file goes. Each file is about 3–5 KB.
- Logo for emails: `app/public/email/3kee-logo.png` (approved white logo cut from `brand/visual identity/White 3KEE Graffiti Logo.png`, on exact #0B0B0B), served at `https://3kee.site/email/3kee-logo.png`. Keep it there or the emails lose their logo.
- Supabase account emails (8): code ("Magic Link", must keep `{{ .Token }}`; this is the "Email me a code" recovery email), reset password, confirm signup, invite, change email, reauthentication, and the two security notifications (password changed, email changed: only if the dashboard offers them; check its variable names). These must be pasted by the user in Supabase → Authentication → Emails; the MCP cannot set auth templates. SMTP sender name should be **3kee**.
- Website emails (7, not sent yet because bookings are not stored): welcome, booking received (under review, usual reply within 10 minutes), confirmed (only place besides the reminder that carries `location_url`, per the private-location rule), appointment-day morning reminder, moved, cancelled, review request. They use `{{snake_case}}` placeholders for a future sender (for example a Supabase Edge Function using the same Gmail SMTP); values must be HTML-escaped.
- Verified: built templates render in Chrome with the live logo (three checked visually); no unfilled build placeholders.
- Also committed by accident with the previous commit: ChatGPT's `photo-edits/hero/HERO_PROMPTS.md` (prompt notes only, no private data). Raw hero photos stay ignored.

## Header portrait candidates — 2026-10-24

- User supplied additional chair and face photographs and requested several hero portraits matching the charcoal website, with low-key warm orange/gold light and a bottom-right 3kee watermark. IMG_4405.PNG was the requested primary face reference.
- Created three candidates through built-in image_gen: `photo-edits/hero/review/01-chair-signature.png`, `02-chair-reflective.png`, and `03-chair-after-hours.png`. Each is a separate 4:5 portrait with a white 3kee watermark. Seated references respectively: IMG_4427, IMG_4423, IMG_4430; IMG_4425 provided extra face detail. Original source files remain unchanged.
- Exact generation prompts are in `photo-edits/hero/HERO_PROMPTS.md`. Source conversions and unapproved outputs remain local and git-ignored. Candidate 02 has the strongest tight hero composition; 01 provides direct eye contact; 03 is the relaxed arms-behind-head option. These are generated portraits, not pixel-identical documentary retouches.
- Candidate 02 was explicitly approved by the user on 2026-10-24 as the homepage header portrait. It was moved from `photo-edits/hero/review/02-chair-reflective.png` to the local ignored approved archive `photo-edits/enhanced/02-chair-reflective.png`; the exact same bytes are now the live website asset `app/src/assets/hero-portrait.png`. Candidates 01 and 03 remain unapproved and local. The gallery was not changed.

## Website emails through Resend — 2026-10-24 (Claude Code)

- Provider: Resend free tier (3,000 emails a month, 100 a day), domain `3kee.site` verified with three Namecheap records: TXT `resend._domainkey` (DKIM), CNAME `rsend` → `rsend-euw1.forge.rmta.net`, CNAME `send` → `send.forge.rmta.net`. No MX change: Namecheap Email Forwarding stays as it is. The API key exists only as the Supabase Edge Function secret `RESEND_API_KEY` (entered by the user in the dashboard; never in the repository or chat).
- `emails/build.mjs` now also writes the 7 website templates to `app/public/email/templates/<name>.html`, so they are served at `https://3kee.site/email/templates/`. The subject is each file's `<title>`. They hold no private data (the location only appears via the `{{location_url}}` placeholder).
- Edge Function `supabase/functions/send-email/index.ts`, deployed through the MCP as `send-email` with `verify_jwt` off because it checks the caller's access token itself. It sends from `3kee <contact@3kee.site>` only to the signed-in user's own address. The only template a browser may request is `welcome`, once per account (needs `profile_complete`; marks `app_metadata.welcome_email_sent_at`, which users cannot edit). Placeholder values are HTML-escaped. Booking emails must later be sent server-side when bookings are stored, never on request from the browser.
- App: `completeProfile` in `app/src/auth/useClientSession.js` calls the function after the account is saved; failures are silent.
- To change the function: edit the file, then redeploy it with the Supabase MCP `deploy_edge_function` (name `send-email`, `verify_jwt` false). The GitHub integration does not deploy functions.
- Verified by the user: a new account received the welcome email.
- Fix requested the same day: a client must never be asked to change the password they just chose; "Choose a new password" appears only after they press "Forgot your password?". Before, a brand-new account reached through the recovery panel ("Confirm with Google" after a failed sign-in) was shown "Choose a new password" before the finish-account form. Now `choosingPassword` requires a finished profile, and `completeProfile` clears the recovery marker.
- Sender picture: the logo inside the email is there; the round avatar beside the sender name is not something an email can carry. Free route: a Google account on `contact@3kee.site` (Google's "use your existing email" sign-up, created by the user) with the logo as its profile photo (square file: `photo-edits/3kee-avatar.png`, 512×512), which Gmail shows to Gmail recipients. BIMI (all inboxes) needs DMARC at `p=quarantine` or stricter plus a paid VMC/CMC certificate for Gmail and Apple; not worth it now.
- 2026-10-24: the user tried the Google-account route, hit Google's phone/device verification and chose to skip the sender picture for now. Not pending; offer again only if the user asks.

## Parallel coordination handoff — 2026-10-24 (ChatGPT)

- User explicitly requested that ChatGPT and Claude Code keep each other updated while working in parallel. Persistent coordination rules are now in AGENTS.md: read the latest notes/commits before work, record task/file scope before editing, preserve concurrent changes, and document milestones/incomplete work with actual checks and deployment state.
- ChatGPT's scope for this handoff is documentation only (`AGENTS.md`, `PROJECT_CONTEXT.md`); no feature implementation is in progress or reserved by ChatGPT after this entry. Latest observed existing commit before this documentation change: `303f9a7` (Claude's sign-up/password-flow correction), with a clean working tree.
- Recovered Claude's latest notes: website welcome email through the `send-email` Edge Function/Resend; generated email templates and branding rules; recovery form shown only for completed profiles after Forgot password; user-confirmed welcome delivery. Hero portrait candidates remain pending approval and are not live. These changes are preserved, and their detailed milestones remain above.
- No direct Claude Code messaging tool is exposed to this chat. This is a shared-file handoff, not a claim that an active Claude session received or acknowledged a message. Claude should read this entry and the coordination rules before its next work item, then record its own current task/file scope.
- Planned feature queue remains privacy notice, then client profiles and real appointment workflows, subject to current user instructions and any active scope recorded by Claude. Before a privacy notice is written, account for the newly implemented transactional email flow.
- Verification for this documentation-only handoff: build and lint pass. No website, database, email function, recipients or credentials changed.

## Emailed code flow fixed — 2026-10-24 (Claude Code)

- Problem reported by the user: "Email me a code" sent Supabase's default "Your sign-in link" email (a link, no code), and there was no way to ask for a new code.
- Fixed in Supabase (dashboard, through the user's signed-in Chrome): "Magic link or OTP" template replaced with `emails/html/auth-code.html` (subject "Your 3kee code", contains `{{ .Token }}`), verified after reload. The other 7 auth templates were already the 3kee ones (checked: confirm sign-up, invite, change email, reset password, reauthentication, password changed and email changed notifications, both switched on).
- App: the code step now has "Send a new code", disabled with a 60-second countdown after each send (`app/src/auth/ClientAccount.jsx`, `ClientAccount.css`). Checked in a headless browser against a production build.
- Still open: Supabase custom SMTP is Gmail (`smtp.gmail.com`), so Gmail shows "admin@3kee.site via gmail.com". Recommended: switch Supabase SMTP to Resend (host `smtp.resend.com`, port 465, username `resend`, password = a Resend API key typed by the user, sender `contact@3kee.site`, name 3kee), which signs as 3kee.site.

## Approved header portrait — 2026-10-24 (ChatGPT)

- User explicitly approved `haircuts gallery/Oct 24, 2026, 04_30_48 AM.png` for the homepage header portrait box and asked to remove the placeholder text `[Photo] Skee at the chair — low key light`.
- Completed in `app/src/App.jsx`, `app/src/App.css` and `app/src/assets/hero-portrait.png`. The exact approved 1122×1402 PNG fills the existing 4:5 portrait box on desktop and mobile. The placeholder sentence and obsolete centered placeholder logo were removed because the photo already carries the approved bottom-right 3kee watermark. The existing `01`, bottom caption and side label remain above the image.
- The source, local approved archive and website asset were SHA-256 checked and match exactly. Build and lint pass; only the existing non-blocking JavaScript chunk-size notice remains. No auth, email, database, admin or settings files changed.
- Claude Code's concurrent emailed-code work is recorded above and uses separate account files. The working tree and recent commits were rechecked before this completion update.

## Owners manage owners — 2026-10-24 (Claude Code)

- User request: owners add and remove owners themselves, without an agent or SQL.
- Admin page section "Owners" (`app/src/admin/OwnerManager.jsx`, wired in `AdminPanel.jsx`, styles in `AdminPanel.css`), shown only in an online owner session: lists owners (email, since when, "You"), adds an owner by the email of an existing 3kee account (the person first creates a client account on the site), removes another owner after a confirm step (their client account stays).
- Database: `supabase/migrations/20261024053709_studio_owner_management.sql`. The Supabase MCP declined `apply_migration` for it, so the user ran the SQL by hand in the SQL editor on 2026-10-24 ("Success"); the file uses `create or replace`, so the GitHub integration re-running it on push is harmless and records the version. Four `security definer` functions (`is_studio_owner`, `list_studio_owners`, `add_studio_owner`, `remove_studio_owner`) with `search_path = ''`, executable by `authenticated` only; each starts with an owner check; add finds existing `auth.users` by case/space-insensitive email (`no_account` otherwise); remove refuses the caller's own id, so at least one owner always remains. App users still cannot write `studio_admins` directly.
- Checked: functions exist with security definer, empty search_path, anon cannot execute (REST call as a visitor returns 42501 permission denied), authenticated can. `get_advisors` lists the four under "signed-in users can execute SECURITY DEFINER function": intended, because each function checks ownership itself. Build and lint pass.
- Not yet checked: the Owners screen with a real owner sign-in (agents cannot enter the owner password); the user is asked to try adding and removing an owner. Supersedes the AGENTS.md line "add them by SQL only" for day-to-day use.

## Email delivery repaired and templates verified — 2026-10-25 (ChatGPT)

- Root cause of the missing six-digit code and failed owner reset was confirmed in Supabase Auth logs: the old Gmail SMTP connection was rejected with `535 5.7.8 Username and Password not accepted`. Supabase Auth now uses the existing verified 3kee Resend domain through custom SMTP (`contact@3kee.site`, sender name 3kee). A new sending-only Resend key restricted to `3kee.site` was created for this connection and stored only in Supabase's encrypted SMTP field; no key or password was written to the repository or project notes.
- Live delivery was checked on 2026-10-25. A six-digit OTP request for an existing account and a password-reset request for an existing owner both returned 200 in Supabase Auth and appeared as **Delivered** in Resend with the subjects "Your 3kee code" and "Reset your 3kee password". The address shown in the user's failed-reset screenshot is not a registered Supabase account; Supabase deliberately returns success without sending for unknown addresses, so the owner must enter the email used by their real 3kee account.
- All six live Auth action templates were opened in the Supabase dashboard and searched in their saved source: confirm signup, invite, change email and reset contain one `{{ .ConfirmationURL }}` each; OTP and reauthentication contain one `{{ .Token }}` each. Password-changed and email-address-changed notifications are enabled and use the 3kee-branded source. Site URL is `https://3kee.site/` and the redirect allow-list includes `https://3kee.site/**`, so the owner reset returns to `#admin`.
- The generated website email set was rebuilt and checked against the published copies. Claude's newer booking backend now sends request, owner alert, confirmation, decline, cancellation and moved-appointment emails through Resend; welcome remains in `send-email`. The morning reminder and next-day review request still need the scheduled-message phase before they send automatically. `emails/README.md` now documents the Resend SMTP configuration and the current booking triggers instead of the obsolete Gmail setup.
- Verification: `node emails/build.mjs` rebuilt 18 previews and 10 published website templates; every published file byte-matched both its generated source and the copy currently served by `3kee.site`. The current app passes `npm run build` and `npm run lint`; only the known non-blocking bundle-size warning remains.

## Full product plan and build phases — 2026-10-25 (Claude Code)

- User request: build the whole booking side now (real bookings, client dashboard with history, admin client management with as much client information as possible, review moderation with approve/reject/delete, reviews page when there are many, WhatsApp notifications), then finish with the owner's real content, all email templates and a consistency check. Source of truth for the flows: `docs/workflows.html` (also published privately to the user as a Claude artifact). It follows the approved design boards 05 (Client Account & History), 06 (Admin Dashboard) and 07 (WhatsApp, Reviews & Reminders).
- Defaults chosen so building can start (user can change any): sign in to book; Google sign-up then name/password as today; online cancel until 3 h before; missed visits counted and flagged after 2 in 90 days, no block; reminder at 08:00 Africa/Algiers on the appointment day, email automatic and WhatsApp through owner tap-to-send links (no paid WhatsApp API); notes editable until confirmed; client "Remove" hides history for the client only (Deleted tab, restorable); unanswered requests expire at their start time; at least 1 h notice; at most 2 active requests/appointments per client; 15-minute slot grid inside working hours (as the preview).
- Left out on purpose (cost): WhatsApp-code sign-in and SMS fallback from board 05.
- Phases: 1 real bookings + admin requests + walk-ins + private location (in progress, Claude); 2 client dashboard; 3 clients section + today's chair; 4 reviews; 5 automatic messages (pg_cron + Edge Function) and WhatsApp links; 6 owner content, email audit, consistency check. Promotions, more barbers, waitlist, Arabic/French come after.
- Architecture for phase 1 (Claude): new tables `bookings`, `client_profiles`, `client_owner_notes`, `reviews`, `studio_private` with RLS (clients read their own rows, owners read all; no direct writes from browsers except own profile and owner notes). All booking changes go through a new Edge Function `bookings` (service role) that re-validates against `studio_settings`, prevents overlaps (exclusion constraint), and sends emails via Resend. ChatGPT: please avoid `supabase/functions/bookings`, `app/src/booking/`, `app/src/admin/` and new migrations while this entry says phase 1 is in progress; email template changes in `emails/build.mjs` should be coordinated here (Claude will add booking templates: declined, owner alerts).

## Phase 1 real bookings — 2026-10-25 (Claude Code)

- Database (migration `20261024233323_bookings_core`, applied through the MCP): `bookings` (code SKB-####, client snapshot, service and add-on snapshot with prices, preferences, notes, reminder channel, total, minutes, starts/ends, status requested/confirmed/declined/cancelled/completed/no_show/expired, source website/walk_in, cancelled_by, client_hidden, `emails` sent-log), `client_profiles` (phone, reminder channel, email notifications, rebook nudges), `client_owner_notes`, `reviews`, `studio_private` (location link and note). RLS: clients read their own bookings/reviews and manage their own profile; owners read everything and manage notes and studio details; no other browser writes. Exclusion constraint `bookings_no_overlap` refuses overlapping requested/confirmed bookings (tested in a rolled-back block: back-to-back and cancelled allowed, overlap refused).
- Edge Function `supabase/functions/bookings/index.ts` (deployed with the MCP, verify_jwt false, checks tokens itself). Actions: `busy` (public, taken intervals only), client `create`, `cancel` (confirmed until 3 h before), `reschedule` (back to requested), `edit` (notes/preferences while requested), `hide` (history), `location` (confirmed only); owner `owner_update` (confirm/decline/cancel/complete/no_show), `owner_move`, `walk_in`. Prices and minutes come from `studio_settings`; client times must be inside working hours, within 14 days, at least 1 h ahead; max 2 live bookings per client. Emails through Resend: booking-received, owner-new-request (to every owner), booking-confirmed (with the private location link, or a WhatsApp link asking for it), booking-declined, booking-cancelled, owner-cancelled, booking-changed. Each kind is sent once per booking (`emails` log).
- Email templates: `emails/build.mjs` gained booking-declined, owner-new-request, owner-cancelled, and a Booking code row on received/confirmed.
- Website: `BookingFlow.jsx` sends real requests (busy times hidden, WhatsApp number required, "Sign in to send" keeps the choices in `sessionStorage` through sign-in, including the Google redirect, via `booking/bookingDraft.js`; App reopens the booking at Review afterwards). Preview banner and preview wording removed. `lib/bookingsApi.js` maps every server error code to a plain message.
- Admin: new sections Appointments (`admin/AppointmentsManager.jsx`: requests waiting with Accept/Decline, to close with Done/Missed, upcoming by day with Move/Cancel, last 14 days, walk-in form, WhatsApp tap-to-send Confirmation/Reminder/Location links) and Studio details (`admin/StudioDetails.jsx`, private map link and note). Owner sessions open on Appointments.
- Checked: build and lint pass; headless browser test 7/7 (busy times requested, review needs WhatsApp number, signed-out "Sign in to send" opens the account window and keeps the draft); function refuses unsigned callers. Not yet checked end to end with a real client and owner (agents cannot sign in to real accounts): the user must send a request from a client account and answer it in the admin page.
- Next: phase 2 client dashboard (Claude).

## Phase 2 client dashboard — 2026-10-25 (Claude Code)

- Full-screen My account page at `#account` (`app/src/auth/AccountPage.jsx` + `.css`, following design board 05): "Salam, name", client since, Visits and Usual cut, Book again; upcoming card(s) with code, status, Reschedule (free times from the `busy` action, back to review), Cancel (confirmed: until 3 h before; otherwise WhatsApp), WhatsApp link prefilled with the code, reminder checklist from the booking's `emails` log, View location (confirmed only, through the `location` action); History tabs Completed / Cancelled (declined, missed, expired, cancelled) / Deleted with Remove and Restore; Profile & notifications (WhatsApp number, reminder channel, email notifications, rebook nudges) saved straight to `client_profiles`; sign-in box with change password and sign out.
- Wiring: the header Account button opens `#account` for signed-in clients with a finished profile (the small window stays for signing in); the booking success screen's "See my appointments" goes there; the small window's signed-in view has "Open my account".
- Checked: build and lint pass; headless test 5/5 for the signed-out page (opens at #account, asks to sign in, Sign in opens the window, Home closes it). The signed-in dashboard needs a real client account to check; not yet seen with real data.
- Not built yet from board 05: message inbox (left out), review button (phase 4), delete account (later).

## Homepage content and owner state — 2026-10-25 (Claude Code)

- Brand story placeholder replaced with Skee's own words exactly as the user supplied them (two paragraphs, casual spelling kept on purpose; offer a tidied version only if asked). The existing "The room is quiet…" paragraph stays after it.
- Hero "Next opening" now computed from the saved working hours in M'Sila time (`nextOpening` in `app/src/settings/studioSettings.js`, refreshed every minute): "Open now · until …", "Today · back at …" during the break, "Today · 10:00", "Tomorrow · 10:00" or the weekday. Tested with six times.
- Remaining homepage placeholders: the three review cards (filled by approved reviews in phase 4).
- Owner state on 2026-10-25: `studio_admins` is empty (both earlier owner accounts were deleted by the user); only one account exists (the user's own, Google, not an owner). The admin page is unreachable until an owner is added by SQL (Owners section needs an existing owner). The user asked for a second owner account; agents must not create accounts or set passwords: the person signs up on the site themselves, then an owner row is added.
- Same day, at the user's request: the user's own remaining account (Google sign-in, finished profile with a password) was added to `studio_admins` by SQL. One owner now; the second person signs up on the site and is then added in admin → Owners.

## Fixes and WhatsApp number — 2026-10-25 (Claude Code)

- Bug fixed: admin Accept/Decline/Cancel/Done/Missed failed with "Something went wrong". The page sent `{ action: 'owner_update', ...{ action: 'confirm' } }`, so the job name was overwritten and the function answered 400 unknown_action. The owner change is now sent as `move` (`body.move` in the function), and `callBookings` puts `action` last so a body field can never replace it. Function redeployed (version 2).
- WhatsApp numbers: fixed +213 prefix box (`app/src/lib/PhoneField.jsx`), shared rule in `app/src/lib/phone.js` and the function's `cleanPhone`: Algerian mobiles (5/6/7) with or without the first 0, +213 or 00213, all stored as `+213XXXXXXXXX` (11 formats tested). Used in booking review, My account and walk-in.
- WhatsApp verification: user wants it automatic. Proposed free design (not built, waiting for the user): the client taps "Verify on WhatsApp", sends a prefilled code message to the business number; Meta's WhatsApp Cloud API webhook (Edge Function) matches code + sender and marks the number verified. Inbound messages and replies within 24 h are free; business-initiated templates (codes, reminders) are paid per message. Needs a Meta Business account, a WhatsApp Cloud API app and a number not active in the normal WhatsApp app. Unofficial WhatsApp Web automation services were rejected (against WhatsApp's terms, ban risk).

## Notification switches — 2026-10-25 (Claude Code)

- User wants everything free and no future risk, and asked for owner switches to turn notifications off. Migration `20261025012606_notification_switches` (applied with the MCP) adds `client_emails`, `owner_alerts` (default on) and `whatsapp_verification` (default off) to `studio_private`. Admin section Notifications (`app/src/admin/NotificationSettings.jsx`) shows the three switches; WhatsApp verification is locked ("Not set up") until a WhatsApp connection exists.
- Both functions read the switches before sending: `bookings` (version 3: `notifyClient` checks client_emails, `notifyOwners` checks owner_alerts) and `send-email` (version 2: welcome email checks client_emails). Account emails sent by Supabase Auth (codes, resets) cannot be switched off.
- WhatsApp decision pending with the user: free inbound verification through Meta's WhatsApp Cloud API (needs a separate business SIM and a Meta Business account; inbound and replies within 24 h are free) versus no WhatsApp verification. Must stay free; any business-initiated WhatsApp message would cost money, so reminders stay email plus the owner's tap-to-send links.

## WhatsApp system and cut photos — 2026-10-25 (Claude Code)

- Database: migration `20261025015054_whatsapp_and_cut_photos` (the MCP declined it; the user ran it in the SQL editor with "Success"; written to be re-runnable for the GitHub integration). Tables `whatsapp_config` (owners read; display number, phone number ID, WABA ID, owner alert number, webhook verify token, last check), `whatsapp_secrets` (access token, app secret; no browser role can read or write), `whatsapp_verifications` (codes, 30 min); `studio_private.whatsapp_messages` (paid automatic messages, default off); `client_profiles.phone_verified_at` (clients have column grants only for user_id/phone/reminder_channel/email_notifications/rebook_nudges/updated_at; a trigger clears verification when the phone changes). Storage bucket `cut-photos` (public read, owner insert/update/delete/select, WebP/JPEG up to 1 MB). Checked afterwards: tables, columns, bucket and 4 policies exist; browsers cannot read secrets or set phone_verified_at.
- Edge Function `whatsapp` (new, verify_jwt false): GET webhook verification; POST signed by Meta (HMAC with the app secret) for incoming messages: a 6-digit code from the matching number marks `phone_verified_at` and replies "verified" (free inbound/24 h service replies); website actions `enabled`, `status`, `start` (client), `owner_status`, `owner_save` (token and app secret write-only), `owner_check` (Graph API number lookup), `owner_templates` (create/check 8 utility templates). Graph API version v22.0.
- `bookings` function version 4: `notifyClient` sends email (client_emails switch) and, when `whatsapp_messages` is on and the client chose WhatsApp, the matching template; `notifyOwners` also messages `owner_alert_number`. Each kind logged once in `bookings.emails` (`wa_` prefix for WhatsApp).
- Admin: section WhatsApp (`admin/WhatsAppSettings.jsx`: two switches, locked until connected / templates approved; connection form; copyable webhook URL and verify token; templates list; 10-step set-up guide for a non-programmer). Notifications now has only the two email switches. Client: `auth/WhatsAppVerify.jsx` in My account (under the number) and on the booking success screen, shown only when verification is on and connected.
- Cut photos: `services[].photos` (up to 8 bucket URLs, validated in `validateSettings`); admin upload per cut (`admin/CutPhotosEditor.jsx`, shrinks to 1400 px WebP/JPEG in the browser); `booking/CutPhotos.jsx`: hover/focus overlay cycling photos on homepage cards and booking step 1, a "Photos" button opening a viewer on touch screens. Orphaned files after "Remove" are not deleted from storage yet.
- Checked: build and lint pass; homepage grid unchanged (6 cards, same size). Not yet checked with a real photo or a real Meta connection.

## Usernames and the names note — 2026-10-25 (Claude Code)

- Finish-account form: a note above the names ("Note: Please enter your official first and last names so Skee can get to know you properly.") and an optional Username field; empty → created from the names (e.g. said.ladjelat, with digits if taken).
- Sign in with email, username or Google: the sign-in box says "Email or username". A username goes to the new Edge Function `account` (`supabase/functions/account/index.ts`, verify_jwt false), which looks up the account, signs in server-side and returns the session tokens; the email behind a username is never sent to the browser; unknown usernames and wrong passwords get the same answer; 5 failed attempts per username in 15 minutes → "too many attempts" (`login_attempts` table). "Email me a code" still needs an email.
- Database: migration `20261025020514_client_usernames` (applied with the MCP): `client_profiles.username` (unique, lowercase, 3–30 of a-z 0-9 . _, starts/ends alphanumeric; reserved words blocked in the function), `login_attempts` (no browser access). Clients cannot write `username` directly (no column grant); only the `account` function sets it (`set_username`, `check_username`).
- My account: Sign-in box shows the username with Change / Choose one.
- Checked: function refuses an unknown username with `wrong_login` five times, then `too_many_attempts`; headless test 4/4 (label, refusal message, forgot panel, code needs email). Build and lint pass. The owner login page (`#admin`) still uses email only.

## Profile completeness and client photos — 2026-10-25 (Claude Code)

- Migration `20261025021743_client_profile_photos` (declined through the MCP; run by the user in the SQL editor, "Success"; re-runnable): `client_profiles.avatar_path` (client column grant; insert/update policies require the path to sit in the client's own folder), `reviews.show_photo` (default false: other visitors see a reviewer's photo only if the client chooses; owners always can), private bucket `client-photos` (folder = user id; clients manage their own files; clients and owners can view; signed URLs). Checked afterwards: columns, private bucket, 4 storage policies, clients still cannot set `phone_verified_at`.
- Completeness (`auth/useClientProfile.js`): account 50 %, username 10 %, WhatsApp number 20 % (10 + 10 for verified while verification is on), photo 20 %. A new client is about 60 %, 80 % after the first booking. Changes call `announceProfileChange()` so every view refreshes.
- Nudges (`auth/ProfileNudge.jsx`, "Later" hides for 3 days in localStorage): account window after sign-up, booking review step (photo step only) and booking success screen (banner), My account (always, with a Profile photo box `auth/ProfilePhoto.jsx`; upload helper `auth/profilePhotoUpload.js` crops to a square, 800 px WebP/JPEG), gold dot on the header Account button while under 100 %. The nudges do not say why the photo is wanted (user's request); the privacy notice states the purpose, as law 18-07 requires.
- Admin Appointments cards show the client's photo (signed links) or their initial.
- Privacy notice updated to 25 October 2026 (PRIVACY_VERSION 2026-10-25): username, booking data and history, WhatsApp verification message, optional profile photo and its purpose, no automated face recognition, Resend and Meta (WhatsApp) as processors; the old "online bookings are not stored yet" line removed.
- Checked: build and lint pass; headless test 4/4 (privacy content, no dot when signed out); security advisors only list intended items. Not yet checked with a real signed-in client upload.
- Phase 4 must add the review form's choice "Show my photo with my review" (stored in `reviews.show_photo`, default hidden).

## Account avatar in every header — 2026-10-25 (Claude Code)

- `app/src/auth/HeaderAvatar.jsx`: the signed-in person's photo (signed link) or initial, gold ring while the profile is under 100 %, "Signed in as …" title and screen-reader text. Shown in the homepage header inside the Account button (replaces the gold dot), as its own button next to the menu on phones (the phone menu says "My account" when signed in), in the booking header, the My account header and the privacy page header. The admin header shows the signed-in owner (photo or initial, first name, email) instead of the fixed "S · Said" badge, which stays only for the local preview without Supabase.
- Checked with a fake, invalid local session in a headless browser: desktop, booking, account and privacy headers show the avatar; at 390 px the avatar sits between the logo and the menu button without overlap. My account no longer shows "client since Invalid Date" when a session lacks a creation date.
- Testing note: another dev server listens on 127.0.0.1:5174 on this Mac; run `vite preview --host 127.0.0.1` on another port for production-build tests.

## Offers above the menu — 2026-10-27 (Claude Code)

- User request: up to three flash deals shown above the service cards, widths tied to the menu below, as interactive as possible, with an admin section to manage them; nothing changes on the homepage when there is no offer.
- No migration needed: offers live in `studio_settings.payload.offers` (validated in `app/src/settings/studioSettings.js`, max 3) and their photos reuse the public `cut-photos` bucket under an `offers/<id>/` folder, which the existing owner-only storage policies already cover.
- Offer shape: `{ id, label, name, description, serviceId, photos[<=5], oldPrice, newPrice, endsAt, visible }`. `endsAt` is a local `YYYY-MM-DDTHH:mm` read as Africa/Algiers (+01:00); an offer hides itself once it passes. The offer price must be below the usual price.
- Homepage (`app/src/offers/OffersStrip.jsx` + `.css`, helpers in `offers.js`): a six-column grid so one offer spans the full menu width, two take a card and a half each, three sit one above each cut card (measured exactly: 1245 / 611 / 399 px against 399 px cards). Interaction: pointer-following gold pool, one sheen sweep on hover, lift and gold border, staggered entry, slow Ken Burns on photos, cross-fade with tappable progress bars (paused while hovered), live countdown that steps from days to seconds, −% badge, struck old price. With no photo the card generates its own drifting gold weave, a diagonal hairline texture and a huge ghost percentage numeral. Whole card opens booking (the linked cut if one is chosen). Full `prefers-reduced-motion` fallback.
- Admin section "Offers" (`app/src/admin/OffersEditor.jsx`, in `SECTIONS` so it saves with "Save all changes"): tag, title, linked cut, description, usual/offer price, end time, up to 5 photos (owners only), visible toggle, delete; the add button stops at three; a note states which layout the current number of offers produces. `CutPhotosEditor` gained `folder`, `max`, `title` and `hint` props so offers reuse it.
- Second pass the same day (user request): the card now **opens on a tap** instead of going straight to booking. Collapsed it shows the usual price, the offer price and "See the deal"; open it adds a receipt of the offer's items with their own prices, a "Usual total / Offer price" line, and two buttons — **Book now** (opens the booking flow, at the linked cut if one is set) and **Choose cut**, which opens an album of every visible cut as small boxes with photo, name, description and length; each one opens booking at that cut. Tapping any empty space inside the open card closes it. Both panels animate with `grid-template-rows: 0fr → 1fr`, so no height is hard-coded.
- Touch: the gold pool now lights under a held finger and follows it (`pointerdown`/`pointermove` with `pointerType !== 'mouse'` sets `.is-lit`; released on `pointerup`/`pointercancel`/`pointerleave`). `.offer-hit` moved to z-index 1, behind `.offer-body`, so the buttons inside an open card are reachable while empty space still closes it.
- An open offer that has a photo blurs it **progressively from the bottom up** (`.offer-blur`, four stacked `backdrop-filter` layers, each masked to begin lower than the last: 2/5/10/18 px), so the item list and buttons stay readable; the scrim over a photo eases off because the blur now does that work. The radius rides in a `--r` custom property and the layers transition that, not opacity, because an opacity on the parent would create a backdrop root and kill the effect.
- **Two CSS build traps found here, worth remembering:** the minifier rewrites a literal `blur(0)` to the invalid `blur()` (the whole declaration is then dropped), and where a prefixed and a standard property both appear it keeps only the **last** one — so `-webkit-backdrop-filter` must be written *before* `backdrop-filter`, or the standard property disappears and the effect dies in Chrome.
- Offer photos keep a longer side of 2200 px (`maxSide` prop on `CutPhotosEditor`; cuts stay at 1400) so the full-width banner stays sharp; the 1 MB bucket limit still applies, with the existing WebP → JPEG fallback.
- Third pass (user request): an offer now carries **real add-ons** — `addons: [{ addonId, typeId }]`, ticked in admin from the live menu (checkbox per add-on group, then a radio for the exact type, first one preselected) and validated against the menu so a deleted add-on cannot linger. `offerLines()` resolves them for display with current menu prices, followed by any manual `items`. Admin shows the running total (base cut + ticked add-ons + lines) and flags it when it disagrees with the usual price.
- The cuts album is now a **chooser, not a shortcut**: tapping a cut selects it, folds the album away and unlocks **Book now**, which is disabled until then (or immediately enabled if the admin set a cut on the offer). Book now calls `onBook({ serviceId, addons, step: 2 })`, so `BookingFlow` opens at **Date & time** with the cut and add-ons already applied — the client never re-picks what the deal already decided. `BookingFlow` gained `initialAddons` and `initialStep`; the progress bar still lets them step back to change anything.
- Offer manual items: `items: [{ id, name, price }]` (max 8) in the offer, edited in admin with name + price rows, "+ Add item" and a note when the lines do not add up to the usual price.
- **Known gap, stated in the admin page:** the offer price is display only — the `bookings` Edge Function still charges 800 DA plus add-ons. Connecting a discount to the booking total needs a change there (it never trusts browser prices). Left undone because the Supabase connector was unavailable in this session; the user was told.
- Checked in a headless browser against a production build: widths and position for 1/2/3 offers, countdown and badge text, strip absent with no offers, photos filling the card, phone width stacking with no sideways scroll, and the admin section (fields, three-offer limit, warnings). Build and lint clean.
- Testing note: a build without `app/.env.local` runs the site from localStorage only, which is how offers were injected for these tests.

## Working continuity

Two AI agents work on this project on this Mac: ChatGPT (desktop Work/Codex) and Claude Code (VS Code extension). Both edit this same local application and share memory only through `AGENTS.md` and this file. Do not replace the project with a different site builder. Maintain this file incrementally after meaningful milestones, record unfinished work before stopping, and update AGENTS.md when persistent rules change.

This document should be updated after meaningful milestones or when project decisions materially change.
