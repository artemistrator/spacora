'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@supabase/supabase-js';

export default function TestStorageFixPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testFixedUpload = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Создаем клиент с anon key (без аутентификации)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Создадим тестовый файл
      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      
      // Попробуем загрузить файл без аутентификации
      // Это будет работать, если бакет имеет публичный доступ
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(`test-${Date.now()}.txt`, testFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      // Удалим тестовый файл сразу после загрузки
      if (data) {
        await supabase.storage
          .from('post-images')
          .remove([data.path]);
      }
      
      if (error) {
        setResult({ 
          success: false, 
          error: error.message,
          // Убираем code и details, так как они могут не существовать
        });
      } else {
        setResult({ 
          success: true, 
          message: 'Upload successful with anon key',
          data: data
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

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Тест исправления загрузки</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Тест загрузки с anon key</CardTitle>
          <CardDescription>Проверка загрузки файлов без аутентификации</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={testFixedUpload} 
              disabled={loading}
            >
              {loading ? 'Проверка...' : 'Проверить загрузку с anon key'}
            </Button>
            
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
      
      <Card>
        <CardHeader>
          <CardTitle>Инструкция по исправлению</CardTitle>
          <CardDescription>Правильная настройка бакета post-images</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-4">
            <li>
              <strong>В Supabase Dashboard → Storage → Buckets → post-images:</strong>
              <p className="mt-1 text-sm">
                Убедитесь, что включена опция "Public access"
              </p>
            </li>
            
            <li>
              <strong>Удалите все существующие политики:</strong>
              <pre className="bg-gray-100 p-2 mt-1 text-xs">
DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their images" ON storage.objects;</pre>
            </li>
            
            <li>
              <strong>Создайте простые политики без проверки владельца:</strong>
              <pre className="bg-gray-100 p-2 mt-1 text-xs">
CREATE POLICY "Allow public uploads" 
ON storage.objects 
FOR INSERT TO authenticated, anon 
WITH CHECK (bucket_id = 'post-images');

CREATE POLICY "Allow public reads" 
ON storage.objects 
FOR SELECT TO authenticated, anon 
USING (bucket_id = 'post-images');

CREATE POLICY "Allow updates" 
ON storage.objects 
FOR UPDATE TO authenticated 
USING (bucket_id = 'post-images');

CREATE POLICY "Allow deletes" 
ON storage.objects 
FOR DELETE TO authenticated 
USING (bucket_id = 'post-images');</pre>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}