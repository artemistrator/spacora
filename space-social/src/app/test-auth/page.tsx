'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestAuthPage() {
  const [testResults, setTestResults] = useState<Record<string, { status: string; data?: any; error?: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runTests = async () => {
      const tests: Record<string, () => Promise<any>> = {
        'spaces_public': async () => {
          return await supabase
            .from('spaces')
            .select('id, name')
            .limit(3);
        },
        'posts_public': async () => {
          return await supabase
            .from('posts')
            .select('id, content')
            .limit(3);
        },
        'users_public': async () => {
          return await supabase
            .from('users')
            .select('id, name')
            .limit(3);
        },
        'user_spaces_public': async () => {
          return await supabase
            .from('user_spaces')
            .select('id, role')
            .limit(3);
        }
      };

      const results: Record<string, { status: string; data?: any; error?: string }> = {};

      for (const [testName, testFn] of Object.entries(tests)) {
        try {
          const result = await testFn();
          
          if (result.error) {
            results[testName] = { status: 'error', error: result.error.message };
          } else {
            results[testName] = { status: 'success', data: result.data };
          }
        } catch (err) {
          results[testName] = { 
            status: 'error', 
            error: err instanceof Error ? err.message : 'Unknown error' 
          };
        }
      }

      setTestResults(results);
      setLoading(false);
    };

    runTests();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Тест аутентификации и доступа к таблицам</h1>
      {loading && <p>Загрузка...</p>}
      {!loading && (
        <div className="space-y-4">
          {Object.entries(testResults).map(([testName, result]) => (
            <div 
              key={testName} 
              className={`p-4 rounded border ${
                result.status === 'success' 
                  ? 'bg-green-100 border-green-400' 
                  : 'bg-red-100 border-red-400'
              }`}
            >
              <h2 className="font-bold">{testName}</h2>
              <p>Статус: {result.status}</p>
              {result.error && <p className="text-red-700">Ошибка: {result.error}</p>}
              {result.data && (
                <div>
                  <p>Данные:</p>
                  <pre className="bg-gray-100 p-2 mt-2 rounded text-sm overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
