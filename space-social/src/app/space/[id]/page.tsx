'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSupabaseAuth } from '@/lib/auth'
import { PostCard } from '@/components/post/PostCard'
import { FolderList } from '@/components/space/FolderList'
import { 
  Home, 
  Building, 
  DoorOpen, 
  Warehouse, 
  Bed,
  Users,
  Heart,
  Star,
  AlertTriangle,
  WifiOff,
  RefreshCw,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'

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
  avatar_url?: string
  cover_url?: string
  style?: string
  area_m2?: number
}

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

const spaceTypeIcons = {
  apartment: Home,
  house: Building,
  studio: DoorOpen,
  loft: Warehouse,
  room: Bed,
}

const spaceTypeLabels = {
  apartment: 'Квартира',
  house: 'Дом',
  studio: 'Студия',
  loft: 'Лофт',
  room: 'Комната',
}

function SpacePageContent({ id }: { id: string }) {
  const router = useRouter()
  const { getSupabaseWithSession, userId } = useSupabaseAuth()
  const [space, setSpace] = useState<Space | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [maxRetries] = useState(2)

  useEffect(() => {
    if (!id || id.length === 0) {
      setError('ID пространства не указан')
      setLoading(false)
      return
    }

    if (retryCount >= maxRetries) {
      setError(`Не удалось загрузить данные после ${maxRetries} попыток. Пожалуйста, обновите страницу.`)
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchSpaceAndPosts = async () => {
      try {
        setLoading(true)
        setError(null)
        const supabaseClient = await getSupabaseWithSession()
        if (cancelled) return
        
        const { data: spaceData, error: spaceError } = await supabaseClient
          .from('spaces')
          .select('*')
          .eq('id', id)
          .single()

        if (spaceError) throw spaceError
        if (cancelled) return

        setSpace(spaceData)

        if (userId && spaceData.owner_id === userId) {
          setIsOwner(true)
        } else if (userId) {
          const { data: subscriptionData } = await supabaseClient
            .from('user_spaces')
            .select('id')
            .eq('clerk_id', userId)
            .eq('space_id', spaceData.id)
            .maybeSingle()

          if (!cancelled && subscriptionData) {
            setIsSubscribed(true)
          }
        }

        if (cancelled) return

        let query = supabaseClient
          .from('posts')
          .select('*')
          .eq('space_id', id)
          .order('created_at', { ascending: false })

        // If selectedFolderId is a string ID, filter by that folder
        // If selectedFolderId is undefined (initial state before clicking folders), show all
        // If selectedFolderId is explicitly null (clicked "All posts"), show all
        if (selectedFolderId && typeof selectedFolderId === 'string') {
          query = query.eq('folder_id', selectedFolderId)
        }

        const { data: postsData, error: postsError } = await query

        if (postsError) throw postsError
        if (!cancelled) {
          setPosts(postsData || [])
        }
      } catch (err: any) {
        if (!cancelled) {
          if (err.message === 'Failed to fetch' || err.message === 'Request timeout') {
            setError('Проблемы с подключением. Попытка переподключения...')
            if (retryCount < maxRetries) {
              const delay = Math.min(1000 * Math.pow(2, retryCount), 5000)
              setTimeout(() => {
                setRetryCount(prev => prev + 1)
              }, delay)
              return
            }
          } else if (err.message) {
            setError(`Ошибка: ${err.message}`)
          } else {
            setError('Не удалось загрузить данные. Пожалуйста, обновите страницу.')
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchSpaceAndPosts()
    return () => {
      cancelled = true
    }
  }, [id, userId, selectedFolderId, retryCount, maxRetries])

  const handleRetry = () => {
    // Reset error and trigger reload
    setRetryCount(0) // Reset retry count when manually retrying
    setError(null)
    setRetryCount(prev => prev + 1)
  }

  const handleDeleteSpace = async () => {
    if (!isOwner || !space) return

    try {
      const supabaseClient = await getSupabaseWithSession()
      
      const { data: spaceCheck, error: checkError } = await supabaseClient
        .from('spaces')
        .select('id, owner_id')
        .eq('id', space.id)
        .maybeSingle()
        
      if (checkError) {
        throw checkError
      }
      
      if (!spaceCheck) {
        throw new Error('Space not found for deletion')
      }
      
      if (spaceCheck.owner_id !== userId) {
        throw new Error('User is not the owner of this space for deletion')
      }
      
      const { error: favoritesError } = await supabaseClient
        .from('favorites')
        .delete()
        .in('post_id', posts.map(post => post.id))
      
      const { error: reactionsError } = await supabaseClient
        .from('post_reactions')
        .delete()
        .in('post_id', posts.map(post => post.id))
      
      const { error: postsError } = await supabaseClient
        .from('posts')
        .delete()
        .eq('space_id', space.id)
      
      const { error: userSpacesError } = await supabaseClient
        .from('user_spaces')
        .delete()
        .eq('space_id', space.id)
      
      const { error: aiJobsError } = await supabaseClient
        .from('ai_replacement_jobs')
        .delete()
        .eq('space_id', space.id)
      
      const { error: spaceStatsError } = await supabaseClient
        .from('space_stats')
        .delete()
        .eq('space_id', space.id)
      
      const { error } = await supabaseClient
        .from('spaces')
        .delete()
        .eq('id', space.id)

      if (error) {
        throw error
      }

      router.push('/profile')
      router.refresh()
    } catch (error) {
      alert('Ошибка при удалении пространства. Пожалуйста, попробуйте снова.')
    }
  }

  const handleCreatePost = () => {
    router.push(`/space/${id}/create-post`)
  }

  if (loading) {
    return (
      <div className="p-4 max-w-6xl mx-auto">
        <div className="mb-6">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-4 w-2/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 max-w-6xl mx-auto">
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

  if (!space) {
    return (
      <div className="p-4 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-xl font-bold mb-2">Пространство не найдено</h2>
          <p className="text-gray-500 mb-4">Запрашиваемое пространство не существует или недоступно.</p>
          <Button onClick={() => router.push('/')}>
            Вернуться на главную
          </Button>
        </div>
      </div>
    )
  }

  const SpaceTypeIcon = spaceTypeIcons[space.space_type as keyof typeof spaceTypeIcons] || Home
  const spaceTypeLabel = spaceTypeLabels[space.space_type as keyof typeof spaceTypeLabels] || space.space_type

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {space.cover_url && (
        <div className="mb-6 rounded-lg overflow-hidden border border-gray-200">
          <img 
            src={space.cover_url} 
            alt="Space cover" 
            className="w-full h-48 object-cover"
          />
        </div>
      )}
      
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start space-x-4">
            {space.avatar_url && (
              <img 
                src={space.avatar_url} 
                alt={space.name}
                className="h-20 w-20 rounded-lg object-cover border-2 border-gray-200"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{space.name}</h1>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <SpaceTypeIcon className="h-4 w-4 mr-1" />
                <span>{spaceTypeLabel}</span>
                {space.location && (
                  <>
                    <span className="mx-2">•</span>
                    <span>📍 {space.location}</span>
                  </>
                )}
              </div>
              {space.style && (
                <p className="text-sm text-gray-600 mt-1">Стиль: {space.style}</p>
              )}
              {space.area_m2 && (
                <p className="text-sm text-gray-600">Площадь: {space.area_m2} кв.м</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {space.is_public ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                Публичное
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                Приватное
              </span>
            )}
            
            {userId && space.owner_id !== userId && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                {isSubscribed ? 'Подписан' : 'Не подписан'}
              </span>
            )}
          </div>
        </div>
        
        {space.description && (
          <p className="text-gray-600 mb-4">{space.description}</p>
        )}
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{space.followers_count || 0} подписчиков</span>
          </div>
          <div className="flex items-center">
            <span>Постов: {space.posts_count || 0}</span>
          </div>
          <div className="flex items-center">
            <Heart className="h-4 w-4 mr-1" />
            <span>{space.likes_count || 0} лайков</span>
          </div>
          <div className="flex items-center">
            <Star className="h-4 w-4 mr-1" />
            <span>{space.favorites_count || 0} в избранном</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          {userId && space.owner_id === userId && (
            <>
              <Button onClick={handleCreatePost} className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Создать пост
              </Button>
              <Button variant="outline" onClick={() => router.push(`/spaces/${space.id}/edit`)} className="flex items-center">
                <Edit className="h-4 w-4 mr-2" />
                Редактировать
              </Button>
              <Button variant="outline" onClick={handleDeleteSpace} className="flex items-center text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить
              </Button>
            </>
          )}
          
          {userId && space.owner_id !== userId && (
            <Button onClick={handleCreatePost} className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Создать пост
            </Button>
          )}
        </div>
      </div>
      
      <div className="mb-8">
        <FolderList 
          spaceId={space.id} 
          onFolderSelect={setSelectedFolderId}
          selectedFolderId={selectedFolderId}
        />
      </div>
      
      <h2 className="text-2xl font-bold mb-6">Посты</h2>
      
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            {selectedFolderId === null 
              ? 'В этом пространстве пока нет постов' 
              : 'В этой папке пока нет постов'}
          </p>
          {isOwner && (
            <Button onClick={handleCreatePost}>
              Создать первый пост
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              onClick={() => router.push(`/post/${post.id}`)}
              onPostDeleted={(postId) => {
                setPosts(prevPosts => prevPosts.filter(p => p.id !== postId))
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function SpacePage({ params }: { params: Promise<{ id: string }> }) {
  const [unwrappedParams, setUnwrappedParams] = useState({ id: '' })
  
  useEffect(() => {
    params.then(resolvedParams => {
      setUnwrappedParams(resolvedParams)
    }).catch(() => {})
  }, [params])
  
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <SpacePageContent id={unwrappedParams.id} />
    </Suspense>
  )
}