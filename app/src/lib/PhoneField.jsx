import { DZ_PREFIX } from './phone'
import './PhoneField.css'

// A number box with a fixed +213 in front. The value is what the person typed; normalize it with normalizeDzMobile.
export default function PhoneField({ id, value, onChange, className = '', required = false, invalid = false }) {
  return <span className={`phone-field${invalid ? ' is-invalid' : ''}`}>
    <span className="phone-prefix" aria-hidden="true">{DZ_PREFIX}</span>
    <input id={id} className={className} type="tel" inputMode="tel" autoComplete="tel-national" maxLength={18} placeholder="555 12 34 56" required={required} aria-invalid={invalid || undefined} aria-describedby={id ? `${id}-hint` : undefined} value={value} onChange={event => onChange(event.target.value)} />
  </span>
}
