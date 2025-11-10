'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function TestSupabaseConnectionPage() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [testResults, setTestResults] = useState<Record<string, { status: string; data?: any; error?: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runTests = async () => {
      const results: Record<string, { status: string; data?: any; error?: string }> = {};

      try {
        // Test 1: Direct Supabase client
        console.log('Test 1: Direct Supabase client');
        try {
          const { data, error } = await supabase
            .from('spaces')
            .select('*')
            .limit(1);
          
          if (error) {
            results.directClient = { status: 'error', error: error.message };
          } else {
            results.directClient = { status: 'success', data: data?.length || 0 };
          }
        } catch (err) {
          results.directClient = { 
            status: 'error', 
            error: err instanceof Error ? err.message : 'Unknown error' 
          };
        }

        // Test 2: Authenticated Supabase client
        console.log('Test 2: Authenticated Supabase client');
        try {
          const supabaseClient = await getSupabaseWithSession();
          const { data, error } = await supabaseClient
            .from('spaces')
            .select('*')
            .limit(1);
          
          if (error) {
            results.authClient = { status: 'error', error: error.message };
          } else {
            results.authClient = { status: 'success', data: data?.length || 0 };
          }
        } catch (err) {
          results.authClient = { 
            status: 'error', 
            error: err instanceof Error ? err.message : 'Unknown error' 
          };
        }

        // Test 3: Specific space query
        console.log('Test 3: Specific space query');
        try {
          const supabaseClient = await getSupabaseWithSession();
          const { data, error } = await supabaseClient
            .from('spaces')
            .select('*')
            .eq('id', '63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82')
            .single();
          
          if (error) {
            results.specificSpace = { status: 'error', error: error.message };
          } else {
            results.specificSpace = { status: 'success', data: data?.name || 'No name' };
          }
        } catch (err) {
          results.specificSpace = { 
            status: 'error', 
            error: err instanceof Error ? err.message : 'Unknown error' 
          };
        }

        // Test 4: Folders query
        console.log('Test 4: Folders query');
        try {
          const supabaseClient = await getSupabaseWithSession();
          const { data, error } = await supabaseClient
            .from('folders')
            .select('*')
            .eq('space_id', '63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82')
            .limit(5);
          
          if (error) {
            results.folders = { status: 'error', error: error.message };
          } else {
            results.folders = { status: 'success', data: data?.length || 0 };
          }
        } catch (err) {
          results.folders = { 
            status: 'error', 
            error: err instanceof Error ? err.message : 'Unknown error' 
          };
        }

      } catch (err) {
        results.general = { 
          status: 'error', 
          error: err instanceof Error ? err.message : 'Unknown error' 
        };
      }

      setTestResults(results);
      setLoading(false);
    };

    runTests();
  }, [getSupabaseWithSession]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Тест подключения к Supabase</h1>
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
              {result.data && <p>Данные: {JSON.stringify(result.data)}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}