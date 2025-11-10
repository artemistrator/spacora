'use client';

import { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/lib/auth';

export default function TestUserDataPage() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [testResults, setTestResults] = useState<Record<string, { status: string; data?: any; error?: string }>>({});
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
        
        const tests: Record<string, () => Promise<any>> = {
          'user_exists': async () => {
            return await supabaseClient
              .from('users')
              .select('id, name, email')
              .eq('id', userId)
              .single();
          },
          'user_spaces': async () => {
            return await supabaseClient
              .from('spaces')
              .select('id, name, owner_id')
              .eq('owner_id', userId)
              .limit(5);
          },
          'user_spaces_count': async () => {
            return await supabaseClient
              .from('spaces')
              .select('count()', { count: 'exact' })
              .eq('owner_id', userId)
              .single();
          },
          'user_subscriptions': async () => {
            return await supabaseClient
              .from('user_spaces')
              .select('space_id, role')
              .eq('clerk_id', userId)
              .limit(5);
          }
        };

        const results: Record<string, { status: string; data?: any; error?: string }> = {};

        for (const [testName, testFn] of Object.entries(tests)) {
          try {
            // Add timeout for each test
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Test timeout')), 5000)
            );
            
            const testPromise = testFn();
            const result = await Promise.race([testPromise, timeoutPromise]) as any;
            
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
      } catch (err) {
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
      <h1 className="text-2xl font-bold mb-4">Тест пользовательских данных</h1>
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