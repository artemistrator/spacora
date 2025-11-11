'use client'

import { useQuery } from '@tanstack/react-query'
import { useSupabaseAuth } from '@/lib/auth'

export interface PostData {
  space: any
  isSubscribed: boolean
  isLiked: boolean
  isFavorited: boolean
  commentsCount: number
}

export function usePostsData(postIds: string[]) {
  const { userId, getSupabaseWithSession } = useSupabaseAuth()
  
  return useQuery({
    queryKey: ['posts-data', postIds, userId],
    queryFn: async (): Promise<Map<string, PostData>> => {
      if (postIds.length === 0) {
        return new Map()
      }

      const supabase = await getSupabaseWithSession()
      const resultMap = new Map<string, PostData>()

      // Get acting space ID for the current user
      let actingSpaceId: string | null = null
      if (userId) {
        const { data: ownedSpace } = await supabase
          .from('spaces')
          .select('id')
          .eq('owner_id', userId)
          .limit(1)
          .maybeSingle()

        if (ownedSpace) {
          actingSpaceId = ownedSpace.id
        } else {
          const { data: subscribedSpace } = await supabase
            .from('user_spaces')
            .select('space_id')
            .eq('clerk_id', userId)
            .limit(1)
            .maybeSingle()

          if (subscribedSpace) {
            actingSpaceId = subscribedSpace.space_id
          }
        }
      }

      // Step 1: Fetch posts with their space data using JOIN
      const { data: postsWithSpaces, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          space_id,
          comments_count,
          spaces!inner (
            id,
            name,
            description,
            space_type,
            avatar_url,
            cover_url,
            location,
            is_public,
            owner_id,
            followers_count,
            posts_count,
            created_at,
            updated_at
          )
        `)
        .in('id', postIds)

      if (postsError) {
        console.error('Error fetching posts with spaces:', postsError)
        throw postsError
      }

      // Initialize result map with space data and comments count
      postsWithSpaces?.forEach((post: any) => {
        resultMap.set(post.id, {
          space: post.spaces,
          isSubscribed: false,
          isLiked: false,
          isFavorited: false,
          commentsCount: post.comments_count || 0,
        })
      })

      // Get unique space IDs
      const spaceIds = Array.from(new Set(postsWithSpaces?.map((p: any) => p.space_id) || []))

      if (userId && spaceIds.length > 0) {
        // Step 2: Fetch all subscriptions in one query
        const { data: subscriptions } = await supabase
          .from('user_spaces')
          .select('space_id')
          .eq('clerk_id', userId)
          .in('space_id', spaceIds)

        const subscribedSpaceIds = new Set(subscriptions?.map(s => s.space_id) || [])

        // Update subscription status
        postsWithSpaces?.forEach((post: any) => {
          const data = resultMap.get(post.id)
          if (data) {
            data.isSubscribed = subscribedSpaceIds.has(post.space_id)
          }
        })
      }

      if (actingSpaceId && postIds.length > 0) {
        // Step 3: Fetch all likes in one query
        const { data: likes } = await supabase
          .from('post_reactions')
          .select('post_id')
          .eq('space_id', actingSpaceId)
          .eq('reaction_type', 'like')
          .in('post_id', postIds)

        const likedPostIds = new Set(likes?.map(l => l.post_id) || [])

        // Step 4: Fetch all favorites in one query
        const { data: favorites } = await supabase
          .from('favorites')
          .select('post_id')
          .eq('space_id', actingSpaceId)
          .in('post_id', postIds)

        const favoritedPostIds = new Set(favorites?.map(f => f.post_id) || [])

        // Update like and favorite status
        postIds.forEach((postId) => {
          const data = resultMap.get(postId)
          if (data) {
            data.isLiked = likedPostIds.has(postId)
            data.isFavorited = favoritedPostIds.has(postId)
          }
        })
      }

      return resultMap
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: postIds.length > 0,
  })
}
