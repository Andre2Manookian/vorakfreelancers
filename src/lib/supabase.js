import { createClient } from '@supabase/supabase-js' 

const supabaseUrl = 'https://yvoyyyiuxecrlvnqdyzs.supabase.co' 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2b3l5eWl1eGVjcmx2bnFkeXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNTYzMDIsImV4cCI6MjA5MTkzMjMwMn0.G2Yw32UU_T1hGJQRtn2KzSsKyw-iT8mCHlOE4RL2C7M' 

export const supabase = createClient(supabaseUrl, supabaseKey, { 
  auth: { 
    persistSession: true, 
    autoRefreshToken: true, 
    detectSessionInUrl: true 
  } 
}) 
