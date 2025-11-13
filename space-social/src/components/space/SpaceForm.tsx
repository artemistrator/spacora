'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseAuth } from '@/lib/auth';
import { getOrCreateSupabaseUserId } from '@/lib/user-mapping';
import { ImageUpload } from '@/components/upload/ImageUpload';

export function SpaceForm({ space }: { space?: any }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(space?.name || '');
  const [description, setDescription] = useState(space?.description || '');
  const [spaceType, setSpaceType] = useState(space?.space_type || 'apartment');
  const [location, setLocation] = useState(space?.location || '');
  const [isPublic, setIsPublic] = useState(space?.is_public ?? true);
  const [style, setStyle] = useState(space?.style || '');
  const [areaMm2, setAreaMm2] = useState(space?.area_m2 || '');
  const [avatarUrl, setAvatarUrl] = useState(space?.avatar_url || '');
  const [coverUrl, setCoverUrl] = useState(space?.cover_url || '');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Проверим, что у нас есть userId
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      console.log('User ID:', userId);
      
      // Получим клиент Supabase с правильной аутентификацией
      const supabaseClient = await getSupabaseWithSession();
      console.log('Supabase client created');
      
      // Получаем правильный UUID для пользователя
      const supabaseUserId = await getOrCreateSupabaseUserId(userId);
      
      if (!supabaseUserId) {
        throw new Error('Failed to get Supabase user ID');
      }
      
      console.log('Supabase User ID:', supabaseUserId);
      
      if (space) {
        // Update existing space
        const data = {
          name,
          description,
          space_type: spaceType,
          location,
          is_public: isPublic,
          style: style || null,
          area_m2: areaMm2 ? parseFloat(areaMm2) : null,
          avatar_url: avatarUrl || null,
          cover_url: coverUrl || null,
          updated_at: new Date().toISOString(),
        };
        
        console.log('Updating space with data:', { ...data, id: space.id });
        console.log('User ID for update:', userId);
        
        // First, let's check if the space exists and if the user is the owner
        const { data: spaceCheck, error: checkError } = await supabaseClient
          .from('spaces')
          .select('id, owner_id')
          .eq('id', space.id)
          .single();
          
        console.log('Space check result:', { spaceCheck, checkError });
        
        if (checkError) {
          console.error('Error checking space:', checkError);
          throw checkError;
        }
        
        if (!spaceCheck) {
          throw new Error('Space not found');
        }
        
        if (spaceCheck.owner_id !== supabaseUserId) {
          throw new Error('User is not the owner of this space');
        }
        
        // Now try to update
        const { data: result, error } = await supabaseClient
          .from('spaces')
          .update(data)
          .eq('id', space.id)
          .select();

        console.log('Update result:', { result, error });

        if (error) {
          console.error('Update error details:', error);
          throw error;
        }
        
        // Invalidate all related queries
        await queryClient.invalidateQueries({ queryKey: ['post-card'] });
        await queryClient.invalidateQueries({ queryKey: ['spaces'] });
        
        console.log('Update result:', result);
      } else {
        // Create new space
        // The database trigger will automatically create the user if needed
        const data = {
          name,
          description,
          space_type: spaceType,
          location,
          is_public: isPublic,
          style: style || null,
          area_m2: areaMm2 ? parseFloat(areaMm2) : null,
          avatar_url: avatarUrl || null,
          cover_url: coverUrl || null,
          updated_at: new Date().toISOString(),
          owner_id: supabaseUserId, // Use the Supabase UUID
        };
        
        console.log('Creating space with data:', data);
        const { data: result, error } = await supabaseClient
          .from('spaces')
          .insert(data)
          .select();

        if (error) {
          console.error('Insert error details:', error);
          throw error;
        }
        
        // Invalidate spaces query for new spaces
        await queryClient.invalidateQueries({ queryKey: ['spaces'] });
        
        // Also invalidate the user's spaces query to ensure profile page updates
        await queryClient.invalidateQueries({ queryKey: ['user-spaces', supabaseUserId] });
        
        console.log('Insert result:', result);
        
        // После успешного создания пространства переходим на страницу просмотра созданного пространства
        if (result && result[0]) {
          try {
            router.push(`/space/${result[0].id}`);
            router.refresh();
          } catch (redirectError) {
            console.log('Redirect handled', redirectError);
            window.location.href = `/space/${result[0].id}`;
          }
          return; // Выходим из функции, чтобы не выполнять редирект внизу
        }
      }

      // Для обновления существующего пространства возвращаемся на главную
      try {
        router.push('/');
        router.refresh();
      } catch (redirectError) {
        console.log('Redirect handled', redirectError);
        window.location.href = '/';
      }
    } catch (error: any) {
      console.error('Error saving space:', error);
      const errorMessage = error?.message || 'Неизвестная ошибка при сохранении пространства';
      alert(`Ошибка при сохранении пространства: ${errorMessage}. Пожалуйста, попробуйте снова.`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Название
        </label>
        <Input
          id="name"
          placeholder="Название вашего пространства"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <p className="text-sm text-muted-foreground mt-1">
          Название будет отображаться в профиле вашего пространства.
        </p>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Описание
        </label>
        <Textarea
          id="description"
          placeholder="Расскажите о вашем пространстве"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Краткое описание вашего пространства.
        </p>
      </div>

      <div>
        <label htmlFor="space_type" className="block text-sm font-medium mb-1">
          Тип пространства
        </label>
        <select
          id="space_type"
          value={spaceType}
          onChange={(e) => setSpaceType(e.target.value as any)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-10"
        >
          <option value="apartment">Квартира</option>
          <option value="house">Дом</option>
          <option value="studio">Студия</option>
          <option value="loft">Лофт</option>
          <option value="room">Комната</option>
        </select>
        <p className="text-sm text-muted-foreground mt-1">
          Выберите тип вашего жилого пространства.
        </p>
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium mb-1">
          Местоположение
        </label>
        <Input
          id="location"
          placeholder="Город, страна"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Где находится ваше пространство.
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <input
          id="is_public"
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="is_public" className="text-sm font-medium">
          Публичное пространство
        </label>
      </div>
      <p className="text-sm text-muted-foreground ml-6">
        Сделать пространство видимым для всех пользователей.
      </p>

      <div>
        <label htmlFor="style" className="block text-sm font-medium mb-1">
          Стиль пространства
        </label>
        <Input
          id="style"
          placeholder="Например: Скандинавский, Минимализм, Лофт"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Опишите стиль вашего пространства.
        </p>
      </div>

      <div>
        <label htmlFor="area_m2" className="block text-sm font-medium mb-1">
          Площадь (кв.м)
        </label>
        <Input
          id="area_m2"
          placeholder="Например: 45.5"
          type="number"
          step="0.01"
          value={areaMm2}
          onChange={(e) => setAreaMm2(e.target.value)}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Укажите площадь вашего пространства в квадратных метрах.
        </p>
      </div>

      <div>
        <label htmlFor="avatar" className="block text-sm font-medium mb-1">
          Аватарка пространства
        </label>
        {avatarUrl && (
          <div className="mb-3">
            <img src={avatarUrl} alt="Avatar" className="h-20 w-20 rounded-lg object-cover border border-gray-200" />
            <button
              type="button"
              onClick={() => setAvatarUrl('')}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Удалить
            </button>
          </div>
        )}
        <ImageUpload 
          onUploadComplete={(url) => setAvatarUrl(url)} 
          maxFiles={1}
          bucket="post-images"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Загрузите аватарку для вашего пространства.
        </p>
      </div>

      <div>
        <label htmlFor="cover" className="block text-sm font-medium mb-1">
          Обложка пространства
        </label>
        {coverUrl && (
          <div className="mb-3">
            <img src={coverUrl} alt="Cover" className="h-32 w-full rounded-lg object-cover border border-gray-200" />
            <button
              type="button"
              onClick={() => setCoverUrl('')}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Удалить
            </button>
          </div>
        )}
        <ImageUpload 
          onUploadComplete={(url) => setCoverUrl(url)} 
          maxFiles={1}
          bucket="post-images"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Загрузите обложку для вашего пространства.
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Сохранение...' : space ? 'Обновить' : 'Создать'}
      </Button>
    </form>
  );
}