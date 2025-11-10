'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSupabaseAuth } from '@/lib/auth'
import { PostCard } from '@/components/post/PostCard'
import { FolderList } from '@/components/space/FolderList'
import { executeSupabaseQuery } from '@/lib/request-manager'
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
  console.log('SpacePageContent rendered with id:', id)
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
  const [maxRetries] = useState(3) // Limit retries to prevent infinite loops

  // Use the id parameter directly
  const unwrappedParams = { id }

  useEffect(() => {
    console.log('SpacePageContent useEffect triggered with id:', id)
    const fetchSpaceAndPosts = async () => {
      console.log('SpacePageContent fetchSpaceAndPosts called with id:', id)
      if (!id || id.length === 0) {
        console.log('SpacePageContent: ID is empty or not provided')
        setError('ID пространства не указан')
        setLoading(false)
        return
      }

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
        
        // Fetch space details
        console.log('SpacePageContent: Fetching space details for id:', unwrappedParams.id);
        const spaceData = await executeSupabaseQuery(async () => {
          const { data, error } = await supabaseClient
            .from('spaces')
            .select('*')
            .eq('id', unwrappedParams.id)
            .single();
          
          if (error) throw error;
          return data;
        }, 3000);
        
        setSpace(spaceData)
        
        // Small delay before next request
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if user is owner
        if (userId && spaceData.owner_id === userId) {
          setIsOwner(true)
        } else if (userId) {
          // Small delay before next request
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Check if user is subscribed
          try {
            console.log('SpacePageContent: Checking subscription for user:', userId, 'space:', spaceData.id);
            const subscriptionData = await executeSupabaseQuery(async () => {
              const { data, error } = await supabaseClient
                .from('user_spaces')
                .select('*')
                .eq('clerk_id', userId)
                .eq('space_id', spaceData.id)
                .maybeSingle(); // Changed from .single() to .maybeSingle()
              
              if (error) throw error;
              return data;
            }, 3000);
            
            if (subscriptionData) {
              setIsSubscribed(true)
            }
          } catch (subscriptionError) {
            console.warn('Error checking subscription:', subscriptionError)
          }
        }
        
        // Small delay before next request
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Fetch posts for this space
        console.log('SpacePageContent: Fetching posts for space:', unwrappedParams.id);
        const postsData = await executeSupabaseQuery(async () => {
          let query = supabaseClient
            .from('posts')
            .select('*')
            .eq('space_id', unwrappedParams.id)
            .order('created_at', { ascending: false });
            
          // Filter by folder if selected
          if (selectedFolderId) {
            query = query.eq('folder_id', selectedFolderId);
          } else if (selectedFolderId === null) {
            // Show posts with no folder when "All posts" is selected
            query = query.is('folder_id', null);
          }
          
          const { data, error } = await query;
          if (error) throw error;
          return data;
        }, 3000);

        setPosts(postsData || [])
        console.log('SpacePageContent: Completed fetching data for space:', unwrappedParams.id);
      } catch (err: any) {
        console.error('Error fetching space and posts:', err)
        
        // Handle network errors specifically
        if (err.message === 'Failed to fetch' || err.message === 'Request timeout') {
          setError('Проблемы с подключением к серверу. Проверьте интернет-соединение и попробуйте снова.')
          // Only retry if we haven't exceeded max retries
          if (retryCount < maxRetries) {
            // Exponential backoff - wait longer between retries
            const delay = Math.min(1000 * Math.pow(2, retryCount), 5000) // Max 5 seconds
            console.log('SpacePageContent: Retrying in', delay, 'ms');
            setTimeout(() => {
              setRetryCount(prev => prev + 1)
            }, delay)
            return // Don't set loading to false yet, we're retrying
          }
        } else if (err.message) {
          setError(`Ошибка загрузки данных: ${err.message}`)
        } else {
          setError('Не удалось загрузить данные. Пожалуйста, попробуйте обновить страницу.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchSpaceAndPosts()
  }, [id, userId, getSupabaseWithSession, selectedFolderId, retryCount, maxRetries])

  const handleRetry = () => {
    // Reset error and trigger reload
    setRetryCount(0) // Reset retry count when manually retrying
    setError(null)
    setRetryCount(prev => prev + 1)
  }

  const handleDeleteSpace = async () => {
    if (!isOwner || !space) return

    try {
      console.log('Attempting to delete space:', space.id)
      console.log('User ID for deletion:', userId)
      
      const supabaseClient = await getSupabaseWithSession()
      console.log('Supabase client created for deletion')
      
      // First, let's check if the space exists and if the user is the owner
      const { data: spaceCheck, error: checkError } = await supabaseClient
        .from('spaces')
        .select('id, owner_id')
        .eq('id', space.id)
        .maybeSingle() // Changed from .single() to .maybeSingle()
        
      console.log('Space check result for deletion:', { spaceCheck, checkError })
      
      if (checkError) {
        console.error('Error checking space for deletion:', checkError)
        throw checkError
      }
      
      if (!spaceCheck) {
        throw new Error('Space not found for deletion')
      }
      
      if (spaceCheck.owner_id !== userId) {
        throw new Error('User is not the owner of this space for deletion')
      }
      
      // Delete all related data first to avoid foreign key constraint violations
      // Delete favorites related to posts in this space
      const { error: favoritesError } = await supabaseClient
        .from('favorites')
        .delete()
        .in('post_id', posts.map(post => post.id))
      
      if (favoritesError) {
        console.error('Error deleting favorites:', favoritesError)
        // Don't throw error here, continue with deletion
      }
      
      // Delete post reactions related to posts in this space
      const { error: reactionsError } = await supabaseClient
        .from('post_reactions')
        .delete()
        .in('post_id', posts.map(post => post.id))
      
      if (reactionsError) {
        console.error('Error deleting post reactions:', reactionsError)
        // Don't throw error here, continue with deletion
      }
      
      // Delete posts in this space
      const { error: postsError } = await supabaseClient
        .from('posts')
        .delete()
        .eq('space_id', space.id)
      
      if (postsError) {
        console.error('Error deleting posts:', postsError)
        // Don't throw error here, continue with deletion
      }
      
      // Delete user space subscriptions
      const { error: userSpacesError } = await supabaseClient
        .from('user_spaces')
        .delete()
        .eq('space_id', space.id)
      
      if (userSpacesError) {
        console.error('Error deleting user spaces:', userSpacesError)
        // Don't throw error here, continue with deletion
      }
      
      // Delete AI replacement jobs
      const { error: aiJobsError } = await supabaseClient
        .from('ai_replacement_jobs')
        .delete()
        .eq('space_id', space.id)
      
      if (aiJobsError) {
        console.error('Error deleting AI jobs:', aiJobsError)
        // Don't throw error here, continue with deletion
      }
      
      // Delete space stats
      const { error: spaceStatsError } = await supabaseClient
        .from('space_stats')
        .delete()
        .eq('space_id', space.id)
      
      if (spaceStatsError) {
        console.error('Error deleting space stats:', spaceStatsError)
        // Don't throw error here, continue with deletion
      }
      
      // Finally, delete the space itself
      const { error, data } = await supabaseClient
        .from('spaces')
        .delete()
        .eq('id', space.id)

      console.log('Delete result:', { error, data })

      if (error) {
        console.error('Error deleting space:', error)
        throw error
      }

      console.log('Space deleted successfully')
      // Redirect to profile page
      router.push('/profile')
      router.refresh()
    } catch (error) {
      console.error('Error deleting space:', error)
      alert('Ошибка при удалении пространства. Пожалуйста, попробуйте снова.')
    }
  }

  const handleCreatePost = () => {
    router.push(`/space/${unwrappedParams.id}/create-post`)
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
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
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
              <Button variant="outline" onClick={() => router.push(`/space/${space.id}/edit`)} className="flex items-center">
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
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function SpacePage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params promise
  const [unwrappedParams, setUnwrappedParams] = useState({ id: '' })
  
  useEffect(() => {
    console.log('SpacePage received params:', params)
    params.then(resolvedParams => {
      console.log('SpacePage resolved params:', resolvedParams)
      setUnwrappedParams(resolvedParams)
    }).catch(error => {
      console.error('SpacePage error resolving params:', error)
    })
  }, [params])
  
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <SpacePageContent id={unwrappedParams.id} />
    </Suspense>
  )
}