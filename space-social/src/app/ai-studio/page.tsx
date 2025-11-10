'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/upload/ImageUpload';

export default function AIStudioPage() {
  const { isAuthenticated } = useAuth();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [favoriteImage, setFavoriteImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const handleOriginalImageUpload = (url: string) => {
    setOriginalImage(url);
  };

  const handleFavoriteImageUpload = (url: string) => {
    setFavoriteImage(url);
  };

  const handleProcessImage = async () => {
    if (!originalImage || !favoriteImage || !prompt) {
      alert('Пожалуйста, загрузите оба изображения и введите промт');
      return;
    }

    setIsProcessing(true);
    
    try {
      // В реальной реализации здесь будет вызов N8N workflow
      // aiJobs.replaceObject(originalImage, favoriteImage, prompt);
      
      // Имитация обработки
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Имитация результата
      setResultImage('https://placehold.co/600x400/EEE/31343C?text=AI+Processed+Image');
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Ошибка при обработке изображения');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">AI Студия</h1>
          <p className="text-muted-foreground mb-6">
            Для использования AI функций необходимо войти в систему.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AI Студия</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Original Image Section */}
          <Card>
            <CardHeader>
              <CardTitle>Оригинальное изображение</CardTitle>
              <CardDescription>Загрузите изображение, на котором хотите заменить объект</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ImageUpload onUploadComplete={handleOriginalImageUpload} />
                {originalImage && (
                  <div className="mt-4">
                    <img 
                      src={originalImage} 
                      alt="Original" 
                      className="w-full h-auto rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Favorite Image Section */}
          <Card>
            <CardHeader>
              <CardTitle>Изображение для замены</CardTitle>
              <CardDescription>Загрузите изображение объекта, который хотите использовать для замены</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ImageUpload onUploadComplete={handleFavoriteImageUpload} />
                {favoriteImage && (
                  <div className="mt-4">
                    <img 
                      src={favoriteImage} 
                      alt="Favorite" 
                      className="w-full h-auto rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Prompt Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Описание замены</CardTitle>
            <CardDescription>Опишите, как вы хотите заменить объект на изображении</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Промт для AI</Label>
                <Textarea
                  id="prompt"
                  placeholder="Например: Замени старую лампу на современную золотую"
                  value={prompt}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Process Button */}
        <div className="mt-8 text-center">
          <Button 
            onClick={handleProcessImage} 
            disabled={isProcessing || !originalImage || !favoriteImage || !prompt}
            size="lg"
          >
            {isProcessing ? 'Обработка...' : 'Заменить объект'}
          </Button>
        </div>
        
        {/* Result Section */}
        {resultImage && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Результат</CardTitle>
              <CardDescription>Результат AI обработки изображения</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mt-4">
                <img 
                  src={resultImage} 
                  alt="Result" 
                  className="w-full h-auto rounded-lg border"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}