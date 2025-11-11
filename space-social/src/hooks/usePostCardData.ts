'use client'

import { useQuery } from '@tanstack/react-query'
import { useSupabaseAuth } from '@/lib/auth'

export interface PostCardData {
  space: any
  isSubscribed: boolean
  isLiked: boolean
  isFavorited: boolean
  commentsCount: number
  folderName?: string
  hashtags?: string[]
}

export function usePostCardData(post: any) {
  const { userId } = useSupabaseAuth()
  const { getSupabaseWithSession } = useSupabaseAuth()
  
  // First query: Get user's owned space ID (cached for 10 minutes)
  const { data: ownedSpaceId } = useQuery({
    queryKey: ['user-owned-space', userId],
    queryFn: async () => {
      if (!userId) return null
      const supabase = await getSupabaseWithSession()
      const { data } = await supabase
        .from('spaces')
        .select('id')
        .eq('owner_id', userId)
        .limit(1)
        .maybeSingle()
      return data?.id || null
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!userId,
  })
  
  // Main post card data query
  return useQuery({
    queryKey: ['post-card', post.id, userId, ownedSpaceId],
    queryFn: async (): Promise<PostCardData> => {
      const supabase = await getSupabaseWithSession()

      // Fetch space data
      const { data: spaceData, error: spaceError } = await supabase
        .from('spaces')
        .select('*')
        .eq('id', post.space_id)
        .single()

      if (spaceError) throw spaceError

      // Check subscription
      let isSubscribed = false
      if (userId) {
        const { data: subscriptionData } = await supabase
          .from('user_spaces')
          .select('id')
          .eq('clerk_id', userId)
          .eq('space_id', post.space_id)
          .maybeSingle()
        
        isSubscribed = !!subscriptionData
      }

      // Get folder name if exists
      let folderName: string | undefined
      if (post.folder_id) {
        const { data: folderData } = await supabase
          .from('folders')
          .select('name')
          .eq('id', post.folder_id)
          .maybeSingle()
        
        folderName = folderData?.name
      }

      // Get hashtags
      let hashtags: string[] = []
      const { data: hashtagsData } = await supabase
        .from('post_hashtags')
        .select('hashtags(name)')
        .eq('post_id', post.id)

      if (hashtagsData) {
        hashtags = hashtagsData
          .map((item: any) => item.hashtags?.name)
          .filter(Boolean)
      }

      // Check likes and favorites (uses cached ownedSpaceId)
      let isLiked = false
      let isFavorited = false

      if (ownedSpaceId) {
        const { data: likeData } = await supabase
          .from('post_reactions')
          .select('id')
          .eq('post_id', post.id)
          .eq('space_id', ownedSpaceId)
          .eq('reaction_type', 'like')
          .maybeSingle()
        
        isLiked = !!likeData

        const { data: favoriteData } = await supabase
          .from('favorites')
          .select('id')
          .eq('space_id', ownedSpaceId)
          .eq('post_id', post.id)
          .maybeSingle()
        
        isFavorited = !!favoriteData
      }

      // Get comments count
      const { data: commentsData = [] } = await supabase
        .from('post_comments')
        .select('id')
        .eq('post_id', post.id)

      return {
        space: spaceData,
        isSubscribed,
        isLiked,
        isFavorited,
        commentsCount: commentsData?.length || 0,
        folderName,
        hashtags,
      }
    },
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    enabled: !!ownedSpaceId !== undefined,
  })
}
