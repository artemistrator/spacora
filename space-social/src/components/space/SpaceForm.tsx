'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseAuth } from '@/lib/auth';

export function SpaceForm({ space }: { space?: any }) {
  const router = useRouter();
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(space?.name || '');
  const [description, setDescription] = useState(space?.description || '');
  const [spaceType, setSpaceType] = useState(space?.space_type || 'apartment');
  const [location, setLocation] = useState(space?.location || '');
  const [isPublic, setIsPublic] = useState(space?.is_public ?? true);

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
      
      const data = {
        name,
        description,
        space_type: spaceType,
        location,
        is_public: isPublic,
        updated_at: new Date().toISOString(),
        // Initialize counters when creating a new space
        followers_count: space ? undefined : 0,
        posts_count: space ? undefined : 0,
        likes_count: space ? undefined : 0,
        favorites_count: space ? undefined : 0,
      };

      if (space) {
        // Update existing space
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
        
        if (spaceCheck.owner_id !== userId) {
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
        
        console.log('Update result:', result);
      } else {
        // Create new space
        // The database trigger will automatically create the user if needed
        console.log('Creating space with data:', { ...data, owner_id: userId });
        const { data: result, error } = await supabaseClient
          .from('spaces')
          .insert({
            ...data,
            owner_id: userId, // Use the Clerk user ID directly
          })
          .select();

        if (error) {
          console.error('Insert error details:', error);
          throw error;
        }
        
        console.log('Insert result:', result);
      }

      // Redirect to spaces list or newly created space
      router.push('/');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving space:', error);
      // Покажем более подробное сообщение об ошибке
      alert(`Ошибка при сохранении пространства: ${error.message}. Пожалуйста, попробуйте снова.`);
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

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Сохранение...' : space ? 'Обновить' : 'Создать'}
      </Button>
    </form>
  );
}