'use client'

import { useSupabaseAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SpaceForm } from '@/components/space/SpaceForm'

export default function NewSpacePage() {
  const { userId } = useSupabaseAuth()
  const router = useRouter()

  if (!userId) {
    // Redirect if user is not authenticated
    router.push('/')
    return null
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Создать новое пространство</h1>
        <Button variant="outline" onClick={() => router.push('/profile')}>
          Отмена
        </Button>
      </div>
      
      <SpaceForm />
    </div>
  )
}