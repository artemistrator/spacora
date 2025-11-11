import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { uploadImage } from '@/lib/upload';

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  bucket?: string;
  maxFiles?: number;
}

export function ImageUpload({ 
  onUploadComplete, 
  bucket = 'post-images',
  maxFiles = 1
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const uniqueId = useMemo(() => `image-upload-${Math.random().toString(36).substring(7)}`, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Limit the number of files
    const filesToUpload = Array.from(files).slice(0, maxFiles);

    setIsUploading(true);

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setPreviewUrls(prev => [...prev, previewUrl]);

        // Upload the file
        const url = await uploadImage(file, bucket);
        return url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // Call the callback for each uploaded file
      uploadedUrls.forEach(url => onUploadComplete(url));

      // Clean up preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls([]);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset the input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      {previewUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative">
              <img 
                src={url} 
                alt="Preview" 
                className="w-24 h-24 object-cover rounded-md border"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md">
                  <div className="w-6 h-6 border-t-2 border-white rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div>
        <input
          type="file"
          accept="image/*"
          multiple={maxFiles > 1}
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
          id={uniqueId}
        />
        <label htmlFor={uniqueId}>
          <Button 
            variant="outline" 
            className="w-full"
            disabled={isUploading}
            asChild
          >
            <span>
              {isUploading ? 'Загрузка...' : 'Выбрать изображения'}
            </span>
          </Button>
        </label>
      </div>
    </div>
  );
}