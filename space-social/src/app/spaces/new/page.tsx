'use client'

import { useSupabaseAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SpaceForm } from '@/components/space/SpaceForm'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function NewSpacePage() {
  const { userId } = useSupabaseAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSuccess, setShowSuccess] = useState(false)

  // Проверяем, есть ли параметр success в URL
  useEffect(() => {
    if (searchParams?.get('success') === 'true') {
      setShowSuccess(true)
      // Убираем параметр из URL через 3 секунды
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

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
      
      {showSuccess && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md">
          Пространство успешно создано!
        </div>
      )}
      
      <SpaceForm />
    </div>
  )
}