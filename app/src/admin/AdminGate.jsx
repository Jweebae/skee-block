import AdminPanel from './AdminPanel'
import OwnerAccess from '../auth/OwnerAccess'
import useOwnerAuth from '../auth/useOwnerAuth'
import { sharedSettingsEnabled, configurationError } from '../lib/supabase'

// Without a Supabase project the admin stays the local preview; with one, only a signed-in owner reaches it.
export default function AdminGate({ settings, storageError, onSave }) {
  const auth = useOwnerAuth()
  if (!sharedSettingsEnabled) return <AdminPanel settings={settings} storageError={storageError} onSave={onSave} />
  if (configurationError) return <OwnerAccess auth={auth} setupError={configurationError} />
  if (auth.isOwner && !auth.needsPassword) return <AdminPanel settings={settings} storageError={storageError} onSave={onSave} owner={auth} />
  return <OwnerAccess auth={auth} />
}
