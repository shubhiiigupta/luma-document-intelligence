import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

// Only public project settings belong in a browser bundle.
function initializeClient() {
  if (!url || !key || !key.startsWith('sb_publishable_') || key.includes('REPLACE_ME') || url.includes('YOUR-PROJECT')) return null
  try {
    const parsed = new URL(url)
    if (!['https:', 'http:'].includes(parsed.protocol)) return null
    return createClient(url, key)
  } catch { return null }
}

export const supabase = initializeClient()
