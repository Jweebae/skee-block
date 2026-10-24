const DRAFT_KEY = 'skee.booking-draft' // the visitor's own choices, kept while they sign in (may include a Google redirect)

export function readDraft() {
  try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY)) || null } catch { return null }
}
export function writeDraft(value) {
  try { if (value) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(value)); else sessionStorage.removeItem(DRAFT_KEY) } catch { /* the draft is optional */ }
}
export const hasPendingBooking = () => readDraft()?.resume === true
export const clearPendingBooking = () => writeDraft(null)
