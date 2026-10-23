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
- No `.git` repository was found in the active app or its parent workspace; GitHub deployment/repository configuration is not established by the local files.

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
- Homepage is ported from the approved desktop HTML export and adapted to the approved mobile home concept. A four-step booking preview and locally saved admin settings panel now exist; production business workflows remain pending.
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
- Supabase integration beyond owner access and studio settings (bookings, clients, reviews, reminders); owner sign-in and shared settings are built but await a real owner account (see Supabase backend milestone)
- Arabic translation, RTL layouts and finalized Arabic fonts
- Portrait/hero photo, approved review data, business hours, add-on prices and verified WhatsApp number

## Technology stack

- Frontend: React + Vite
- Styling: custom CSS and premium design system approach
- Database/auth: Supabase free tier requested, not integrated
- Hosting: GitHub hosting requested, not configured or verified deployed
- Messaging: WhatsApp Business for conversion
- Email: free or low-cost automation options considered
- Review workflow: admin approval model considered

## Current development milestone

Homepage, four-step booking preview and a locally persisted admin settings panel are implemented as of 2026-10-22. User explicitly requested keeping sample details and building admin controls next. Saved browser settings now drive the menu, booking preferences/pricing/durations, and weekly preview schedule. The latest extension adds card duplication/deletion and grouped add-ons with individually priced types. Secure multi-device business operations are not connected.

### Verification at this milestone

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
3. Review the local studio settings editor, then connect owner authentication and shared persistence. Retain editable sample details until the admin changes them.
4. Add admin and client management layers.
5. Connect persistence and business automation.

## Known limitations and unresolved issues

- The app has a homepage and interactive booking UI preview, not a production SaaS booking system.
- Desktop visual styles are directly ported; phone layout uses the approved mobile home board. The mobile concept does not specify every lower-page section, so those use a responsive adaptation of the desktop design. Final user visual review remains pending.
- No backend is connected yet.
- No service credentials were added in this milestone. No local Git repository was found; do not describe files as committed or synced.
- The project still requires implementation of the actual end-to-end barber workflow.

## Exact next recommended development step

Review the local admin settings editor at `#admin`: adding/duplicating/deleting cut cards, editing add-ons and their types, Save all changes, and the client add-on → type selection flow with correct pricing and duration. The user explicitly wants the sample details kept for now; do not require finalized names/prices/hours before continuing. Next connect secure owner authentication and shared settings persistence through the agreed Supabase free-tier architecture. Then add conflict-safe reservations and server-authoritative pricing. Keep private location behind real confirmation.

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
- Not built: client profile table, booking history, saved preferences, a privacy notice for client data (should exist before collecting real client data), email/password sign-up for clients.

## Working continuity

Two AI agents work on this project on this Mac: ChatGPT (desktop Work/Codex) and Claude Code (VS Code extension). Both edit this same local application and share memory only through `AGENTS.md` and this file. Do not replace the project with a different site builder. Maintain this file incrementally after meaningful milestones, record unfinished work before stopping, and update AGENTS.md when persistent rules change.

This document should be updated after meaningful milestones or when project decisions materially change.
