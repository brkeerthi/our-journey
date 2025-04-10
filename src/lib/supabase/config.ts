import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Memory = {
  id: string
  title: string
  description: string
  date: string
  media_urls: string[]
  audio_url?: string
  unlock_date?: string
  created_at: string
}

export type Media = {
  id: string
  memory_id: string
  type: 'image' | 'video' | 'audio'
  url: string
  created_at: string
} 