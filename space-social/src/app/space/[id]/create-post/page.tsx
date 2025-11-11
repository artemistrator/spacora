'use client'

import { useRouter, useParams } from 'next/navigation'
import { PostForm } from '@/components/post/PostForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function CreatePostPage() {
  const router = useRouter()
  const params = useParams()
  const spaceId = params?.id as string

  if (!spaceId) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-xl font-bold mb-2">Ошибка</h2>
          <p className="text-gray-500 mb-4">ID пространства не найден</p>
          <Button onClick={() => router.back()}>
            Вернуться
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Создать пост</h1>
        <p className="text-gray-600 mt-1">Поделитесь контентом с сообществом</p>
      </div>

      <PostForm spaceId={spaceId} />
    </div>
  )
}
