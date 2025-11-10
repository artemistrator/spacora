'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { PostForm } from '@/components/post/PostForm'

export default function CreatePostPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const spaceId = params.id
  const userId = user?.id

  useEffect(() => {
    if (!isSignedIn || !userId) {
      router.push('/sign-in')
      return
    }

    checkSpaceAccess()
  }, [isSignedIn, userId, spaceId])

  const checkSpaceAccess = async () => {
    try {
      const { data, error } = await supabase
        .from('spaces')
        .select('owner_id')
        .eq('id', spaceId)
        .maybeSingle() // Changed from .single() to .maybeSingle()

      if (error) throw error

      // If space doesn't exist or user is not the owner, redirect
      if (!data || data.owner_id !== userId) {
        router.push(`/space/${spaceId}`)
      }
    } catch (error) {
      console.error('Error checking space access:', error)
      router.push('/')
    }
  }

  if (!isSignedIn) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Создать пост</CardTitle>
            <CardDescription>
              Поделитесь фотографиями и вдохновением из вашего пространства
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PostForm spaceId={spaceId} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}