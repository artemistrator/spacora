import { useState, useEffect, useCallback } from 'react'
import { useSupabaseAuth } from '@/lib/auth'

interface Post {
  id: string
  title: string
  content: string
  space_id: string
  folder_id: string | null
  created_at: string
  updated_at: string
  likes_count: number
  comments_count: number
  favorites_count: number
  images: string[]
  spaceName?: string
  spaceAvatarUrl?: string
}

export function usePosts() {
  const { getSupabaseWithSession } = useSupabaseAuth()
  const [posts, setPosts] = useState<Post[]>([])

  const fetchPostWithSpace = useCallback(async (postId: string) => {
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      const { data, error } = await supabaseClient
        .from('posts')
        .select(`
          *,
          spaces (id, name, avatar_url)
        `)
        .eq('id', postId)
        .maybeSingle() // Changed from .single() to .maybeSingle()

      if (error) throw error
      
      // If no data found, return null
      if (!data) return null
      
      // Transform the data to match the expected format
      return {
        ...data,
        spaceName: data.spaces?.name || 'Unknown Space',
        spaceAvatarUrl: data.spaces?.avatar_url || null
      }
    } catch (error) {
      console.error('Error fetching post with space:', error)
      return null
    }
  }, [getSupabaseWithSession])

  return { posts, setPosts, fetchPostWithSpace }
}
