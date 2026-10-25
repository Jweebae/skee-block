import { supabase } from '../lib/supabase'
import { announceProfileChange } from './useClientProfile'

// A client's profile photo: cropped to a square, shrunk to 800 px in the browser and stored in their own
// folder of the private client-photos bucket.
const SIDE = 800

async function squareImage(file) {
  const bitmap = await createImageBitmap(file)
  const crop = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = Math.min(SIDE, crop)
  canvas.getContext('2d').drawImage(bitmap, (bitmap.width - crop) / 2, (bitmap.height - crop) / 2, crop, crop, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()
  const encode = (type, quality) => new Promise(resolve => canvas.toBlob(resolve, type, quality))
  let blob = await encode('image/webp', 0.82)
  if (!blob || blob.type !== 'image/webp') blob = await encode('image/jpeg', 0.85)
  return blob
}

export async function uploadProfilePhoto(userId, file, oldPath) {
  const blob = await squareImage(file)
  const path = `${userId}/${crypto.randomUUID()}.${blob.type === 'image/webp' ? 'webp' : 'jpg'}`
  const uploaded = await supabase.storage.from('client-photos').upload(path, blob, { contentType: blob.type, upsert: false })
  if (uploaded.error) throw new Error('The photo could not be uploaded. Try another photo or check your connection.')
  const saved = await supabase.from('client_profiles').upsert({ user_id: userId, avatar_path: path, updated_at: new Date().toISOString() })
  if (saved.error) throw new Error('The photo could not be saved. Try again.')
  if (oldPath) await supabase.storage.from('client-photos').remove([oldPath])
  announceProfileChange()
  return path
}

