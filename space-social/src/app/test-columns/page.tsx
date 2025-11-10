'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestColumns() {
  const [columns, setColumns] = useState<any[]>([]);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkColumns();
  }, []);

  const checkColumns = async () => {
    try {
      // First, let's check what columns exist in the spaces table
      const { data: spacesData, error: spacesError } = await supabase
        .from('spaces')
        .select('*')
        .limit(1);
        
      if (spacesError) {
        console.error('Error fetching spaces:', spacesError);
      } else {
        console.log('Spaces data:', spacesData);
        if (spacesData && spacesData.length > 0) {
          setColumns(Object.keys(spacesData[0]));
        }
        setSpaces(spacesData || []);
      }
    } catch (error) {
      console.error('Error checking columns:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Database Columns</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Available Columns in Spaces Table</h2>
        <div className="bg-gray-100 p-4 rounded">
          <pre>{JSON.stringify(columns, null, 2)}</pre>
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Sample Space Data</h2>
        <div className="bg-gray-100 p-4 rounded">
          <pre>{JSON.stringify(spaces[0], null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}