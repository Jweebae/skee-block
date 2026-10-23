import { useEffect, useState } from 'react'
import { readSettings, validateSettings, SETTINGS_KEY } from './studioSettings'
import { supabase } from '../lib/supabase'

function cacheLocally(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch { /* the cache is optional */ }
}

export default function useStudioSettings() {
  const [state, setState] = useState(readSettings)
  useEffect(() => {
    if (!supabase) return
    let active = true
    supabase.from('studio_settings').select('payload').eq('id', 'main').maybeSingle().then(({ data, error }) => {
      if (!active || error || !data) return
      try {
        const settings = validateSettings(data.payload)
        cacheLocally(settings)
        setState({ settings, error: '' })
      } catch {
        setState(current => ({ ...current, error: 'The shared studio settings could not be read. Showing the last settings available in this browser.' }))
      }
    })
    return () => { active = false }
  }, [])
  async function saveSettings(draft) {
    const settings = validateSettings(draft)
    if (supabase) {
      const { error } = await supabase.from('studio_settings').upsert({ id: 'main', payload: settings })
      if (error) throw new Error('The settings could not be saved online. Check that you are signed in as the owner and that you are connected, then try again. Your draft is still here.')
      cacheLocally(settings)
    } else {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
      } catch {
        throw new Error('This browser could not save the settings. Check storage permissions or available space, then try again. Your draft is still here.')
      }
    }
    setState({ settings, error: '' })
    return settings
  }
  return { ...state, saveSettings }
}
