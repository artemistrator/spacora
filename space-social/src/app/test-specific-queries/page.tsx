'use client';

import { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/lib/auth';

export default function TestSpecificQueriesPage() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [testResults, setTestResults] = useState<Record<string, { status: string; data?: any; error?: string; time?: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runTests = async () => {
      if (!userId) {
        setTestResults({ auth: { status: 'error', error: 'User not authenticated' } });
        setLoading(false);
        return;
      }

      try {
        const supabaseClient = await getSupabaseWithSession();
        
        // Тесты для запросов, которые вызывают ошибки
        const tests: Record<string, () => Promise<any>> = {
          'spaces_owner_query': async () => {
            const start = Date.now();
            const result = await supabaseClient
              .from('spaces')
              .select('*')
              .eq('owner_id', userId)
              .order('created_at', { ascending: false });
            const end = Date.now();
            return { ...result, time: end - start };
          },
          'user_spaces_query': async () => {
            const start = Date.now();
            const result = await supabaseClient
              .from('user_spaces')
              .select('*')
              .eq('clerk_id', userId)
              .limit(10);
            const end = Date.now();
            return { ...result, time: end - start };
          },
          'folders_query': async () => {
            const start = Date.now();
            const result = await supabaseClient
              .from('folders')
              .select('*')
              .limit(10);
            const end = Date.now();
            return { ...result, time: end - start };
          }
        };

        const results: Record<string, { status: string; data?: any; error?: string; time?: number }> = {};

        for (const [testName, testFn] of Object.entries(tests)) {
          try {
            console.log(`Starting test: ${testName}`);
            // Add timeout for each test
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`${testName} timeout after 10 seconds`)), 10000)
            );
            
            const testPromise = testFn();
            const result = await Promise.race([testPromise, timeoutPromise]) as any;
            
            if (result.error) {
              results[testName] = { status: 'error', error: result.error.message, time: result.time };
            } else {
              results[testName] = { status: 'success', data: result.data, time: result.time };
            }
            console.log(`Completed test: ${testName} in ${result.time}ms`);
          } catch (err) {
            console.error(`Error in test ${testName}:`, err);
            results[testName] = { 
              status: 'error', 
              error: err instanceof Error ? err.message : 'Unknown error',
              time: 10000 // timeout
            };
          }
        }

        setTestResults(results);
      } catch (err) {
        console.error('General error:', err);
        setTestResults({ 
          general: { 
            status: 'error', 
            error: err instanceof Error ? err.message : 'Unknown error' 
          } 
        });
      } finally {
        setLoading(false);
      }
    };

    runTests();
  }, [userId, getSupabaseWithSession]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Тест специфических запросов</h1>
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
              {result.time && <p>Время выполнения: {result.time}ms</p>}
              {result.error && <p className="text-red-700">Ошибка: {result.error}</p>}
              {result.data && (
                <div>
                  <p>Результатов: {result.data.length}</p>
                  <details>
                    <summary>Данные (кликните для просмотра)</summary>
                    <pre className="bg-gray-100 p-2 mt-2 rounded text-sm overflow-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}