import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://tbtmfwjphcbxkamszspa.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidG1md2pwaGNieGthbXN6c3BhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MTQ2NjEsImV4cCI6MjEwMjM5MDY2MX0.85cPbQO3EL-7vy730rvXAKV7ObxDnytCOKD-u1d9ddg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
