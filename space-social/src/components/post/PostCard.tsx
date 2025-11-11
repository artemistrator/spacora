'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Heart, MessageCircle, Share2, Users, Star, Folder, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react'
import { useSupabaseAuth } from '@/lib/auth'
import { updateSpaceFollowersCount, updatePostLikesCount, toggleFavorite } from '@/lib/counter-utils'
import { usePostCardData } from '@/hooks/usePostCardData'
import styles from './PostCard.module.css'

interface PostCardProps {
  post: any
  onClick?: () => void
  isFavoritesPage?: boolean
  onRemoveFromFavorites?: () => void
  onPostDeleted?: (postId: string) => void
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

export function PostCard({ post, onClick, isFavoritesPage = false, onRemoveFromFavorites, onPostDeleted }: PostCardProps) {
  const router = useRouter()
  const { getSupabaseWithSession, userId } = useSupabaseAuth()
  const { data: cardData, isLoading, error, refetch } = usePostCardData(post)

  const [showCommentInput, setShowCommentInput] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [showAllComments, setShowAllComments] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes_count || 0)
  const [isLiked, setIsLiked] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [followerCount, setFollowerCount] = useState(post.followers_count || 0)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [error2, setError2] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (cardData) {
      setIsLiked(cardData.isLiked)
      setIsSubscribed(cardData.isSubscribed)
      setIsFavorited(cardData.isFavorited)
      setFollowerCount(cardData.space?.followers_count || 0)
    }
  }, [cardData])

  const handleRetry = () => {
    setError2(null)
    refetch()
  }

  const loadComments = async () => {
    if (commentsLoading) return
    setCommentsLoading(true)
    
    try {
      const supabaseClient = await getSupabaseWithSession()
      const { data: commentsData, error: commentsError } = await supabaseClient
        .from('post_comments')
        .select(`
          id,
          content,
          created_at,
          space:spaces(id, name, avatar_url)
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (commentsError) throw commentsError
      setComments(commentsData as unknown as Comment[])
    } catch (error: any) {
      setError2('Не удалось загрузить комментарии')
    } finally {
      setCommentsLoading(false)
    }
  }

  const handleLike = async () => {
    if (!userId || !cardData) return

    try {
      const supabaseClient = await getSupabaseWithSession()

      if (isLiked) {
        const { error } = await supabaseClient
          .from('post_reactions')
          .delete()
          .eq('post_id', post.id)
          .eq('space_id', cardData.space.id)
          .eq('reaction_type', 'like')

        if (!error) {
          setIsLiked(false)
          const newCount = Math.max(0, likeCount - 1)
          setLikeCount(newCount)
          await updatePostLikesCount(post.id, false)
        }
      } else {
        const { error } = await supabaseClient
          .from('post_reactions')
          .insert({
            post_id: post.id,
            space_id: cardData.space.id,
            reaction_type: 'like',
          })

        if (!error) {
          setIsLiked(true)
          const newCount = likeCount + 1
          setLikeCount(newCount)
          await updatePostLikesCount(post.id, true)
        }
      }
    } catch (error) {
      setError2('Ошибка при обработке лайка')
    }
  }

  const handleSubscribe = async () => {
    if (!userId || !cardData) return

    try {
      const supabaseClient = await getSupabaseWithSession()

      if (isSubscribed) {
        const { error } = await supabaseClient
          .from('user_spaces')
          .delete()
          .eq('clerk_id', userId)
          .eq('space_id', post.space_id)

        if (!error) {
          setIsSubscribed(false)
          const newCount = Math.max(0, followerCount - 1)
          setFollowerCount(newCount)
          await updateSpaceFollowersCount(post.space_id, false)
        }
      } else {
        const { error } = await supabaseClient
          .from('user_spaces')
          .insert({
            clerk_id: userId,
            space_id: post.space_id,
            role: 'subscriber',
          })

        if (!error) {
          setIsSubscribed(true)
          const newCount = followerCount + 1
          setFollowerCount(newCount)
          await updateSpaceFollowersCount(post.space_id, true)
        }
      }
    } catch (error) {
      setError2('Ошибка при изменении подписки')
    }
  }

  const handleFavorite = async () => {
    if (!userId || !cardData) return

    try {
      const supabaseClient = await getSupabaseWithSession()

      const { data: ownedSpace } = await supabaseClient
        .from('spaces')
        .select('id')
        .eq('owner_id', userId)
        .limit(1)
        .maybeSingle()

      const actingSpaceId = ownedSpace?.id || cardData.space.id
      const success = await toggleFavorite(actingSpaceId, post.id, post.space_id)

      if (success) {
        setIsFavorited(!isFavorited)
        if (isFavoritesPage && onRemoveFromFavorites) {
          onRemoveFromFavorites()
        }
      }
    } catch (error) {
      setError2('Ошибка при обработке избранного')
    }
  }

  const handleComment = async () => {
    if (!userId || !cardData || !commentText.trim()) return

    try {
      const supabaseClient = await getSupabaseWithSession()

      const { error: insertError } = await supabaseClient
        .from('post_comments')
        .insert({
          post_id: post.id,
          space_id: cardData.space.id,
          content: commentText.trim(),
        })

      if (insertError) {
        if (insertError.code === '42P01') {
          setError2('Функция комментариев временно недоступна')
        } else {
          setError2('Не удалось добавить комментарий')
        }
        return
      }

      setCommentText('')
      setShowCommentInput(false)

      const newCount = (post.comments_count || 0) + 1
      await supabaseClient
        .from('posts')
        .update({ comments_count: newCount })
        .eq('id', post.id)

      await loadComments()
    } catch (error) {
      setError2('Ошибка при добавлении комментария')
    }
  }

  const handleDeletePost = async () => {
    if (!userId || !cardData) return
    
    if (!window.confirm('Вы уверены, что хотите удалить этот пост?')) {
      return
    }

    setIsDeleting(true)
    try {
      const supabaseClient = await getSupabaseWithSession()

      const { error: deleteError } = await supabaseClient
        .from('posts')
        .delete()
        .eq('id', post.id)

      if (deleteError) throw deleteError

      if (onPostDeleted) {
        onPostDeleted(post.id)
      } else if (isFavoritesPage && onRemoveFromFavorites) {
        onRemoveFromFavorites()
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      setError2('Ошибка при удалении поста')
    } finally {
      setIsDeleting(false)
    }
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-red-50 border-b border-red-100">
          <div className="flex items-center text-red-700">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span className="font-medium">Ошибка загрузки</span>
          </div>
          <p className="text-red-600 text-sm mt-1 mb-3">{(error as Error).message}</p>
          <Button onClick={handleRetry} variant="outline" size="sm" className="flex items-center text-xs">
            <RefreshCw className="h-3 w-3 mr-1" />
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading || !cardData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 ${styles.postCard}`}>
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 cursor-pointer ring-2 ring-white shadow-sm hover:ring-blue-100 transition-all duration-200">
              <AvatarImage src={cardData.space?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-50 to-indigo-100 text-indigo-800 font-normal">
                {cardData.space?.name?.charAt(0)?.toUpperCase() || 'S'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 
                className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors duration-200"
                onClick={() => cardData.space && router.push(`/space/${cardData.space.id}`)}
              >
                {cardData.space?.name || 'Space'}
              </h3>
              <div className="flex items-center space-x-2 mt-0.5">
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(post.created_at).toLocaleDateString('ru-RU')}
                </p>
                {cardData.folderName && (
                  <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    <Folder className="h-3 w-3 mr-1" />
                    {cardData.folderName}
                  </div>
                )}
              </div>
            </div>
          </div>

          {userId && cardData.space?.owner_id !== userId && (
            <Button 
              variant={isSubscribed ? "default" : "outline"} 
              size="sm"
              className="rounded-full h-8 px-3 text-xs font-normal transition-all duration-200 hover:shadow-sm"
              onClick={handleSubscribe}
            >
              <Users className="h-3 w-3 mr-1.5" />
              {isSubscribed ? 'Подписан' : 'Подписаться'}
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 cursor-pointer" onClick={onClick}>
        {post.content && (
          <p className="text-gray-800 mb-4 leading-relaxed">{post.content}</p>
        )}

        {cardData.hashtags && cardData.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {cardData.hashtags.map((hashtag, index) => (
              <span key={index} className="inline-block text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full hover:bg-blue-100 transition-colors">
                #{hashtag}
              </span>
            ))}
          </div>
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

      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 px-2 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-500 transition-colors duration-200"
            onClick={handleLike}
          >
            <Heart className={`h-4 w-4 mr-1 ${isLiked ? "fill-current text-red-500" : ""}`} />
            <span className="text-sm">{likeCount}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 px-2 rounded-lg hover:bg-blue-50 text-gray-600 hover:text-blue-500 transition-colors duration-200"
            onClick={() => {
              setShowCommentInput(!showCommentInput)
              if (!showCommentInput && comments.length === 0) {
                loadComments()
              }
            }}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            <span className="text-sm">{post.comments_count || 0}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 px-2 rounded-lg hover:bg-yellow-50 text-gray-600 hover:text-yellow-500 transition-colors duration-200"
            onClick={handleFavorite}
          >
            <Star className={`h-4 w-4 mr-1 ${isFavorited ? "fill-current text-yellow-500" : ""}`} />
            <span className="text-sm sr-only md:not-sr-only">
              {isFavoritesPage ? 'Убрать' : 'В избранное'}
            </span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 px-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors duration-200 hidden sm:flex"
          >
            <Share2 className="h-4 w-4 mr-1" />
            <span className="text-sm sr-only md:not-sr-only">Поделиться</span>
          </Button>
        </div>

        <div className="flex items-center space-x-1">
          {userId && cardData.space?.owner_id === userId && (
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 px-2 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-500 transition-colors duration-200"
              onClick={handleDeletePost}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center text-xs text-gray-500">
            <Users className="h-3.5 w-3.5 mr-1" />
            {followerCount}
          </div>
        </div>
      </div>

      {error2 && (
        <div className="px-4 py-3 bg-red-50 border-t border-red-100">
          <p className="text-red-600 text-sm">{error2}</p>
        </div>
      )}

      {showCommentInput && (
        <div className="px-4 py-3 border-t border-gray-100 bg-white">
          <div className="flex space-x-2">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Напишите комментарий..."
              className="flex-1 h-10 text-sm rounded-lg border-gray-200"
            />
            <Button 
              onClick={handleComment}
              disabled={!commentText.trim()}
              className="h-10 px-3 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white"
            >
              Отправить
            </Button>
          </div>
        </div>
      )}

      {comments.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/30">
          <h4 className="font-semibold text-gray-900 text-sm mb-2">Комментарии ({post.comments_count || 0})</h4>
          <div className="space-y-3">
            {comments.slice(0, showAllComments ? comments.length : 3).map((comment) => (
              <div key={comment.id} className="flex items-start space-x-2.5">
                <Avatar className="h-7 w-7 ring-1 ring-white shadow-xs">
                  <AvatarImage src={comment.space?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 text-xs">
                    {comment.space?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-gray-900 truncate">
                      {comment.space?.name || 'Unknown User'}
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(comment.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))}
            {comments.length > 3 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs rounded-lg"
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
