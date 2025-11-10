import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useSpaces() {
  const [spaces, setSpaces] = useState<any[]>([])

  useEffect(() => {
    // Fetch initial spaces
    fetchInitialSpaces();
    
    // Подписка на изменения пространств
    const channel = supabase
      .channel('spaces')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'spaces' },
        (payload) => {
          setSpaces(prev => [payload.new, ...prev])
        }
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'spaces' },
        (payload) => {
          setSpaces(prev => prev.map(space => 
            space.id === payload.new.id ? payload.new : space
          ))
        }
      )
      .on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'spaces' },
        (payload) => {
          setSpaces(prev => prev.filter(space => space.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchInitialSpaces = async () => {
    try {
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      setSpaces(data);
    } catch (error) {
      console.error('Error fetching initial spaces:', error);
    }
  };

  return { spaces, setSpaces }
}