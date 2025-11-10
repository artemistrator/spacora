import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single, consistent supabase client instance
// Since our RLS policies are properly configured, we can use the anon key for all operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// For operations that need to identify the user, we'll pass user info separately
// This avoids the Clerk JWT compatibility issues
export const createSupabaseClient = () => {
  return supabase
}

// Типы для TypeScript
export type Database = {
  public: {
    Tables: {
      spaces: {
        Row: {
          id: string
          name: string
          description: string | null
          space_type: 'apartment' | 'house' | 'studio' | 'loft' | 'room'
          avatar_url: string | null
          cover_url: string | null
          location: string | null
          is_public: boolean
          owner_id: string
          followers_count: number
          posts_count: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['spaces']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['spaces']['Insert']>
      }
      posts: {
        Row: {
          id: string
          space_id: string
          content: string | null
          images: string[]
          room_tag: 'kitchen' | 'bedroom' | 'living_room' | 'bathroom' | 'balcony' | 'study' | null
          style_tags: string[]
          likes_count: number
          comments_count: number
          shares_count: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['posts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['posts']['Insert']>
      }
      user_identities: {
        Row: {
          id: string
          clerk_id: string
          supabase_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_identities']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_identities']['Insert']>
      }
    }
  }
}
