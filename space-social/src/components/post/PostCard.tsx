'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Heart, MessageCircle, Share2, Users, Star, Folder, AlertTriangle, WifiOff, RefreshCw } from 'lucide-react'
import { useSupabaseAuth } from '@/lib/auth'
import { updateSpaceFollowersCount, updatePostLikesCount, updateSpaceLikesCount, toggleFavorite } from '@/lib/counter-utils'
import { executeSupabaseQuery } from '@/lib/request-manager'
import styles from './PostCard.module.css'

interface PostCardProps {
  post: any
  onClick?: () => void
  isFavoritesPage?: boolean
  onRemoveFromFavorites?: () => void
}

interface Comment {
  id: string
  content: string
  created_at: string
  space: {
    id: string
    name: string
    avatar_url: string | null
  }
}

export function PostCard({ post, onClick, isFavoritesPage = false, onRemoveFromFavorites }: PostCardProps) {
  console.log('PostCard rendered with post:', post);
  const router = useRouter()
  const { getSupabaseWithSession, userId } = useSupabaseAuth()
  const [space, setSpace] = useState<any>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  // State for comment functionality
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [commentText, setCommentText] = useState('')
  // State for comments display
  const [comments, setComments] = useState<Comment[]>([])
  const [showAllComments, setShowAllComments] = useState(false)
  // State for folder information
  const [folder, setFolder] = useState<any>(null)
  // Error states
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    console.log('PostCard useEffect triggered with post:', post);
    const fetchSpaceAndSubscription = async () => {
      try {
        const supabaseClient = await getSupabaseWithSession()
        
        console.log('PostCard: Fetching space data for post:', post.id);
        // Fetch space data with timeout and concurrency control
        const spaceData = await executeSupabaseQuery(async () => {
          const { data, error } = await supabaseClient
            .from('spaces')
            .select('*')
            .eq('id', post.space_id)
            .single();
          
          if (error) throw error;
          return data;
        }, 3000);
        
        console.log('PostCard space fetch result:', spaceData);
        if (spaceData) {
          setSpace(spaceData);
          setFollowerCount(spaceData.followers_count || 0);
          
          // Small delay before next request
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Fetch subscription status
          if (userId) {
            try {
              console.log('PostCard: Fetching subscription status for post:', post.id);
              const subscriptionData = await executeSupabaseQuery(async () => {
                const { data, error } = await supabaseClient
                  .from('user_spaces')
                  .select('*')
                  .eq('clerk_id', userId)
                  .eq('space_id', post.space_id)
                  .maybeSingle();
                
                if (error) throw error;
                return data;
              }, 3000);
              
              console.log('PostCard subscription fetch result:', subscriptionData);
              if (subscriptionData) {
                setIsSubscribed(true);
              }
            } catch (subscriptionError) {
              console.warn('Could not fetch subscription status:', subscriptionError);
            }
          }
        }
        
        // Set initial like count
        setLikeCount(post.likes_count || 0);
        
        // Small delay before next request
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Check if user has liked this post and favorited this post
        if (userId) {
          // Find a space that the user can act on behalf of
          let actingSpaceId = null;
          
          // First, check if user owns any space
          try {
            console.log('PostCard: Checking if user owns any space for post:', post.id);
            const anyOwnedSpace = await executeSupabaseQuery(async () => {
              const { data, error } = await supabaseClient
                .from('spaces')
                .select('id')
                .eq('owner_id', userId)
                .limit(1)
                .maybeSingle();
              
              if (error) throw error;
              return data;
            }, 3000);
            
            console.log('PostCard owned space check result:', anyOwnedSpace);
            if (anyOwnedSpace) {
              actingSpaceId = anyOwnedSpace.id;
            } else {
              // If user doesn't own any space, check if they're subscribed to any space
              // Small delay before next request
              await new Promise(resolve => setTimeout(resolve, 200));
              
              console.log('PostCard: Checking if user is subscribed to any space for post:', post.id);
              const anySubscribedSpace = await executeSupabaseQuery(async () => {
                const { data, error } = await supabaseClient
                  .from('user_spaces')
                  .select('space_id')
                  .eq('clerk_id', userId)
                  .limit(1)
                  .maybeSingle();
                
                if (error) throw error;
                return data;
              }, 3000);
              
              console.log('PostCard subscribed space check result:', anySubscribedSpace);
              if (anySubscribedSpace) {
                actingSpaceId = anySubscribedSpace.space_id;
              }
            }
          } catch (spaceCheckError) {
            console.warn('Could not determine acting space:', spaceCheckError);
          }
          
          console.log('PostCard actingSpaceId:', actingSpaceId);
          if (actingSpaceId) {
            // Small delay before next request
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Check if user has liked this post
            try {
              console.log('PostCard: Checking like status for post:', post.id);
              const likeData = await executeSupabaseQuery(async () => {
                const { data, error } = await supabaseClient
                  .from('post_reactions')
                  .select('*')
                  .eq('post_id', post.id)
                  .eq('space_id', actingSpaceId)
                  .eq('reaction_type', 'like')
                  .maybeSingle();
                
                if (error) throw error;
                return data;
              }, 3000);
              
              console.log('PostCard like check result:', likeData);
              if (likeData) {
                setIsLiked(true);
              }
            } catch (likeError) {
              console.warn('Could not check like status:', likeError);
            }
            
            // Small delay before next request
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Check if user has favorited this post
            try {
              console.log('PostCard: Checking favorite status for post:', post.id);
              const favoriteData = await executeSupabaseQuery(async () => {
                const { data, error } = await supabaseClient
                  .from('favorites')
                  .select('*')
                  .eq('space_id', actingSpaceId) // Using the space ID that user can act on behalf of
                  .eq('post_id', post.id)
                  .maybeSingle();
                
                if (error) throw error;
                return data;
              }, 3000);
              
              console.log('PostCard favorite check result:', favoriteData);
              if (favoriteData) {
                setIsFavorited(true);
              }
            } catch (favoriteError) {
              console.warn('Could not check favorite status:', favoriteError);
            }
          }
        }
        
        // Small delay before next request
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Fetch folder information if post belongs to a folder
        if (post.folder_id) {
          console.log('PostCard fetching folder info for folder_id:', post.folder_id, 'for post:', post.id);
          try {
            const folderData = await executeSupabaseQuery(async () => {
              const { data, error } = await supabaseClient
                .from('folders')
                .select('*')
                .eq('id', post.folder_id)
                .single();
              
              if (error) throw error;
              return data;
            }, 3000);
            
            console.log('PostCard folder fetch result:', folderData);
            if (folderData) {
              setFolder(folderData);
            }
          } catch (folderError) {
            console.warn('Could not fetch folder info:', folderError);
          }
        }
        console.log('PostCard fetchSpaceAndSubscription completed for post:', post.id);
      } catch (error: any) {
        console.error('Error fetching space data for post:', post.id, error);
        
        // Handle network errors specifically
        if (error.message === 'Failed to fetch' || error.message === 'Request timeout') {
          setError('Проблемы с подключением к серверу. Проверьте интернет-соединение.');
        } else {
          setError('Не удалось загрузить данные пространства');
        }
      }
    }
    
    fetchSpaceAndSubscription()
  }, [post.space_id, post.id, post.likes_count, post.folder_id, userId, retryCount])

  // Check favorite status when userId becomes available
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!userId) {
        setIsFavorited(false)
        return
      }
      
      try {
        console.log('PostCard checkFavoriteStatus: Getting Supabase client');
        const supabaseClient = await getSupabaseWithSession()
        
        // First, try to get the user's Supabase ID from user_identities table
        let userSupabaseId = null;
        try {
          console.log('PostCard checkFavoriteStatus: Fetching user identity');
          const userIdentity = await executeSupabaseQuery(async () => {
            const { data, error } = await supabaseClient
              .from('user_identities')
              .select('supabase_id')
              .eq('clerk_id', userId)
              .single();
            
            if (error) throw error;
            return data;
          }, 3000);
          
          if (userIdentity && userIdentity.supabase_id) {
            userSupabaseId = userIdentity.supabase_id;
          }
        } catch (identityError) {
          console.warn('Could not fetch user identity from user_identities table:', identityError);
        }
        
        // If we couldn't get it from user_identities, try to get it from spaces table
        if (!userSupabaseId) {
          try {
            console.log('PostCard checkFavoriteStatus: Fetching user space');
            const spaceData = await executeSupabaseQuery(async () => {
              const { data, error } = await supabaseClient
                .from('spaces')
                .select('id')
                .eq('owner_id', userId)
                .limit(1)
                .maybeSingle();
              
              if (error) throw error;
              return data;
            }, 3000);
              
            if (spaceData) {
              userSupabaseId = spaceData.id;
            }
          } catch (spaceError) {
            console.warn('Could not fetch user space:', spaceError);
          }
        }
        
        // If we still don't have a userSupabaseId, we can't check favorites
        if (!userSupabaseId) {
          console.warn('Could not determine user space ID for favorite check');
          setIsFavorited(false);
          return;
        }
        
        console.log('PostCard checkFavoriteStatus: Checking favorite status');
        const favoriteData = await executeSupabaseQuery(async () => {
          const { data, error } = await supabaseClient
            .from('favorites')
            .select('*')
            .eq('space_id', userSupabaseId) // Using user's Supabase ID
            .eq('post_id', post.id)
            .maybeSingle();
          
          if (error) throw error;
          return data;
        }, 3000);
          
        if (favoriteData) {
          setIsFavorited(true);
        } else {
          setIsFavorited(false);
        }
      } catch (error: any) {
        console.error('Error checking favorite status:', error);
        
        // Handle network errors specifically
        if (error.message === 'Failed to fetch' || error.message === 'Request timeout') {
          setError('Проблемы с подключением к серверу. Проверьте интернет-соединение.');
        } else {
          setError('Не удалось проверить статус избранного');
        }
        setIsFavorited(false);
      }
    }
    
    checkFavoriteStatus();
  }, [userId, post.id, retryCount])

  // Fetch comments for the post
  useEffect(() => {
    const fetchComments = async () => {
      try {
        console.log('PostCard fetchComments: Getting Supabase client');
        const supabaseClient = await getSupabaseWithSession()
        
        // Fetch comments for this post
        console.log('PostCard fetchComments: Fetching comments for post:', post.id);
        const commentsData = await executeSupabaseQuery(async () => {
          const { data, error } = await supabaseClient
            .from('post_comments')
            .select(`
              id,
              content,
              created_at,
              space:spaces(id, name, avatar_url)
            `)
            .eq('post_id', post.id)
            .order('created_at', { ascending: false })
            .limit(10);
          
          if (error) throw error;
          return data;
        }, 3000);
          
        setComments(commentsData as unknown as Comment[]);
      } catch (error: any) {
        console.error('Error fetching comments:', error);
        
        // Handle network errors specifically
        if (error.message === 'Failed to fetch' || error.message === 'Request timeout') {
          setError('Проблемы с подключением к серверу. Проверьте интернет-соединение.');
        } else {
          setError('Не удалось загрузить комментарии');
        }
      }
    }
    
    fetchComments();
  }, [post.id, retryCount])

  const handleRetry = () => {
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
          // Update follower count
          const newCount = Math.max(0, followerCount - 1)
          setFollowerCount(newCount)
          
          // Update space followers count in database
          await updateSpaceFollowersCount(post.space_id, false)
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
          // Update follower count
          const newCount = followerCount + 1
          setFollowerCount(newCount)
          
          // Update space followers count in database
          await updateSpaceFollowersCount(post.space_id, true)
        }
      }
    } catch (error) {
      console.error('Error toggling subscription:', error)
      setError('Не удалось изменить статус подписки')
    }
  }

  const handleLike = async () => {
    if (!userId) return
    
    try {
      console.log('Handle like called with userId:', userId);
      console.log('Post data:', post);
      console.log('Current isLiked state:', isLiked);
      
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
        
      console.log('Owned spaces result:', { anyOwnedSpace, anyOwnedSpaceError });
        
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
          
        console.log('Subscribed spaces result:', { anySubscribedSpace, anySubscribedSpaceError });
          
        if (anySubscribedSpace) {
          actingSpaceId = anySubscribedSpace.space_id
        }
      }
      
      console.log('Acting space ID for like:', actingSpaceId);
      
      if (!actingSpaceId) {
        console.error('User has no space to act on behalf of')
        setError('Вам нужно создать или подписаться на пространство перед тем как ставить лайки.')
        return
      }
      
      // Check if like already exists
      const { data: existingLike, error: checkError } = await supabaseClient
        .from('post_reactions')
        .select('id')
        .eq('post_id', post.id)
        .eq('space_id', actingSpaceId)
        .eq('reaction_type', 'like')
        .maybeSingle();
        
      console.log('Check existing like result:', { existingLike, checkError });
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing like:', checkError);
        setError('Ошибка при проверке лайка. Пожалуйста, попробуйте снова.');
        return;
      }
      
      if (existingLike) {
        // Remove like
        console.log('Removing like');
        
        try {
          const { error } = await supabaseClient
            .from('post_reactions')
            .delete()
            .eq('id', existingLike.id)
            
          console.log('Remove like result:', { error });
          
          if (!error) {
            setIsLiked(false)
            // Update like count
            const newCount = Math.max(0, likeCount - 1)
            setLikeCount(newCount)
            
            // Update post likes count in database
            await updatePostLikesCount(post.id, false)
          } else {
            console.error('Error removing like:', error)
            if (error) {
              console.log('Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
              })
            }
            setError('Ошибка при удалении лайка. Пожалуйста, попробуйте снова.');
          }
        } catch (deleteError) {
          console.error('Exception during like removal:', deleteError);
          setError('Ошибка при удалении лайка. Пожалуйста, попробуйте снова.');
        }
      } else {
        // Add like
        console.log('Adding like');
        
        try {
          const { error } = await supabaseClient
            .from('post_reactions')
            .insert({
              post_id: post.id,
              space_id: actingSpaceId,
              reaction_type: 'like'
            })
            
          console.log('Add like result:', { error });
          
          if (!error) {
            setIsLiked(true)
            // Update like count
            const newCount = likeCount + 1
            setLikeCount(newCount)
            
            // Update post likes count in database
            await updatePostLikesCount(post.id, true)
          } else {
            console.error('Error adding like:', error)
            if (error) {
              console.log('Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
              })
            }
            setError('Ошибка при добавлении лайка. Пожалуйста, попробуйте снова.');
          }
        } catch (insertError) {
          console.error('Exception during like addition:', insertError);
          setError('Ошибка при добавлении лайка. Пожалуйста, попробуйте снова.');
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      setError('Ошибка при обработке лайка. Пожалуйста, попробуйте снова.');
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
        setError('Вам нужно создать или подписаться на пространство перед тем как добавлять в избранное.')
        return
      }
      
      const success = await toggleFavorite(actingSpaceId, post.id, post.space_id)
      
      if (success) {
        // Update the local state
        setIsFavorited(!isFavorited)
        // If we're on the favorites page, refresh the list after toggling
        if (isFavoritesPage && onRemoveFromFavorites) {
          onRemoveFromFavorites()
        }
      } else {
        console.error('Failed to toggle favorite')
        setError('Ошибка при добавлении в избранное. Пожалуйста, попробуйте снова.')
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      setError('Ошибка при обработке избранного. Пожалуйста, попробуйте снова.')
    }
  }

  const handleComment = async () => {
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
        setError('Вам нужно создать или подписаться на пространство перед тем как комментировать.')
        return
      }
      
      if (!commentText.trim()) return
      
      // Create comment
      const { data, error: insertError } = await supabaseClient
        .from('post_comments')
        .insert({
          post_id: post.id,
          space_id: actingSpaceId,
          content: commentText.trim()
        })
        .select()
        
      if (insertError) {
        console.error('Error adding comment:', insertError)
        console.error('Error details:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint
        })
        // Handle the case where the table doesn't exist
        if (insertError.code === '42P01') {
          setError('Функция комментариев временно недоступна. Пожалуйста, свяжитесь с администратором.')
        } else {
          setError('Не удалось добавить комментарий. Пожалуйста, попробуйте снова.')
        }
        return
      }
      
      // Clear comment text and hide input
      setCommentText('')
      setShowCommentInput(false)
      
      // Update comments count in the database
      const newCount = (post.comments_count || 0) + 1
      const { error: updateError } = await supabaseClient
        .from('posts')
        .update({ comments_count: newCount })
        .eq('id', post.id)
        
      if (updateError) {
        console.error('Error updating comments count:', updateError)
      }
      
      // Update local state if possible
      // Note: In a real app, you might want to use a state management solution
      // or refetch the post data to ensure consistency
      
    } catch (error) {
      console.error('Error adding comment:', error)
      setError('Произошла непредвиденная ошибка при добавлении комментария.')
    }
  }

  const handleAvatarClick = () => {
    if (space) {
      router.push(`/space/${space.id}`)
    }
  }

  // If there's an error, show it in the UI
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-red-50 border-b border-red-100">
          <div className="flex items-center text-red-700">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span className="font-medium">Ошибка загрузки поста:</span>
          </div>
          <p className="text-red-600 text-sm mt-1 mb-3">{error}</p>
          <div className="flex gap-2">
            <Button 
              onClick={handleRetry} 
              variant="outline" 
              size="sm" 
              className="flex items-center text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Повторить
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClick}
              className="text-xs"
            >
              Открыть пост
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 ${styles.postCard}`}>
      {/* Post header with space info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 cursor-pointer ring-2 ring-white shadow-sm hover:ring-blue-100 transition-all duration-200">
              <AvatarImage src={space?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-50 to-indigo-100 text-indigo-800 font-normal font-open-sans">
                {space?.name?.charAt(0)?.toUpperCase() || 'S'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 
                className="font-demibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors duration-200 font-open-sans"
                onClick={handleAvatarClick}
              >
                {space?.name || 'Space'}
              </h3>
              <div className="flex items-center space-x-2 mt-0.5">
                <p className="text-xs text-gray-500 mt-0.5 font-open-sans font-light">
                  {new Date(post.created_at).toLocaleDateString('ru-RU')}
                </p>
                {folder && (
                  <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    <Folder className="h-3 w-3 mr-1" />
                    {folder.name}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {userId && space?.owner_id !== userId && (
            <Button 
              variant={isSubscribed ? "default" : "outline"} 
              size="sm"
              className="rounded-full h-8 px-3 text-xs font-normal transition-all duration-200 hover:shadow-sm font-open-sans"
              onClick={handleSubscribe}
            >
              <Users className="h-3 w-3 mr-1.5" />
              {isSubscribed ? 'Подписан' : 'Подписаться'}
            </Button>
          )}
        </div>
      </div>
      
      {/* Post content */}
      <div className="p-4 cursor-pointer" onClick={onClick}>
        {post.content && (
          <p className="text-gray-800 mb-4 leading-relaxed font-open-sans font-normal">{post.content}</p>
        )}
        
        {post.images && post.images.length > 0 && (
          <div className="grid grid-cols-1 gap-2 mb-2">
            {post.images.map((image: string, index: number) => (
              <div key={index} className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <img
                  src={image}
                  alt={`Post image ${index + 1}`}
                  className="w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Post actions */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 px-2 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-500 transition-colors duration-200 font-open-sans font-normal"
            onClick={handleLike}
          >
            <Heart className={`h-4 w-4 mr-1 ${isLiked ? "fill-current text-red-500" : ""}`} />
            <span className="text-sm font-normal">{likeCount}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 px-2 rounded-lg hover:bg-blue-50 text-gray-600 hover:text-blue-500 transition-colors duration-200 font-open-sans font-normal"
            onClick={() => setShowCommentInput(!showCommentInput)}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            <span className="text-sm font-normal">{post.comments_count || 0}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 px-2 rounded-lg hover:bg-yellow-50 text-gray-600 hover:text-yellow-500 transition-colors duration-200 font-open-sans font-normal"
            onClick={handleFavorite}
          >
            <Star className={`h-4 w-4 mr-1 ${isFavorited ? "fill-current text-yellow-500" : ""}`} />
            <span className="text-sm font-normal sr-only md:not-sr-only">
              {isFavoritesPage ? 'Убрать' : 'В избранное'}
            </span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 px-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors duration-200 hidden sm:flex font-open-sans font-normal"
          >
            <Share2 className="h-4 w-4 mr-1" />
            <span className="text-sm font-normal sr-only md:not-sr-only">Поделиться</span>
          </Button>
        </div>
        
        <div className="flex items-center text-xs text-gray-500 font-open-sans font-light">
          <Users className="h-3.5 w-3.5 mr-1" />
          {followerCount}
        </div>
      </div>
      
      {/* Comment input - appears when comment button is clicked */}
      {showCommentInput && (
        <div className="px-4 py-3 border-t border-gray-100 bg-white">
          <div className="flex space-x-2">
            <Input
              value={commentText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommentText(e.target.value)}
              placeholder="Напишите комментарий..."
              className="flex-1 h-10 text-sm rounded-lg border-gray-200 focus:border-blue-300 focus:ring focus:ring-blue-100 font-open-sans font-normal"
            />
            <Button 
              onClick={handleComment}
              disabled={!commentText.trim()}
              className="h-10 px-3 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200 font-open-sans"
            >
              Отправить
            </Button>
          </div>
        </div>
      )}
      
      {/* Display comments */}
      {comments.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/30">
          <h4 className="font-demibold text-gray-900 text-sm mb-2 font-open-sans">Комментарии ({post.comments_count || 0})</h4>
          <div className="space-y-3">
            {comments.slice(0, showAllComments ? comments.length : 3).map((comment) => (
              <div key={comment.id} className="flex items-start space-x-2.5">
                <Avatar className="h-7 w-7 ring-1 ring-white shadow-xs">
                  <AvatarImage src={comment.space?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 text-xs font-open-sans font-normal">
                    {comment.space?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-demibold text-gray-900 truncate font-open-sans">
                      {comment.space?.name || 'Unknown User'}
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap font-open-sans font-light">
                      {new Date(comment.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 leading-relaxed font-open-sans font-normal">{comment.content}</p>
                </div>
              </div>
            ))}
            {comments.length > 3 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs font-normal rounded-lg transition-colors duration-200 font-open-sans"
                onClick={() => setShowAllComments(!showAllComments)}
              >
                {showAllComments ? 'Скрыть' : `Показать все ${comments.length} комментариев`}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}