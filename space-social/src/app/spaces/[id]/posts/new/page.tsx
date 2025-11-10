'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSupabaseAuth } from '@/lib/auth'
import { getFoldersBySpaceId } from '@/lib/folder-utils'
import { updateSpacePostsCount } from '@/lib/counter-utils'
import { Plus, X, Upload, FolderPlus } from 'lucide-react'
import { FolderModal } from '@/components/space/FolderModal'

interface Space {
  id: string
  name: string
  description: string
  location: string
  space_type: string
  is_public: boolean
  owner_id: string
}

interface FolderType {
  id: string
  name: string
  description?: string
  space_id: string
  posts_count: number
  created_at: string
  updated_at: string
}

export default function NewPostPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { getSupabaseWithSession, userId } = useSupabaseAuth()
  const [space, setSpace] = useState<Space | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [content, setContent] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [folders, setFolders] = useState<FolderType[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string>("none")
  const [showFolderModal, setShowFolderModal] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Unwrap the params
  const unwrappedParams = { id: '' }

  useEffect(() => {
    fetchSpace()
  }, [unwrappedParams.id, userId, getSupabaseWithSession])

  const fetchSpace = async () => {
    if (unwrappedParams.id && userId) {
      try {
        const supabaseClient = await getSupabaseWithSession()
        
        // Fetch space
        const { data: spaceData, error: spaceError } = await supabaseClient
          .from('spaces')
          .select('*')
          .eq('id', unwrappedParams.id)
          .maybeSingle() // Changed from .single() to .maybeSingle()

        if (spaceError) {
          console.error('Error fetching space:', spaceError)
          router.push('/profile')
          return
        }
        
        // If space doesn't exist, redirect
        if (!spaceData) {
          router.push('/profile')
          return
        }
        
        setSpace(spaceData)
        
        // Check if user is owner
        if (spaceData.owner_id === userId) {
          setIsOwner(true)
          
          // Fetch folders for this space
          const fetchedFolders = await getFoldersBySpaceId(unwrappedParams.id)
          setFolders(fetchedFolders)
        } else {
          // Redirect if user is not owner
          router.push(`/space/${unwrappedParams.id}`)
        }
      } catch (error) {
        console.error('Error fetching space:', error)
        router.push('/profile')
      }
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      processFiles(files)
    }
  }

  const processFiles = (files: File[]) => {
    setImages(prev => [...prev, ...files])
    
    // Create preview URLs
    const urls = files.map(file => URL.createObjectURL(file))
    setPreviewUrls(prev => [...prev, ...urls])
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files)
      // Filter only image files
      const imageFiles = files.filter(file => file.type.startsWith('image/'))
      processFiles(imageFiles)
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)
    
    const newUrls = [...previewUrls]
    const removedUrl = newUrls.splice(index, 1)[0]
    setPreviewUrls(newUrls)
    
    // Revoke the object URL to free memory
    URL.revokeObjectURL(removedUrl)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && images.length === 0) return
    
    setLoading(true)
    
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // Upload images to storage if any
      let imageUrls: string[] = []
      if (images.length > 0) {
        // Create a unique folder for this post
        const timestamp = Date.now()
        const folderName = `${unwrappedParams.id}/${timestamp}`
        
        // Upload each image
        for (const image of images) {
          const fileExt = image.name.split('.').pop()
          const fileName = `${folderName}/${Math.random()}.${fileExt}`
          
          const { error: uploadError } = await supabaseClient.storage
            .from('post-images')
            .upload(fileName, image)
            
          if (uploadError) {
            console.error('Error uploading image:', uploadError)
            throw uploadError
          }
          
          // Get public URL
          const { data: { publicUrl } } = supabaseClient.storage
            .from('post-images')
            .getPublicUrl(fileName)
            
          imageUrls.push(publicUrl)
        }
      }
      
      // Create post
      const postData: any = {
        space_id: unwrappedParams.id,
        content: content.trim(),
        images: imageUrls
      }
      
      // Add folder_id if selected
      if (selectedFolderId && selectedFolderId !== "none") {
        postData.folder_id = selectedFolderId
      }
      
      const { data: postDataResult, error: postError } = await supabaseClient
        .from('posts')
        .insert(postData)
        .select()
        .maybeSingle() // Changed from .single() to .maybeSingle()
        
      if (postError) {
        console.error('Error creating post:', postError)
        throw postError
      }
      
      // Update space posts count
      await updateSpacePostsCount(unwrappedParams.id, true)
      
      // Redirect to space page
      router.push(`/space/${unwrappedParams.id}`)
      router.refresh()
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Ошибка при создании поста. Пожалуйста, попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  const handleFolderSubmit = async (folderData: Omit<FolderType, 'id' | 'posts_count' | 'created_at' | 'updated_at' | 'space_id'>) => {
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // Create new folder
      const { data: newFolder, error } = await supabaseClient
        .from('folders')
        .insert({ ...folderData, space_id: unwrappedParams.id })
        .select()
        .maybeSingle() // Changed from .single() to .maybeSingle()
        
      if (error) {
        console.error('Error creating folder:', error)
        alert('Ошибка при создании папки. Пожалуйста, попробуйте снова.')
        return
      }
      
      // Add new folder to the list
      setFolders(prev => [...prev, newFolder as FolderType])
      
      // Select the new folder
      setSelectedFolderId(newFolder.id)
      
      // Close the modal
      setShowFolderModal(false)
    } catch (error) {
      console.error('Error creating folder:', error)
      alert('Ошибка при создании папки. Пожалуйста, попробуйте снова.')
    }
  }

  if (!isOwner) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-xl font-bold mb-2">Доступ запрещен</h2>
          <p className="text-gray-500 mb-4">У вас нет прав для создания постов в этом пространстве.</p>
          <Button onClick={() => router.push(`/space/${unwrappedParams.id}`)}>
            Вернуться к пространству
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Создать новый пост</CardTitle>
          <CardDescription>
            Поделитесь своими мыслями и фотографиями с сообществом
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="folder">Папка (опционально)</Label>
              <div className="flex gap-2">
                <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Выберите папку" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без папки</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={() => setShowFolderModal(true)}
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Содержание</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Что вы хотите рассказать?"
                rows={6}
              />
            </div>
            
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageChange}
              />
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Перетащите изображения сюда или нажмите для выбора
              </p>
              <p className="text-xs text-gray-500">
                Можно выбрать несколько изображений
              </p>
            </div>
            
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={url} 
                      alt={`Preview ${index + 1}`} 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveImage(index)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push(`/space/${unwrappedParams.id}`)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={loading || (!content.trim() && images.length === 0)}>
                {loading ? 'Публикация...' : 'Опубликовать'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {showFolderModal && (
        <FolderModal
          folder={null}
          onClose={() => setShowFolderModal(false)}
          onSubmit={handleFolderSubmit}
        />
      )}
    </div>
  )
}