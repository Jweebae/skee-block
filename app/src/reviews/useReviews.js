import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { callBookings } from '../lib/bookingsApi'

// Published reviews come through the bookings function, which leaves out everything private about the client.
export default function useReviews(limit, page = 0) {
  const [state, setState] = useState({ reviews: null, total: 0, average: 0 })
  useEffect(() => {
    let active = true
    if (!supabase) return
    callBookings('reviews', { limit, page })
      .then(data => { if (active) setState(data) })
      .catch(() => { if (active) setState({ reviews: [], total: 0, average: 0 }) })
    return () => { active = false }
  }, [limit, page])
  return state
}
