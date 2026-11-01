import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { callBookings } from '../lib/bookingsApi'
import { fetchAll } from '../lib/fetchAll'

// Everything behind the Clients, Debts and Money sections. Owner-only tables, protected by row level security.
async function loadStudioBook() {
  const [bookings, payments, debts, entries, profiles, cards, gifts, clients] = await Promise.all([
    fetchAll(() => supabase.from('bookings').select('*').order('starts_at', { ascending: false }).order('id')),
    fetchAll(() => supabase.from('visit_payments').select('*').order('booking_id')),
    fetchAll(() => supabase.from('client_debts').select('*').order('created_on', { ascending: false }).order('id')),
    fetchAll(() => supabase.from('money_entries').select('*').order('entry_date', { ascending: false }).order('id')),
    fetchAll(() => supabase.from('client_profiles').select('*').order('user_id')),
    fetchAll(() => supabase.from('client_cards').select('*').order('client_key')),
    fetchAll(() => supabase.from('client_gifts').select('*').order('created_at', { ascending: false }).order('id')),
    callBookings('owner_clients'),
  ])
  const paths = profiles.map(row => row.avatar_path).filter(Boolean)
  const { data: links } = paths.length ? await supabase.storage.from('client-photos').createSignedUrls(paths, 3600) : { data: [] }
  const photos = Object.fromEntries(paths.map((path, index) => [path, links?.[index]?.signedUrl]))
  return { bookings, payments, debts, entries, profiles, cards, gifts, accounts: clients.accounts, photos, now: Date.now() }
}

export default function useStudioBook() {
  const [state, setState] = useState({ data: null, error: '' })
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let active = true
    loadStudioBook()
      .then(data => { if (active) setState({ data, error: '' }) })
      .catch(() => { if (active) setState(current => ({ ...current, error: 'Your studio book could not be loaded. Check your connection and try again.' })) })
    return () => { active = false }
  }, [version])
  return { ...state, reload: () => setVersion(value => value + 1) }
}
