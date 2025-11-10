'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestUserSpacesPage() {
  const [userSpaces, setUserSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserSpaces = async () => {
      try {
        const { data, error } = await supabase
          .from('user_spaces')
          .select('*')
          .limit(5);

        if (error) {
          console.error('Error fetching user_spaces:', error);
          setError(error.message);
        } else {
          setUserSpaces(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchUserSpaces();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Тест user_spaces</h1>
      {loading && <p>Загрузка...</p>}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Ошибка: {error}</p>
        </div>
      )}
      {!loading && !error && (
        <div>
          <p>Успешно загружено {userSpaces.length} записей из user_spaces</p>
          <ul className="mt-4">
            {userSpaces.map((userSpace) => (
              <li key={userSpace.id} className="border-b py-2">
                Space ID: {userSpace.space_id}, Role: {userSpace.role}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}