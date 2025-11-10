'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { uploadImageWithClient } from '@/lib/upload';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function TestUploadPage() {
  const { userId, isAuthenticated } = useAuth();
  const { supabase: authSupabase } = useSupabaseAuth();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [authCheck, setAuthCheck] = useState<any>(null);
  const [supabaseAuthCheck, setSupabaseAuthCheck] = useState<any>(null);

  const checkAuthStatus = async () => {
    try {
      // Проверим статус аутентификации через Clerk напрямую
      setAuthCheck({
        isAuthenticated: isAuthenticated,
        userId: userId,
        source: 'Clerk hook'
      });
    } catch (error) {
      setAuthCheck({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const checkSupabaseAuthStatus = async () => {
    try {
      // Проверим статус аутентификации через аутентифицированный клиент
      const supabaseClient = await authSupabase;
      
      // Попробуем выполнить простой запрос, который требует аутентификации
      const { data, error } = await supabaseClient
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();
      
      setSupabaseAuthCheck({
        authWorking: !error,
        userData: data,
        error: error ? error.message : null,
        source: 'Authenticated client test'
      });
    } catch (error) {
      setSupabaseAuthCheck({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Создаем превью
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    setLoading(true);
    setResult(null);

    try {
      console.log('User ID:', userId);
      console.log('Is authenticated:', isAuthenticated);
      
      // Проверим аутентификацию перед загрузкой
      await checkAuthStatus();
      await checkSupabaseAuthStatus();
      
      // Получим аутентифицированный клиент Supabase
      const supabaseClient = await authSupabase;
      console.log('Using authenticated Supabase client');
      
      console.log('Uploading file:', file.name);
      const url = await uploadImageWithClient(supabaseClient, file, 'post-images');
      console.log('Upload successful:', url);
      
      setResult({ success: true, url });
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Получим больше информации об ошибке
      const errorInfo = {
        message: error.message,
        name: error.name,
        stack: error.stack,
      };
      
      setResult({ success: false, error: errorInfo });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Тест загрузки изображений</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Статус аутентификации</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Clerk аутентификация:</strong> {isAuthenticated ? 'Да' : 'Нет'}</p>
              {userId && <p><strong>User ID:</strong> {userId}</p>}
              
              <Button onClick={checkAuthStatus} className="mt-2 mr-2">
                Проверить Clerk статус
              </Button>
              
              {authCheck && (
                <div className="mt-4 p-4 bg-gray-100 rounded">
                  <h3 className="font-bold">Clerk статус:</h3>
                  <pre className="whitespace-pre-wrap text-xs">
                    {JSON.stringify(authCheck, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            
            <div>
              <p><strong>Supabase аутентификация:</strong></p>
              
              <Button onClick={checkSupabaseAuthStatus} className="mt-2">
                Проверить Supabase статус
              </Button>
              
              {supabaseAuthCheck && (
                <div className="mt-4 p-4 bg-blue-100 rounded">
                  <h3 className="font-bold">Supabase статус:</h3>
                  <pre className="whitespace-pre-wrap text-xs">
                    {JSON.stringify(supabaseAuthCheck, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Загрузка изображения</CardTitle>
          <CardDescription>Проверка возможности загрузки изображений в Supabase Storage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={loading || !isAuthenticated}
              className="hidden"
              id="image-upload-test"
            />
            <label htmlFor="image-upload-test">
              <Button 
                variant="outline" 
                className="w-full"
                disabled={loading || !isAuthenticated}
                asChild
              >
                <span>
                  {loading ? 'Загрузка...' : isAuthenticated ? 'Выбрать изображение' : 'Требуется аутентификация'}
                </span>
              </Button>
            </label>
            
            {previewUrl && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Превью:</h3>
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-32 h-32 object-cover rounded-md border"
                />
              </div>
            )}
            
            {result && (
              <div className={`mt-4 p-4 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <h3 className="font-bold mb-2">{result.success ? 'Успех' : 'Ошибка'}</h3>
                <pre className="whitespace-pre-wrap text-xs">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Инструкция по настройке RLS</CardTitle>
          <CardDescription>Политики доступа к бакетам Supabase Storage</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Проверьте следующие политики для бакета "post-images" в Supabase Dashboard:</p>
          
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>INSERT (Вставка):</strong>
              <pre className="bg-gray-100 p-2 mt-1 text-xs">
CREATE POLICY "Users can upload images" 
ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'post-images');</pre>
            </li>
            <li>
              <strong>SELECT (Чтение):</strong>
              <pre className="bg-gray-100 p-2 mt-1 text-xs">
CREATE POLICY "Public can view images" 
ON storage.objects 
FOR SELECT USING (bucket_id = 'post-images');</pre>
            </li>
            <li>
              <strong>UPDATE (Обновление):</strong>
              <pre className="bg-gray-100 p-2 mt-1 text-xs">
CREATE POLICY "Users can update their images" 
ON storage.objects 
FOR UPDATE TO authenticated 
USING (bucket_id = 'post-images' AND owner = auth.uid());</pre>
            </li>
            <li>
              <strong>DELETE (Удаление):</strong>
              <pre className="bg-gray-100 p-2 mt-1 text-xs">
CREATE POLICY "Users can delete their images" 
ON storage.objects 
FOR DELETE TO authenticated 
USING (bucket_id = 'post-images' AND owner = auth.uid());</pre>
            </li>
          </ol>
          
          <div className="mt-4 p-4 bg-yellow-100 rounded">
            <h3 className="font-bold text-yellow-800">Важно:</h3>
            <p className="text-yellow-700">
              Убедитесь, что в настройках бакета "post-images" включена опция "Public access" (публичный доступ), 
              иначе политики SELECT могут не работать правильно.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}