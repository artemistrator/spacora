'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSupabaseAuth } from '@/lib/auth'
import { SpaceForm } from '@/components/space/SpaceForm'

interface Space {
  id: string
  name: string
  description: string
  location: string
  space_type: string
  is_public: boolean
  owner_id: string
}

export default function EditSpacePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { getSupabaseWithSession, userId } = useSupabaseAuth()
  const [space, setSpace] = useState<Space | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)

  // Unwrap the params
  const unwrappedParams = { id: '' }

  useEffect(() => {
    const fetchSpace = async () => {
      if (!unwrappedParams.id || !userId) {
        router.push('/')
        return
      }

      try {
        const supabaseClient = await getSupabaseWithSession()
        const { data: spaceData, error: spaceError } = await supabaseClient
          .from('spaces')
          .select('*')
          .eq('id', unwrappedParams.id)
          .maybeSingle() // Changed from .single() to .maybeSingle()

        if (spaceError) throw spaceError
        
        // If space doesn't exist, redirect
        if (!spaceData) {
          router.push('/')
          return
        }
        
        setSpace(spaceData)
        
        // Check if user is owner
        console.log('Checking ownership:', { userId, spaceOwnerId: spaceData.owner_id });
        if (userId && spaceData.owner_id === userId) {
          console.log('User is owner, setting isOwner to true');
          setIsOwner(true);
        } else {
          console.log('User is not owner, redirecting');
          // Redirect if user is not owner
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching space:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchSpace()
  }, [unwrappedParams.id, userId, getSupabaseWithSession, router])

  if (loading) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-1/3 mb-6" />
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-1/4" />
        </div>
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-xl font-bold mb-2">Доступ запрещен</h2>
          <p className="text-gray-500 mb-4">У вас нет прав для редактирования этого пространства.</p>
          <Button onClick={() => router.push('/')}>
            Вернуться на главную
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Редактировать пространство</h1>
        <Button variant="outline" onClick={() => router.push(`/space/${unwrappedParams.id}`)}>
          Отмена
        </Button>
      </div>
      
      {space && <SpaceForm space={space} />}
    </div>
  )
}