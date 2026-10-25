// Algerian mobile numbers for WhatsApp. "0555 12 34 56", "555 12 34 56", "+213 555 12 34 56" and "00213555123456"
// all mean the same number and are stored as "+213555123456". The server applies the same rule.
export const DZ_PREFIX = '+213'

export function normalizeDzMobile(input) {
  let digits = String(input ?? '').replace(/\D/g, '')
  if (digits.startsWith('00213')) digits = digits.slice(5)
  else if (digits.startsWith('213') && digits.length > 10) digits = digits.slice(3)
  if (digits.startsWith('0')) digits = digits.slice(1)
  return /^[567]\d{8}$/.test(digits) ? `${DZ_PREFIX}${digits}` : null
}

// "+213555123456" → "555 12 34 56" for the box after the fixed +213.
export function localDzPart(stored) {
  const normalized = normalizeDzMobile(stored)
  if (!normalized) return String(stored ?? '').replace(/^\+?213\s?/, '')
  const d = normalized.slice(4)
  return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`
}

export const formatDzMobile = stored => normalizeDzMobile(stored) ? `${DZ_PREFIX} ${localDzPart(stored)}` : String(stored ?? '')

export const PHONE_HINT = 'Your Algerian mobile number, with or without the first 0: 0555 12 34 56 or 555 12 34 56.'
