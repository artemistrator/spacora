'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { deleteImage } from '@/lib/upload';

interface ImageGalleryProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

export function ImageGallery({ images, onImagesChange }: ImageGalleryProps) {
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const handleDeleteImage = async (index: number) => {
    setDeletingIndex(index);
    
    try {
      const imageUrl = images[index];
      
      // Delete from storage
      await deleteImage(imageUrl);
      
      // Remove from state
      const newImages = [...images];
      newImages.splice(index, 1);
      onImagesChange(newImages);
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Ошибка при удалении изображения');
    } finally {
      setDeletingIndex(null);
    }
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {images.map((image, index) => (
        <div key={index} className="relative group">
          <img 
            src={image} 
            alt={`Uploaded ${index + 1}`} 
            className="w-full h-32 object-cover rounded-lg border"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => handleDeleteImage(index)}
            disabled={deletingIndex === index}
          >
            {deletingIndex === index ? 'Удаление...' : '×'}
          </Button>
        </div>
      ))}
    </div>
  );
}