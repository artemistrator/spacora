'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/lib/auth';
import { SpaceCard } from '@/components/space/SpaceCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';
import { getOrCreateSupabaseUserId } from '@/lib/user-mapping';

interface Space {
  id: string;
  name: string;
  description: string;
  location: string;
  space_type: string;
  is_public: boolean;
  owner_id: string;
  posts_count: number;
  likes_count: number;
  favorites_count: number;
  followers_count: number;
  created_at: string;
}

export default function ProfileDebugPage() {
  const router = useRouter();
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const fetchSpaces = async () => {
      if (!userId) {
        console.log('No userId found');
        setLoading(false);
        return;
      }

      console.log('Starting fetchSpaces for userId:', userId);
      
      try {
        setLoading(true);
        setError(null);
        const supabaseClient = await getSupabaseWithSession();
        
        // Получаем правильный UUID для пользователя
        const supabaseUserId = await getOrCreateSupabaseUserId(userId);
        
        if (!supabaseUserId) {
          throw new Error('Failed to get Supabase user ID')
        }
        
        console.log('Got Supabase client, starting request');
        
        // Log the exact query we're making
        console.log('Executing query: SELECT * FROM spaces WHERE owner_id =', userId, 'OR owner_id =', supabaseUserId);
        
        // Add detailed timeout with logging
        const startTime = Date.now();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => {
            const elapsed = Date.now() - startTime;
            console.log('Request timed out after', elapsed, 'ms');
            reject(new Error(`Request timeout after ${elapsed}ms`));
          }, 10000)
        );
        
        const spacesPromise = supabaseClient
          .from('spaces')
          .select('*')
          .or(`owner_id.eq.${userId},owner_id.eq.${supabaseUserId}`) // Ищем по обоим форматам
          .order('created_at', { ascending: false })
          .then(result => {
            const elapsed = Date.now() - startTime;
            console.log('Request completed in', elapsed, 'ms with', result?.data?.length || 0, 'results');
            return result;
          });

        // Race the request with timeout
        const { data, error } = await Promise.race([spacesPromise, timeoutPromise]) as any;

        if (error) {
          console.log('Query error:', error);
          throw error;
        }
        
        console.log('Query successful, data length:', data?.length);
        setDebugInfo({
          userId,
          supabaseUserId,
          dataLength: data?.length,
          timestamp: new Date().toISOString()
        });
        setSpaces(data || []);
      } catch (error: any) {
        console.error('Error in fetchSpaces:', error);
        console.error('Error stack:', error.stack);
        setError(`Error: ${error.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, [userId, getSupabaseWithSession]);

  const handleRetry = () => {
    setError(null);
    setDebugInfo(null);
    // Force re-render by changing key or similar approach
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="p-4 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Debug: Мои пространства</h1>
        <div className="mb-4">
          <p>Загрузка... (Проверяем userId: {userId || 'null'})</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
            <h2 className="text-xl font-bold text-red-800">Ошибка загрузки</h2>
          </div>
          <div className="flex items-start mb-4">
            <WifiOff className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
          {debugInfo && (
            <div className="mb-4 p-2 bg-gray-100 rounded">
              <p>Debug Info: {JSON.stringify(debugInfo)}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleRetry} className="flex items-center">
              <RefreshCw className="h-4 w-4 mr-2" />
              Повторить попытку
            </Button>
            <Button variant="outline" onClick={() => router.push('/')}>
              Вернуться на главную
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Debug: Мои пространства</h1>
        <Button onClick={() => router.push('/spaces/new')}>
          Создать пространство
        </Button>
      </div>
      
      {debugInfo && (
        <div className="mb-4 p-2 bg-green-100 rounded">
          <p>Debug Info: {JSON.stringify(debugInfo)}</p>
        </div>
      )}

      {spaces.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">У вас пока нет пространств</p>
          <Button onClick={() => router.push('/spaces/new')}>
            Создать первое пространство
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((space) => (
            <SpaceCard 
              key={space.id} 
              space={space} 
              onClick={() => router.push(`/space/${space.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}