import { supabase } from './supabase'
import { createClient } from '@supabase/supabase-js'

// Для загрузки изображений с аутентификацией
export async function uploadImageWithAuth(file: File, bucket: string = 'post-images') {
  try {
    console.log('Starting upload to bucket:', bucket);
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = fileName

    console.log('File info:', { fileName, fileSize: file.size, fileType: file.type });
    
    // Используем глобальный клиент Supabase с аутентификацией
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error details:', error);
      throw new Error(`Upload failed: ${error.message}`)
    }

    console.log('Upload successful:', data);
    
    // Получить публичный URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    console.log('Public URL generated:', publicUrl);
    return publicUrl
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

// Для загрузки изображений с переданным клиентом (для тестов)
export async function uploadImageWithClient(supabaseClient: any, file: File, bucket: string = 'post-images') {
  try {
    console.log('Starting upload to bucket:', bucket);
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = fileName

    console.log('File info:', { fileName, fileSize: file.size, fileType: file.type });
    
    // Используем переданный клиент Supabase
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error details:', error);
      throw new Error(`Upload failed: ${error.message}`)
    }

    console.log('Upload successful:', data);
    
    // Получить публичный URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(filePath)

    console.log('Public URL generated:', publicUrl);
    return publicUrl
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

// Функция для удаления изображений
export async function deleteImage(url: string, bucket: string = 'post-images') {
  try {
    // Extract file name from URL
    const fileName = url.split('/').pop()
    
    if (!fileName) {
      throw new Error('Invalid URL')
    }

    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName])

    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }

    return true
  } catch (error) {
    console.error('Error deleting image:', error)
    throw error
  }
}

// Экспортируем оригинальную функцию для обратной совместимости
export { uploadImageWithAuth as uploadImage }