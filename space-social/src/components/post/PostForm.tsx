'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseAuth } from '@/lib/auth';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { ImageGallery } from '@/components/upload/ImageGallery';
import { getFoldersBySpaceId } from '@/lib/folder-utils';

export function PostForm({ post, spaceId }: { post?: any; spaceId?: string }) {
  const router = useRouter();
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState(post?.content || '');
  const [images, setImages] = useState<string[]>(post?.images || []);
  const [roomTag, setRoomTag] = useState(post?.room_tag || '');
  const [styleTags, setStyleTags] = useState(post?.style_tags?.join(', ') || '');
  const [folderId, setFolderId] = useState(post?.folder_id || 'none');
  const [folders, setFolders] = useState<any[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  const handleImageUpload = (url: string) => {
    setImages(prev => [...prev, url]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Load folders when spaceId changes
  useEffect(() => {
    if (spaceId) {
      loadFolders();
    }
  }, [spaceId]);

  const loadFolders = async () => {
    if (!spaceId) return;
    
    setLoadingFolders(true);
    try {
      const supabaseClient = await getSupabaseWithSession();
      const folderList = await getFoldersBySpaceId(spaceId, supabaseClient);
      setFolders(folderList);
    } catch (error) {
      console.error('Error loading folders:', error);
    } finally {
      setLoadingFolders(false);
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!spaceId) {
      alert('Пожалуйста, выберите пространство для публикации поста.');
      return;
    }
    
    if (!userId) {
      alert('Пользователь не авторизован. Пожалуйста, войдите в систему.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get authenticated Supabase client
      const supabaseClient = await getSupabaseWithSession();
      
      const data = {
        content,
        images,
        room_tag: roomTag || null,
        style_tags: styleTags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag),
        folder_id: folderId === 'none' || !folderId ? null : folderId,
        updated_at: new Date().toISOString(),
      };

      if (post) {
        // Update existing post
        const { error } = await supabaseClient
          .from('posts')
          .update(data)
          .eq('id', post.id);

        if (error) throw error;
      } else {
        // Create new post
        console.log('Creating post with data:', { ...data, space_id: spaceId });
        const { error } = await supabaseClient
          .from('posts')
          .insert({
            ...data,
            space_id: spaceId,
          });

        if (error) throw error;
      }

      // Redirect to the space page
      router.push(`/space/${spaceId}`);
      router.refresh();
    } catch (error: any) {
      console.error('Error saving post:', error);
      alert(`Ошибка при сохранении поста: ${error.message}. Пожалуйста, попробуйте снова.`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-1">
          Содержание поста
        </label>
        <Textarea
          id="content"
          placeholder="Опишите ваш интерьер или поделитесь вдохновением"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Изображения
        </label>
        <ImageUpload onUploadComplete={handleImageUpload} maxFiles={5} />
        
        <div className="mt-4">
          <ImageGallery images={images} onImagesChange={setImages} />
        </div>
      </div>

      <div>
        <label htmlFor="room_tag" className="block text-sm font-medium mb-1">
          Тип комнаты
        </label>
        <select
          id="room_tag"
          value={roomTag}
          onChange={(e) => setRoomTag(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-10"
        >
          <option value="">Не указано</option>
          <option value="kitchen">Кухня</option>
          <option value="bedroom">Спальня</option>
          <option value="living_room">Гостиная</option>
          <option value="bathroom">Ванная</option>
          <option value="balcony">Балкон</option>
          <option value="study">Кабинет</option>
        </select>
      </div>

      <div>
        <label htmlFor="folder_id" className="block text-sm font-medium mb-1">
          Папка
        </label>
        <Select value={folderId || undefined} onValueChange={setFolderId}>
          <SelectTrigger className="w-full">
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
        {loadingFolders && <p className="text-sm text-muted-foreground mt-1">Загрузка папок...</p>}
      </div>

      <div>
        <label htmlFor="style_tags" className="block text-sm font-medium mb-1">
          Стилевые теги
        </label>
        <Input
          id="style_tags"
          placeholder="Модерн, Скандинавский, Минимализм (через запятую)"
          value={styleTags}
          onChange={(e) => setStyleTags(e.target.value)}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Укажите стилевые направления через запятую.
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Публикация...' : post ? 'Обновить пост' : 'Опубликовать'}
      </Button>
    </form>
  );
}