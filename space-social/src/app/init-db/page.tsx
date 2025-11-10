'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function InitDatabasePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const initDatabase = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/init-db', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult({ success: true, message: data.message || 'Database initialized successfully' });
      } else {
        setResult({ success: false, message: data.error || 'Failed to initialize database' });
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Инициализация базы данных</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="mb-4">
          Эта страница поможет инициализировать необходимые таблицы в базе данных Supabase.
        </p>
        
        <Button 
          onClick={initDatabase} 
          disabled={loading}
          className="mb-4"
        >
          {loading ? 'Инициализация...' : 'Инициализировать базу данных'}
        </Button>
        
        {result && (
          <div className={`p-4 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <h2 className="font-bold mb-2">{result.success ? 'Успех' : 'Ошибка'}</h2>
            <p>{result.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}