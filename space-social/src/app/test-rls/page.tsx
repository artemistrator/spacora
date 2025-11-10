'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestRLSPage() {
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const supabaseClient = supabase;
        const { data, error } = await supabase
          .from('spaces')
          .select('*')
          .limit(5);

        if (error) {
          console.error('Error fetching spaces:', error);
          setError(error.message);
        } else {
          setSpaces(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Тест RLS</h1>
      {loading && <p>Загрузка...</p>}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Ошибка: {error}</p>
        </div>
      )}
      {!loading && !error && (
        <div>
          <p>Успешно загружено {spaces.length} пространств</p>
          <ul className="mt-4">
            {spaces.map((space) => (
              <li key={space.id} className="border-b py-2">
                {space.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}