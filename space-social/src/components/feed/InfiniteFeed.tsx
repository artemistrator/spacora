'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSupabaseAuth } from '@/lib/auth'
import { PostCard } from '@/components/post/PostCard'

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
  followers_count?: number
  posts_count?: number
}

export function InfiniteFeed() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [channel, setChannel] = useState<any>(null)
  const observer = useRef<IntersectionObserver | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const fetchPosts = useCallback(async () => {
    if (!hasMore || loading) return

    setLoading(true)
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // Fetch posts with pagination
      const { data, error } = await supabaseClient
        .from('posts')
        .select(`
          *,
          spaces (id, name, avatar_url, owner_id, followers_count, posts_count)
        `)
        .order('created_at', { ascending: false })
        .range(page * 10, (page + 1) * 10 - 1)

      if (error) throw error

      if (data.length === 0) {
        setHasMore(false)
      } else {
        // Transform data to include space information
        const postsWithSpaceInfo = data.map(post => ({
          ...post,
          spaceName: post.spaces?.name || 'Unknown Space',
          spaceAvatarUrl: post.spaces?.avatar_url || null,
          followers_count: post.spaces?.followers_count || 0,
          posts_count: post.spaces?.posts_count || 0
        }))

        setPosts(prev => page === 0 ? postsWithSpaceInfo : [...prev, ...postsWithSpaceInfo])
        setPage(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }, [page, hasMore, loading, getSupabaseWithSession])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  useEffect(() => {
    if (!userId) return

    const setupSubscription = async () => {
      const supabaseClient = await getSupabaseWithSession()
      
      // Set up real-time subscription for new posts
      const newChannel = supabaseClient
        .channel('public:posts')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'posts' },
          async (payload) => {
            const postSpaceId = payload.new.space_id
            
            // Check if user is subscribed to this space
            const { data: subscription } = await supabaseClient
              .from('user_spaces')
              .select('id')
              .eq('clerk_id', userId)
              .eq('space_id', postSpaceId)
              .maybeSingle() // Changed from .single() to .maybeSingle()
              
            // Check if space is public
            const { data: publicSpace } = await supabaseClient
              .from('spaces')
              .select('id')
              .eq('id', postSpaceId)
              .eq('is_public', true)
              .maybeSingle() // Changed from .single() to .maybeSingle()
              
            // If user is subscribed or space is public, add the post
            if (subscription || publicSpace) {
              // Fetch space information for the new post
              const { data: postWithSpace } = await supabaseClient
                .from('posts')
                .select(`
                  *,
                  spaces (id, name, avatar_url, owner_id, followers_count, posts_count)
                `)
                .eq('id', payload.new.id)
                .maybeSingle() // Changed from .single() to .maybeSingle()
                
              if (postWithSpace) {
                const postWithSpaceInfo = {
                  ...postWithSpace,
                  spaceName: postWithSpace.spaces?.name || 'Unknown Space',
                  spaceAvatarUrl: postWithSpace.spaces?.avatar_url || null,
                  followers_count: postWithSpace.spaces?.followers_count || 0,
                  posts_count: postWithSpace.spaces?.posts_count || 0
                }
                setPosts(prev => [postWithSpaceInfo, ...prev])
              }
            }
          }
        )
        .subscribe()
      
      setChannel(newChannel)
    }
    
    setupSubscription()
    
    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [userId])

  useEffect(() => {
    if (!hasMore || loading) return

    if (observer.current) observer.current.disconnect()

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        fetchPosts()
      }
    })

    if (ref.current) observer.current.observe(ref.current)

    return () => {
      if (observer.current && ref.current) {
        observer.current.unobserve(ref.current)
      }
    }
  }, [fetchPosts, hasMore, loading])

  return (
    <div className="space-y-6">
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          onClick={() => window.location.href = `/post/${post.id}`}
        />
      ))}
      
      {hasMore && (
        <div ref={ref} className="flex justify-center py-8">
          <div className="w-8 h-8 border-t-2 border-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      
      {!hasMore && posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Нет постов для отображения</p>
        </div>
      )}
    </div>
  )
}