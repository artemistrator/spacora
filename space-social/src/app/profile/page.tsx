'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseAuth } from '@/lib/auth'
import { executeSupabaseQuery } from '@/lib/request-manager'

import { SpaceCard } from '@/components/space/SpaceCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react'

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

export default function ProfilePage() {
  const router = useRouter()
  const { getSupabaseWithSession, userId } = useSupabaseAuth()
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [maxRetries] = useState(3) // Limit retries to prevent infinite loops

  useEffect(() => {
    const fetchSpaces = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      if (retryCount >= maxRetries) {
        setError(`Не удалось загрузить пространства после ${maxRetries} попыток. Пожалуйста, обновите страницу.`)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const supabaseClient = await getSupabaseWithSession()
        
        const data = await executeSupabaseQuery(async () => {
          const { data, error } = await supabaseClient
            .from('spaces')
            .select('*')
            .eq('owner_id', userId)
            .order('created_at', { ascending: false })
          
          if (error) throw error
          return data
        }, 8000)

        setSpaces(data || [])
      } catch (error: any) {
        if (error.message === 'Failed to fetch' || error.message === 'Request timeout') {
          setError('Проблемы с подключением к серверу. Проверьте интернет-соединение.')
          if (retryCount < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 10000)
            setTimeout(() => {
              setRetryCount(prev => prev + 1)
            }, delay)
            return
          }
        } else {
          setError('Не удалось загрузить пространства. Пожалуйста, попробуйте обновить страницу.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchSpaces()
  }, [userId, retryCount, maxRetries])

  const handleRetry = () => {
    setRetryCount(0) // Reset retry count when manually retrying
    setError(null)
    // Trigger reload by updating retryCount
    setRetryCount(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="p-4 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Мои пространства</h1>
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

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Мои пространства</h1>
        <Button onClick={() => router.push('/spaces/new')}>
          Создать пространство
        </Button>
      </div>

      {spaces.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">У вас пока нет пространств</p>
          <Button onClick={() => router.push('/spaces/new')}>
            Создать первое пространство
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((space) => (
            <SpaceCard 
              key={space.id} 
              space={space} 
              onClick={() => router.push(`/space/${space.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}