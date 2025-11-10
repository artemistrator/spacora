'use client';

import Image from "next/image";
import Link from "next/link";
import { InfiniteFeed } from '@/components/feed/InfiniteFeed';

export default function Home() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Лента постов</h1>
        
        {/* Test Dashboard Link */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg text-center">
          <p className="mb-3">Для тестирования функциональности папок перейдите к тестовому дашборду:</p>
          <Link 
            href="/test-folder-dashboard" 
            className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Перейти к тестам папок
          </Link>
        </div>
        
        <InfiniteFeed />
      </div>
    </div>
  );
}