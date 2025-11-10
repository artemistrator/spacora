'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'

export default function EditProfilePage() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (isSignedIn && user) {
      setFirstName(user.firstName || '')
      setLastName(user.lastName || '')
      setAvatarUrl(user.imageUrl || '')
      fetchUserProfile()
    }
  }, [isSignedIn, user])

  const fetchUserProfile = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('users')
        .select('bio')
        .eq('id', user.id)
        .maybeSingle() // Changed from .single() to .maybeSingle()

      if (error) {
        // Если пользователя нет в таблице, это нормально
        return
      }

      // Если данные есть, устанавливаем их
      if (data) {
        setBio(data.bio || '')
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarUploading(true)
    
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('user-avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        throw error
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(fileName)

      setAvatarUrl(publicUrl)
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Ошибка при загрузке аватарки')
    } finally {
      setAvatarUploading(false)
      // Reset input
      if (e.target) {
        e.target.value = ''
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return;
    
    setIsUpdating(true)
    
    try {
      // Обновим информацию в Clerk
      await user?.update({
        firstName,
        lastName,
        // Note: Clerk doesn't directly support updating imageUrl through this method
        // We'll store it in our own database
      })
      
      // Обновим информацию в нашей базе данных
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: user?.id,
          name: `${firstName} ${lastName}`,
          email: user?.primaryEmailAddress?.emailAddress,
          avatar_url: avatarUrl,
          bio: bio,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (upsertError) throw upsertError
      
      router.push('/profile')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Ошибка при обновлении профиля. Пожалуйста, попробуйте снова.')
    } finally {
      setIsUpdating(false)
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
            <CardTitle>Редактировать профиль</CardTitle>
            <CardDescription>
              Обновите информацию о себе
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl || undefined} alt={`${firstName} ${lastName}`} />
                    <AvatarFallback className="text-2xl">
                      {firstName?.charAt(0)}
                      {lastName?.charAt(0) || firstName?.charAt(1) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={avatarUploading}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label htmlFor="avatar-upload">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="rounded-full p-2 h-8 w-8"
                        disabled={avatarUploading}
                      >
                        {avatarUploading ? '⏳' : '📷'}
                      </Button>
                    </label>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {avatarUploading ? 'Загрузка...' : 'Нажмите на иконку камеры, чтобы изменить аватар'}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="firstName">Имя</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Фамилия</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">О себе</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Расскажите немного о себе..."
                  rows={4}
                />
              </div>
              
              <div className="flex gap-4">
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Сохранение...' : 'Сохранить'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/profile')}
                >
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}