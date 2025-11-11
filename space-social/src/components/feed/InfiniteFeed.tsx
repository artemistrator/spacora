'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
}

export function InfiniteFeed() {
  const router = useRouter()
  const { getSupabaseWithSession, userId } = useSupabaseAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [channel, setChannel] = useState<any>(null)
  const observer = useRef<IntersectionObserver | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const subscriptionCacheRef = useRef<Map<string, boolean>>(new Map())
  const initialFetchDone = useRef(false)

  const fetchPosts = useCallback(async () => {
    if (loading) return

    setLoading(true)
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      const { data, error } = await supabaseClient
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * 10, (page + 1) * 10 - 1)

      if (error) throw error

      if (data.length === 0) {
        setHasMore(false)
      } else {
        setPosts(prev => page === 0 ? data : [...prev, ...data])
        setPage(prev => prev + 1)
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }, [page, loading])

  // Only run initial fetch once
  useEffect(() => {
    if (!initialFetchDone.current && !loading) {
      initialFetchDone.current = true
      fetchPosts()
    }
  }, [])

  useEffect(() => {
    if (!userId) return

    const setupSubscription = async () => {
      const supabaseClient = await getSupabaseWithSession()
      
      const newChannel = supabaseClient
        .channel('public:posts')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'posts' },
          async (payload) => {
            const postSpaceId = payload.new.space_id
            
            if (!subscriptionCacheRef.current.has(postSpaceId)) {
              const { data: space } = await supabaseClient
                .from('spaces')
                .select('id, is_public')
                .eq('id', postSpaceId)
                .maybeSingle()

              if (space?.is_public) {
                subscriptionCacheRef.current.set(postSpaceId, true)
                setPosts(prev => [payload.new as Post, ...prev])
              } else {
                const { data: subscription } = await supabaseClient
                  .from('user_spaces')
                  .select('id')
                  .eq('clerk_id', userId)
                  .eq('space_id', postSpaceId)
                  .maybeSingle()

                if (subscription) {
                  subscriptionCacheRef.current.set(postSpaceId, true)
                  setPosts(prev => [payload.new as Post, ...prev])
                } else {
                  subscriptionCacheRef.current.set(postSpaceId, false)
                }
              }
            } else if (subscriptionCacheRef.current.get(postSpaceId)) {
              setPosts(prev => [payload.new as Post, ...prev])
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
          onClick={() => router.push(`/post/${post.id}`)}
          onPostDeleted={(postId) => {
            setPosts(prevPosts => prevPosts.filter(p => p.id !== postId))
          }}
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
