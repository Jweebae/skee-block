import { dayLabel } from '../lib/bookingsApi'

// A published review. The photo appears only when the client chose to show it.
function Stars({ rating }) {
  return <div role="img" aria-label={`${rating} out of 5`} className="review-stars">{[1, 2, 3, 4, 5].map(value => <span key={value} className={value > rating ? 'review-star-empty' : undefined} aria-hidden="true">★</span>)}</div>
}

export default function ReviewCards({ reviews }) {
  return reviews.map(review => <figure key={review.id} className="card review-card">
    <Stars rating={review.rating} />
    <blockquote className="serif review-quote">“{review.body}”</blockquote>
    {review.reply && <p className="review-reply"><span>Skee replied</span>{review.reply}</p>}
    <figcaption className="card-bottomline">
      <span className="review-author">{review.photo && <img src={review.photo} alt="" loading="lazy" />}<span className="text-caption">{review.display_name}</span></span>
      <span className="lbl">{review.service_name} · verified</span>
    </figcaption>
    <span className="visually-hidden">Published {dayLabel(review.published_at, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
  </figure>)
}
