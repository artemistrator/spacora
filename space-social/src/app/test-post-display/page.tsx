'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/lib/auth';
import { PostCard } from '@/components/post/PostCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

export default function TestPostDisplayPage() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testSpaceId, setTestSpaceId] = useState('63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82'); // Тестовый space ID

  const loadPosts = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const supabaseClient = await getSupabaseWithSession();
      console.log('Loading posts for space:', testSpaceId);
      
      // Load posts with folder information
      const { data, error } = await supabaseClient
        .from('posts')
        .select('*')
        .eq('space_id', testSpaceId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log('Loaded posts:', data);
      setPosts(data || []);
    } catch (err) {
      console.error('Error loading posts:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadPosts();
    }
  }, [userId]);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Test Post Display with Folders</h1>
      
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <p className="text-sm text-gray-700">
          This page tests the display of posts with folder information. Make sure you're logged in and have access to the space.
        </p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Post Display Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Space ID:
              </label>
              <Input
                type="text"
                value={testSpaceId}
                onChange={(e) => setTestSpaceId(e.target.value)}
                className="w-full"
                placeholder="Enter space ID"
              />
            </div>
            
            <Button 
              onClick={loadPosts}
              disabled={loading || !userId}
              className="flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Load Posts'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Posts in Space ({posts.length})</h2>
        
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">No posts found in this space.</p>
            <Button onClick={loadPosts} disabled={loading} variant="outline">
              Load Posts
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                onClick={() => console.log('Post clicked:', post.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}