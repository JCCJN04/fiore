import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️ Supabase no configurado. Copia .env.example a .env y llena tus credenciales.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
