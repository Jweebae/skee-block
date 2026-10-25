import { useEffect, useRef, useState } from 'react'
import './CutPhotos.css'

// Photos the owner added to a cut (admin → Cuts). On devices with a mouse they fade in over the card while it is
// hovered or focused, cycling through every photo; on touch screens a "Photos" button opens a full-screen viewer.
export function CutHoverPhotos({ photos, name }) {
  const ref = useRef(null)
  const [active, setActive] = useState(false)
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const card = ref.current?.parentElement
    if (!card) return
    const on = () => setActive(true)
    const off = () => { setActive(false); setIndex(0) }
    card.addEventListener('pointerenter', on); card.addEventListener('pointerleave', off)
    card.addEventListener('focusin', on); card.addEventListener('focusout', off)
    return () => { card.removeEventListener('pointerenter', on); card.removeEventListener('pointerleave', off); card.removeEventListener('focusin', on); card.removeEventListener('focusout', off) }
  }, [])
  useEffect(() => {
    if (!active || photos.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(() => setIndex(value => (value + 1) % photos.length), 1800)
    return () => clearInterval(timer)
  }, [active, photos.length])
  if (!photos?.length) return null
  return <span ref={ref} className={`cut-hover${active ? ' is-active' : ''}`} aria-hidden="true">
    {photos.map((src, i) => <img key={src} src={src} alt="" loading="lazy" decoding="async" className={i === index ? 'is-shown' : ''} />)}
    <span className="cut-hover-caption">{name}{photos.length > 1 ? ` · ${index + 1}/${photos.length}` : ''}</span>
  </span>
}

export function CutPhotosButton({ photos, name, className = '' }) {
  const dialog = useRef(null)
  const [index, setIndex] = useState(0)
  if (!photos?.length) return null
  const open = event => { event.preventDefault(); event.stopPropagation(); setIndex(0); dialog.current.showModal() }
  const step = (event, by) => { event.stopPropagation(); setIndex(value => (value + by + photos.length) % photos.length) }
  return <>
    <button type="button" className={`cut-photos-button ${className}`} onClick={open} aria-label={`See ${photos.length} photo${photos.length > 1 ? 's' : ''} of ${name}`}>Photos · {photos.length}</button>
    <dialog ref={dialog} className="cut-viewer" aria-label={`${name} photos`} onClick={event => { event.stopPropagation(); if (event.target === dialog.current) dialog.current.close() }}>
      <figure><img src={photos[index]} alt={`${name}, photo ${index + 1} of ${photos.length}`} /><figcaption>{name}{photos.length > 1 ? ` · ${index + 1}/${photos.length}` : ''}</figcaption></figure>
      {photos.length > 1 && <div className="cut-viewer-nav"><button type="button" onClick={event => step(event, -1)} aria-label="Previous photo">←</button><button type="button" onClick={event => step(event, 1)} aria-label="Next photo">→</button></div>}
      <button type="button" className="cut-viewer-close" aria-label="Close photos" onClick={event => { event.stopPropagation(); dialog.current.close() }}>×</button>
    </dialog>
  </>
}
