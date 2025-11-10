'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import { Folder } from '@/lib/folder-utils';

interface FolderModalProps {
  folder: Folder | null;
  onClose: () => void;
  onSubmit: (folderData: Omit<Folder, 'id' | 'posts_count' | 'created_at' | 'updated_at' | 'space_id'>) => void;
}

const folderColors = [
  { name: 'Красный', value: '#ef4444' },
  { name: 'Оранжевый', value: '#f97316' },
  { name: 'Желтый', value: '#eab308' },
  { name: 'Зеленый', value: '#22c55e' },
  { name: 'Синий', value: '#3b82f6' },
  { name: 'Фиолетовый', value: '#8b5cf6' },
];

const folderIcons = [
  { name: 'Папка', value: 'Folder' },
  { name: 'Дом', value: 'Home' },
  { name: 'Сердце', value: 'Heart' },
  { name: 'Звезда', value: 'Star' },
  { name: 'Молоток', value: 'Hammer' },
  { name: 'Кисть', value: 'Brush' },
];

export function FolderModal({ folder, onClose, onSubmit }: FolderModalProps) {
  const [name, setName] = useState(folder?.name || '');
  const [description, setDescription] = useState(folder?.description || '');
  const [color, setColor] = useState(folder?.color || '#3b82f6');
  const [icon, setIcon] = useState(folder?.icon || 'Folder');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSubmit({
      name: name.trim(),
      description: description.trim() || '',
      color,
      icon,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {folder ? 'Редактировать папку' : 'Создать новую папку'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Ремонт кухни"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание папки (необязательно)"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Цвет</Label>
              <div className="flex space-x-2">
                {folderColors.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      color === colorOption.value ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: colorOption.value }}
                    onClick={() => setColor(colorOption.value)}
                    title={colorOption.name}
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Иконка</Label>
              <div className="grid grid-cols-3 gap-2">
                {folderIcons.map((iconOption) => (
                  <Button
                    key={iconOption.value}
                    type="button"
                    variant={icon === iconOption.value ? 'default' : 'outline'}
                    className="flex items-center justify-center"
                    onClick={() => setIcon(iconOption.value)}
                  >
                    {iconOption.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {folder ? 'Сохранить' : 'Создать'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}