'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/lib/auth';
import { executeSupabaseQuery } from '@/lib/request-manager';

export default function TestProfilePage() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpaces = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const supabaseClient = await getSupabaseWithSession();
      
      // Fetch user's spaces with proper error handling and timeout
      console.log('Fetching spaces for user:', userId);
      const spacesData = await executeSupabaseQuery(async () => {
        // First get spaces where user is owner
        const ownedSpaces = await supabaseClient
          .from('spaces')
          .select('*')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false });
        
        if (ownedSpaces.error) throw ownedSpaces.error;
        
        // Then get spaces where user is subscriber
        const subscribedSpaces = await supabaseClient
          .from('user_spaces')
          .select('spaces(*)')
          .eq('clerk_id', userId)
          .neq('spaces.owner_id', userId); // Exclude owned spaces to avoid duplicates
        
        if (subscribedSpaces.error) throw subscribedSpaces.error;
        
        // Combine both arrays
        const allSpaces = [
          ...ownedSpaces.data,
          ...subscribedSpaces.data.map((item: any) => item.spaces)
        ];
        
        return allSpaces;
      }, 5000);
      
      console.log('Fetched spaces:', spacesData);
      setSpaces(spacesData);
    } catch (err: any) {
      console.error('Error fetching spaces:', err);
      
      // Handle network errors specifically
      if (err.message === 'Failed to fetch' || err.message === 'Request timeout') {
        setError('Проблемы с подключением к серверу. Проверьте интернет-соединение.');
      } else {
        setError(`Ошибка загрузки пространств: ${err.message || 'Неизвестная ошибка'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, [userId]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Profile Page</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border p-4 rounded animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-2">Your Spaces ({spaces.length})</h2>
          {spaces.length === 0 ? (
            <p>You don't have any spaces yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {spaces.map((space) => (
                <div key={space.id} className="border p-4 rounded">
                  <h3 className="font-bold text-lg">{space.name}</h3>
                  <p className="text-gray-600">{space.description}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Posts: {space.posts_count}</p>
                    <p>Followers: {space.followers_count}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}