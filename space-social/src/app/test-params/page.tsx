'use client';

import { useState, useEffect } from 'react';

export default function TestParamsPage({ params }: { params: Promise<{ id: string }> }) {
  const [unwrappedParams, setUnwrappedParams] = useState({ id: '' });
  
  useEffect(() => {
    params.then(resolvedParams => {
      console.log('Resolved params in test page:', resolvedParams);
      setUnwrappedParams(resolvedParams);
    });
  }, [params]);
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Тест передачи параметров</h1>
      <p>Параметр ID: {unwrappedParams.id}</p>
      <p>Длина параметра ID: {unwrappedParams.id?.length}</p>
      {unwrappedParams.id && (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <p>Параметр передан успешно!</p>
        </div>
      )}
    </div>
  );
}