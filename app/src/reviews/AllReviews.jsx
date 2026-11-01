import { useEffect, useState } from 'react'
import logo from '../assets/skee-logo-white.svg'
import useReviews from './useReviews'
import ReviewCards from './ReviewCards'
import './Reviews.css'

const PER_PAGE = 12

export default function AllReviews() {
  const [page, setPage] = useState(0)
  const { reviews, total, average } = useReviews(PER_PAGE, page)
  useEffect(() => { window.scrollTo(0, 0) }, [page])
  const pages = Math.ceil(total / PER_PAGE)
  return <main className="reviews-page">
    <a className="review-page-brand" href="#reviews"><img src={logo} alt="SKEE" /><span>Back to the website</span></a>
    <header><span className="lbl">Word on the Block</span><h1 className="serif">Earned, not <em>bought</em>.</h1>{total > 0 && <p>{average.toFixed(1)} out of 5 from {total} verified {total === 1 ? 'client' : 'clients'}. Every review is approved before it appears.</p>}</header>
    {reviews === null ? <p className="reviews-page-note">Loading reviews…</p> : reviews.length ? <div className="reviews-page-grid"><ReviewCards reviews={reviews} /></div> : <p className="reviews-page-note">The first reviews will appear here soon.</p>}
    {pages > 1 && <nav className="reviews-paging" aria-label="Review pages"><button type="button" disabled={page === 0} onClick={() => setPage(value => value - 1)}>Newer</button><span>Page {page + 1} of {pages}</span><button type="button" disabled={page >= pages - 1} onClick={() => setPage(value => value + 1)}>Older</button></nav>}
  </main>
}
