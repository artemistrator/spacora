'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabaseAuth } from '@/lib/auth';

export default function TestStoragePage() {
  const { supabase: authSupabase } = useSupabaseAuth();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [policyCheck, setPolicyCheck] = useState<any>(null);

  const testStorageAccess = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Получим аутентифицированный клиент Supabase
      const supabaseClient = await authSupabase;
      
      // Попробуем получить список файлов в бакете post-images
      const { data, error } = await supabaseClient.storage
        .from('post-images')
        .list('', {
          limit: 1
        });
      
      if (error) {
        setResult({ 
          success: false, 
          error: error.message
        });
      } else {
        setResult({ 
          success: true, 
          message: 'Storage access successful',
          filesCount: data?.length || 0
        });
      }
    } catch (error: any) {
      setResult({ 
        success: false, 
        error: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  const testUploadPolicy = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Получим аутентифицированный клиент Supabase
      const supabaseClient = await authSupabase;
      
      // Создадим тестовый файл
      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      
      console.log('Attempting to upload file...');
      
      // Попробуем загрузить файл
      const { data, error } = await supabaseClient.storage
        .from('post-images')
        .upload(`test-${Date.now()}.txt`, testFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      console.log('Upload result:', { data, error });
      
      // Удалим тестовый файл сразу после загрузки
      if (data) {
        console.log('Attempting to delete file...');
        await supabaseClient.storage
          .from('post-images')
          .remove([data.path]);
        console.log('File deleted');
      }
      
      if (error) {
        setResult({ 
          success: false, 
          error: error.message,
          details: {
            name: error.name,
            message: error.message,
            // Дополнительная информация об ошибке
          }
        });
      } else {
        setResult({ 
          success: true, 
          message: 'Upload policy test successful',
          data: data
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setResult({ 
        success: false, 
        error: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  const checkPolicies = async () => {
    setLoading(true);
    setPolicyCheck(null);

    try {
      // Получим аутентифицированный клиент Supabase
      const supabaseClient = await authSupabase;
      
      // Попробуем получить информацию о политике
      // Это может не сработать, но попробуем
      const { data, error } = await supabaseClient
        .from('storage.objects')
        .select('*')
        .eq('bucket_id', 'post-images')
        .limit(1);
      
      setPolicyCheck({ 
        success: !error,
        data: data,
        error: error ? error.message : null
      });
    } catch (error: any) {
      setPolicyCheck({ 
        success: false, 
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const testAuthStatus = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Получим аутентифицированный клиент Supabase
      const supabaseClient = await authSupabase;
      
      // Попробуем получить текущего пользователя
      const { data: { user }, error } = await supabaseClient.auth.getUser();
      
      setResult({ 
        success: !error,
        user: user,
        error: error ? error.message : null
      });
    } catch (error: any) {
      setResult({ 
        success: false, 
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Тест доступа к хранилищу</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Проверка доступа к Storage</CardTitle>
          <CardDescription>Тестирование политик доступа к бакету post-images</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={testStorageAccess} 
                disabled={loading}
              >
                {loading ? 'Проверка...' : 'Проверить доступ к списку файлов'}
              </Button>
              
              <Button 
                onClick={testUploadPolicy} 
                disabled={loading}
                variant="secondary"
              >
                {loading ? 'Проверка...' : 'Проверить политику загрузки'}
              </Button>
              
              <Button 
                onClick={checkPolicies} 
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Проверка...' : 'Проверить политики'}
              </Button>
              
              <Button 
                onClick={testAuthStatus} 
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Проверка...' : 'Проверить статус аутентификации'}
              </Button>
            </div>
            
            {result && (
              <div className={`mt-4 p-4 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <h3 className="font-bold mb-2">{result.success ? 'Успех' : 'Ошибка'}</h3>
                <pre className="whitespace-pre-wrap text-xs">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
            
            {policyCheck && (
              <div className="mt-4 p-4 bg-blue-100 rounded">
                <h3 className="font-bold mb-2">Проверка политик</h3>
                <pre className="whitespace-pre-wrap text-xs">
                  {JSON.stringify(policyCheck, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Инструкция по настройке политик</CardTitle>
          <CardDescription>Правильная настройка RLS для бакета post-images</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-2">Выполните следующие SQL запросы в Supabase SQL Editor:</p>
          
          <ol className="list-decimal pl-5 space-y-4">
            <li>
              <strong>Удалите существующие политики (если есть):</strong>
              <pre className="bg-gray-100 p-2 mt-1 text-xs">
DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their images" ON storage.objects;</pre>
            </li>
            
            <li>
              <strong>Создайте новые политики:</strong>
              <pre className="bg-gray-100 p-2 mt-1 text-xs">
-- INSERT POLICY
CREATE POLICY "Users can upload images" 
ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'post-images');

-- SELECT POLICY
CREATE POLICY "Public can view images" 
ON storage.objects 
FOR SELECT USING (bucket_id = 'post-images');

-- UPDATE POLICY
CREATE POLICY "Users can update their images" 
ON storage.objects 
FOR UPDATE TO authenticated 
USING (bucket_id = 'post-images' AND owner = auth.uid());

-- DELETE POLICY
CREATE POLICY "Users can delete their images" 
ON storage.objects 
FOR DELETE TO authenticated 
USING (bucket_id = 'post-images' AND owner = auth.uid());</pre>
            </li>
            
            <li>
              <strong>Убедитесь, что бакет имеет публичный доступ:</strong>
              <p className="mt-1 text-sm">
                В Supabase Dashboard → Storage → Buckets → post-images → Убедитесь, что включена опция "Public access"
              </p>
            </li>
            
            <li>
              <strong>Проверьте, что включены RLS для таблицы storage.objects:</strong>
              <p className="mt-1 text-sm">
                В Supabase Dashboard → Table Editor → storage.objects → Убедитесь, что включена опция "Enable RLS"
              </p>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}