'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TestSpacePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [unwrappedParams, setUnwrappedParams] = useState({ id: '' });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    console.log('TestSpacePage params received:', params);
    params.then(resolvedParams => {
      console.log('TestSpacePage resolved params:', resolvedParams);
      setUnwrappedParams(resolvedParams);
      setLoading(false);
    }).catch(error => {
      console.error('Error resolving params:', error);
      setLoading(false);
    });
  }, [params]);
  
  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Тест страницы пространства</h1>
      <div className="mb-4">
        <p>Параметр ID: <strong>{unwrappedParams.id || 'не передан'}</strong></p>
        <p>Длина ID: {unwrappedParams.id?.length || 0}</p>
      </div>
      
      {unwrappedParams.id ? (
        <div className="p-4 bg-green-100 rounded">
          <p className="text-green-800">✅ Параметр ID передан успешно!</p>
          <button 
            onClick={() => router.push(`/space/${unwrappedParams.id}`)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Перейти к пространству
          </button>
        </div>
      ) : (
        <div className="p-4 bg-red-100 rounded">
          <p className="text-red-800">❌ Параметр ID не передан</p>
        </div>
      )}
    </div>
  );
}
