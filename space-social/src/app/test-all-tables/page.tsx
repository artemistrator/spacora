'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestAllTablesPage() {
  const [testResults, setTestResults] = useState<Record<string, { status: string; data?: any; error?: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testAllTables = async () => {
      const tables = [
        'users',
        'spaces',
        'posts',
        'favorites',
        'post_reactions',
        'user_identities',
        'user_spaces',
        'post_comments',
        'folders',
        'space_stats',
        'ai_replacement_jobs',
        'notifications'
      ];

      const results: Record<string, { status: string; data?: any; error?: string }> = {};

      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

          if (error) {
            results[table] = { status: 'error', error: error.message };
          } else {
            results[table] = { status: 'success', data };
          }
        } catch (err) {
          results[table] = { 
            status: 'error', 
            error: err instanceof Error ? err.message : 'Unknown error' 
          };
        }
      }

      setTestResults(results);
      setLoading(false);
    };

    testAllTables();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Тест всех таблиц</h1>
      {loading && <p>Загрузка...</p>}
      {!loading && (
        <div className="space-y-4">
          {Object.entries(testResults).map(([table, result]) => (
            <div 
              key={table} 
              className={`p-4 rounded border ${
                result.status === 'success' 
                  ? 'bg-green-100 border-green-400' 
                  : 'bg-red-100 border-red-400'
              }`}
            >
              <h2 className="font-bold">{table}</h2>
              <p>Статус: {result.status}</p>
              {result.error && <p className="text-red-700">Ошибка: {result.error}</p>}
              {result.data && <p>Данные: {JSON.stringify(result.data)}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}