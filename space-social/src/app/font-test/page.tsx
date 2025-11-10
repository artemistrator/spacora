'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Heart, MessageCircle, Share2, Users, Star } from 'lucide-react'

export default function FontTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 text-center font-open-sans font-demibold">Тестирование Шрифтов</h1>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-demibold mb-4 font-open-sans">Заголовок Open Sans Demibold</h2>
          <p className="text-gray-700 mb-4 font-open-sans font-normal">Обычный текст с использованием Open Sans Regular для лучшей читаемости. Этот шрифт отлично подходит для основного текста контента.</p>
          <p className="text-gray-700 mb-4 font-open-sans font-light">Светлый текст с использованием Open Sans Light для второстепенных элементов и описаний.</p>
          
          <div className="flex items-center space-x-4 mt-6">
            <Button variant="default" size="sm">
              Основная кнопка
            </Button>
            <Button variant="outline" size="sm">
              Второстепенная кнопка
            </Button>
            <Button variant="ghost" size="sm">
              <Heart className="h-4 w-4 mr-2" />
              Лайк
            </Button>
          </div>
          
          <div className="mt-6">
            <Input placeholder="Поле ввода с Open Sans" className="mb-4" />
          </div>
          
          <div className="flex items-center space-x-3 mt-6">
            <Avatar>
              <AvatarFallback>AB</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-demibold font-open-sans">Имя пользователя</p>
              <p className="text-xs text-gray-500 font-open-sans font-light">Дата публикации</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <h3 className="font-demibold mb-2 font-open-sans">Open Sans Light</h3>
            <p className="text-sm font-open-sans font-light">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
            <p className="text-sm font-open-sans font-light">abcdefghijklmnopqrstuvwxyz</p>
            <p className="text-sm font-open-sans font-light">0123456789</p>
            <p className="text-sm font-open-sans font-light mt-2">АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ</p>
            <p className="text-sm font-open-sans font-light">абвгдежзийклмнопрстуфхцчшщъыьэюя</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <h3 className="font-demibold mb-2 font-open-sans">Open Sans Regular</h3>
            <p className="text-sm font-open-sans font-normal">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
            <p className="text-sm font-open-sans font-normal">abcdefghijklmnopqrstuvwxyz</p>
            <p className="text-sm font-open-sans font-normal">0123456789</p>
            <p className="text-sm font-open-sans font-normal mt-2">АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ</p>
            <p className="text-sm font-open-sans font-normal">абвгдежзийклмнопрстуфхцчшщъыьэюя</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <h3 className="font-demibold mb-2 font-open-sans">Open Sans Demibold</h3>
            <p className="text-sm font-open-sans font-demibold">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
            <p className="text-sm font-open-sans font-demibold">abcdefghijklmnopqrstuvwxyz</p>
            <p className="text-sm font-open-sans font-demibold">0123456789</p>
            <p className="text-sm font-open-sans font-demibold mt-2">АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ</p>
            <p className="text-sm font-open-sans font-demibold">абвгдежзийклмнопрстуфхцчшщъыьэюя</p>
          </div>
        </div>
      </div>
    </div>
  )
}