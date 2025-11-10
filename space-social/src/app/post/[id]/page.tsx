'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSupabaseAuth } from '@/lib/auth'
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Star,
  Users,
  AlertTriangle,
  WifiOff,
  RefreshCw
} from 'lucide-react'

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
}

interface Space {
  id: string
  name: string
  description: string
  location: string
  space_type: string
  is_public: boolean
  owner_id: string
  posts_count: number
  likes_count: number
  favorites_count: number
  followers_count: number
  created_at: string
}

interface Folder {
  id: string
  name: string
  description: string
  space_id: string
  posts_count: number
  created_at: string
  updated_at: string
}

export default function PostPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { getSupabaseWithSession, userId } = useSupabaseAuth()
  const [post, setPost] = useState<Post>({} as Post)
  const [space, setSpace] = useState<Space | null>(null)
  const [folder, setFolder] = useState<Folder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscriptionCount, setSubscriptionCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [maxRetries] = useState(3) // Limit retries to prevent infinite loops

  useEffect(() => {
    fetchPost()
  }, [params.id, userId, retryCount, maxRetries])

  const fetchPost = async () => {
    // Prevent infinite retry loop
    if (retryCount >= maxRetries) {
      setError(`Не удалось загрузить данные после ${maxRetries} попыток. Пожалуйста, обновите страницу.`)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const supabaseClient = await getSupabaseWithSession()
      
      // Add timeout for the request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
      
      // Fetch post data
      const postPromise = supabaseClient
        .from('posts')
        .select('*')
        .eq('id', params.id)
        .maybeSingle() // Changed from .single() to .maybeSingle()
        
      const postResult = await Promise.race([postPromise, timeoutPromise])
      const { data: postData, error: postError } = postResult as any

      if (postError) throw postError
      if (!postData) {
        throw new Error('Post not found')
      }

      setPost(postData)
      setLikeCount(postData.likes_count || 0)
      
      // Fetch space data
      const spacePromise = supabaseClient
        .from('spaces')
        .select('*')
        .eq('id', postData.space_id)
        .maybeSingle() // Changed from .single() to .maybeSingle()
        
      const spaceResult = await Promise.race([spacePromise, timeoutPromise])
      const { data: spaceData, error: spaceError } = spaceResult as any
        
      if (spaceData) {
        setSpace(spaceData)
        
        // Fetch subscription status
        if (userId) {
          const subscriptionPromise = supabaseClient
            .from('user_spaces')
            .select('*')
            .eq('clerk_id', userId)
            .eq('space_id', postData.space_id)
            .maybeSingle() // Changed from .single() to .maybeSingle()
            
          const { data: subscriptionData } = await subscriptionPromise
          
          if (subscriptionData) {
            setIsSubscribed(true)
          }
          
          // Fetch subscription count
          const { count } = await supabaseClient
            .from('user_spaces')
            .select('*', { count: 'exact', head: true })
            .eq('space_id', postData.space_id)
            
          if (count !== null) {
            setSubscriptionCount(count)
          }
          
          // Check if user has liked this post
          // Find a space that the user can act on behalf of
          let actingSpaceId = null
          
          // First, check if user owns any space
          const { data: anyOwnedSpace, error: anyOwnedSpaceError } = await supabaseClient
            .from('spaces')
            .select('id')
            .eq('owner_id', userId)
            .limit(1)
            .maybeSingle()
            
          if (anyOwnedSpace) {
            actingSpaceId = anyOwnedSpace.id
          } else {
            // If user doesn't own any space, check if they're subscribed to any space
            const { data: anySubscribedSpace, error: anySubscribedSpaceError } = await supabaseClient
              .from('user_spaces')
              .select('space_id')
              .eq('clerk_id', userId)
              .limit(1)
              .maybeSingle()
              
            if (anySubscribedSpace) {
              actingSpaceId = anySubscribedSpace.space_id
            }
          }
          
          if (actingSpaceId) {
            // Check if user has liked this post
            const { data: likeData, error: likeError } = await supabaseClient
              .from('post_reactions')
              .select('*')
              .eq('post_id', postData.id)
              .eq('space_id', actingSpaceId)
              .eq('reaction_type', 'like')
              .maybeSingle()
              
            if (likeData) {
              setIsLiked(true)
            }
            
            // Check if user has favorited this post
            const { data: favoriteData, error: favoriteError } = await supabaseClient
              .from('favorites')
              .select('*')
              .eq('space_id', actingSpaceId)
              .eq('post_id', postData.id)
              .maybeSingle()
              
            if (favoriteData) {
              setIsFavorited(true)
            }
          }
        }
      }
      
      // Fetch folder information if post belongs to a folder
      if (postData.folder_id) {
        const folderPromise = supabaseClient
          .from('folders')
          .select('*')
          .eq('id', postData.folder_id)
          .maybeSingle() // Changed from .single() to .maybeSingle()
          
        const folderResult = await Promise.race([folderPromise, timeoutPromise])
        const { data: folderData, error: folderError } = folderResult as any
          
        if (folderData && !folderError) {
          setFolder(folderData)
        }
      }
    } catch (error: any) {
      console.error('Error fetching post:', error)
      
      // Handle network errors specifically
      if (error.message === 'Failed to fetch' || error.message === 'Request timeout') {
        setError('Проблемы с подключением к серверу. Проверьте интернет-соединение и попробуйте снова.')
        // Only retry if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          // Exponential backoff - wait longer between retries
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000) // Max 10 seconds
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
          }, delay)
          return // Don't set loading to false yet, we're retrying
        }
      } else if (error.message) {
        setError(`Ошибка загрузки данных: ${error.message}`)
      } else {
        setError('Не удалось загрузить данные. Пожалуйста, попробуйте обновить страницу.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    // Reset error and trigger reload
    setRetryCount(0) // Reset retry count when manually retrying
    setError(null)
    setRetryCount(prev => prev + 1)
  }

  const handleSubscribe = async () => {
    if (!userId) return
    
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      if (isSubscribed) {
        // Unsubscribe
        const { error } = await supabaseClient
          .from('user_spaces')
          .delete()
          .eq('clerk_id', userId)
          .eq('space_id', post.space_id)
          
        if (!error) {
          setIsSubscribed(false)
          setSubscriptionCount(prev => Math.max(0, prev - 1))
        }
      } else {
        // Subscribe
        const { error } = await supabaseClient
          .from('user_spaces')
          .insert({
            clerk_id: userId,
            space_id: post.space_id,
            role: 'subscriber'
          })
          
        if (!error) {
          setIsSubscribed(true)
          setSubscriptionCount(prev => prev + 1)
        }
      }
      
      // Refresh the data
      fetchPost()
    } catch (error) {
      console.error('Error toggling subscription:', error)
    }
  }

  const handleLike = async () => {
    if (!userId) return
    
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // Find a space that the user can act on behalf of
      let actingSpaceId = null
      
      // First, check if user owns any space
      const { data: anyOwnedSpace, error: anyOwnedSpaceError } = await supabaseClient
        .from('spaces')
        .select('id')
        .eq('owner_id', userId)
        .limit(1)
        .maybeSingle()
        
      if (anyOwnedSpace) {
        actingSpaceId = anyOwnedSpace.id
      } else {
        // If user doesn't own any space, check if they're subscribed to any space
        const { data: anySubscribedSpace, error: anySubscribedSpaceError } = await supabaseClient
          .from('user_spaces')
          .select('space_id')
          .eq('clerk_id', userId)
          .limit(1)
          .maybeSingle()
          
        if (anySubscribedSpace) {
          actingSpaceId = anySubscribedSpace.space_id
        }
      }
      
      if (!actingSpaceId) {
        console.error('User has no space to act on behalf of')
        return
      }
      
      // Check if like already exists
      const { data: existingLike, error: checkError } = await supabaseClient
        .from('post_reactions')
        .select('id')
        .eq('post_id', post.id)
        .eq('space_id', actingSpaceId)
        .eq('reaction_type', 'like')
        .maybeSingle()
        
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing like:', checkError)
        return
      }
      
      if (existingLike) {
        // Remove like
        const { error } = await supabaseClient
          .from('post_reactions')
          .delete()
          .eq('id', existingLike.id)
          
        if (!error) {
          setIsLiked(false)
          // Update like count
          const newCount = Math.max(0, likeCount - 1)
          setLikeCount(newCount)
        }
      } else {
        // Add like
        const { error } = await supabaseClient
          .from('post_reactions')
          .insert({
            post_id: post.id,
            space_id: actingSpaceId,
            reaction_type: 'like'
          })
          
        if (!error) {
          setIsLiked(true)
          // Update like count
          const newCount = likeCount + 1
          setLikeCount(newCount)
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleFavorite = async () => {
    if (!userId) return
    
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // Find a space that the user can act on behalf of
      let actingSpaceId = null
      
      // First, check if user owns any space
      const { data: anyOwnedSpace, error: anyOwnedSpaceError } = await supabaseClient
        .from('spaces')
        .select('id')
        .eq('owner_id', userId)
        .limit(1)
        .maybeSingle()
        
      if (anyOwnedSpace) {
        actingSpaceId = anyOwnedSpace.id
      } else {
        // If user doesn't own any space, check if they're subscribed to any space
        const { data: anySubscribedSpace, error: anySubscribedSpaceError } = await supabaseClient
          .from('user_spaces')
          .select('space_id')
          .eq('clerk_id', userId)
          .limit(1)
          .maybeSingle()
          
        if (anySubscribedSpace) {
          actingSpaceId = anySubscribedSpace.space_id
        }
      }
      
      if (!actingSpaceId) {
        console.error('User has no space to act on behalf of')
        return
      }
      
      // Check if favorite already exists
      const { data: existingFavorite, error: checkError } = await supabaseClient
        .from('favorites')
        .select('id')
        .eq('space_id', actingSpaceId)
        .eq('post_id', post.id)
        .maybeSingle()
        
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing favorite:', checkError)
        return
      }
      
      if (existingFavorite) {
        // Remove favorite
        const { error } = await supabaseClient
          .from('favorites')
          .delete()
          .eq('id', existingFavorite.id)
          
        if (!error) {
          setIsFavorited(false)
        }
      } else {
        // Add favorite
        const { error } = await supabaseClient
          .from('favorites')
          .insert({
            space_id: actingSpaceId,
            post_id: post.id
          })
          
        if (!error) {
          setIsFavorited(true)
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
            <h2 className="text-xl font-bold text-red-800">Ошибка загрузки</h2>
          </div>
          <div className="flex items-start mb-4">
            <WifiOff className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleRetry} className="flex items-center">
              <RefreshCw className="h-4 w-4 mr-2" />
              Повторить попытку
            </Button>
            <Button variant="outline" onClick={() => router.push('/')}>
              Вернуться на главную
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!post.id) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-xl font-bold mb-2">Пост не найден</h2>
          <p className="text-gray-500 mb-4">Запрашиваемый пост не существует или недоступен.</p>
          <Button onClick={() => router.push('/')}>
            Вернуться на главную
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl mb-2">{post.title}</CardTitle>
              <div className="flex items-center text-sm text-muted-foreground">
                <span>
                  {new Date(post.created_at).toLocaleDateString('ru-RU')}
                </span>
                {space && (
                  <>
                    <span className="mx-2">•</span>
                    <span>в {space.name}</span>
                  </>
                )}
              </div>
            </div>
            
            {folder && (
              <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                {folder.name}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none mb-6">
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>
          
          {space && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{space.name}</h3>
                    <p className="text-sm text-muted-foreground">{space.description}</p>
                  </div>
                  
                  {userId && space.owner_id !== userId && (
                    <Button 
                      variant={isSubscribed ? "default" : "outline"} 
                      size="sm"
                      onClick={handleSubscribe}
                    >
                      {isSubscribed ? 'Подписан' : 'Подписаться'}
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground mt-2">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{subscriptionCount} подписчиков</span>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                className={`flex items-center ${isLiked ? 'text-red-500' : ''}`}
                onClick={handleLike}
              >
                <Heart className="h-4 w-4 mr-1" />
                <span>{likeCount}</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center"
                onClick={() => router.push(`/post/${post.id}#comments`)}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                <span>{post.comments_count || 0}</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                className={`flex items-center ${isFavorited ? 'text-yellow-500' : ''}`}
                onClick={handleFavorite}
              >
                <Star className="h-4 w-4 mr-1" />
                <span>{post.favorites_count || 0}</span>
              </Button>
            </div>
            
            <Button variant="ghost" size="sm" className="flex items-center">
              <Share2 className="h-4 w-4 mr-1" />
              Поделиться
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}