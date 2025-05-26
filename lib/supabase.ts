import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://afklxeaxdzypqxplbjzk.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFma2x4ZWF4ZHp5cHF4cGxianprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNTIxODQsImV4cCI6MjA1OTYyODE4NH0.lRpHfQiYt5MG-htHv2_m3ojVz0_yt7t9kpfDCKDr2Q8"

export { createClient }
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
