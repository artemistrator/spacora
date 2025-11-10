'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/lib/auth';

export default function TestFolderPostsDisplayPage() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testSpaceId, setTestSpaceId] = useState('63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const loadFolderPosts = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const supabaseClient = await getSupabaseWithSession();
      
      // Load folders first
      const { data: folderData, error: folderError } = await supabaseClient
        .from('folders')
        .select('*')
        .eq('space_id', testSpaceId)
        .order('name', { ascending: true });
      
      if (folderError) throw folderError;
      setFolders(folderData || []);
      
      // Load posts based on folder selection
      let query = supabaseClient
        .from('posts')
        .select(`
          *,
          folders (name)
        `)
        .eq('space_id', testSpaceId);
      
      if (selectedFolderId) {
        query = query.eq('folder_id', selectedFolderId);
      } else {
        query = query.or('folder_id.is.null');
      }
      
      const { data: postData, error: postError } = await query
        .order('created_at', { ascending: false });
      
      if (postError) throw postError;
      setPosts(postData || []);
    } catch (err) {
      console.error('Error loading folder posts:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadFolderPosts();
    }
  }, [userId, selectedFolderId]);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Folder Posts Display Test</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <p className="text-sm text-gray-700">
          This page tests the display of posts organized by folders. Select a folder to see posts in that folder.
        </p>
      </div>
      
      {/* Controls */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 font-medium">
            Space ID:
          </label>
          <input
            type="text"
            value={testSpaceId}
            onChange={(e) => setTestSpaceId(e.target.value)}
            className="border p-2 w-full rounded"
            placeholder="Enter space ID"
          />
        </div>
        
        <div className="flex items-end">
          <button 
            onClick={loadFolderPosts}
            disabled={loading || !userId}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full disabled:opacity-50"
          >
            Refresh Data
          </button>
        </div>
      </div>
      
      {/* Folder Selection */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Select Folder</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`px-4 py-2 rounded ${
              selectedFolderId === null
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Posts (No Folder)
          </button>
          
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolderId(folder.id)}
              className={`px-4 py-2 rounded ${
                selectedFolderId === folder.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {folder.name} ({folder.posts_count || 0})
            </button>
          ))}
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      {/* Loading Display */}
      {loading && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Loading posts...
        </div>
      )}
      
      {/* Posts Display */}
      <div>
        <h2 className="text-xl font-semibold mb-3">
          Posts {selectedFolderId ? `in Folder: ${folders.find(f => f.id === selectedFolderId)?.name || 'Unknown'}` : 'Without Folder'} ({posts.length})
        </h2>
        
        {posts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No posts found in this folder.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <div key={post.id} className="border p-4 rounded-lg hover:shadow-md transition-shadow">
                <div className="mb-2">
                  <h3 className="font-bold text-lg truncate">{post.content.substring(0, 50)}{post.content.length > 50 ? '...' : ''}</h3>
                </div>
                
                <div className="text-sm text-gray-600 mb-3">
                  {post.folder_id ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Folder: {post.folders?.name || 'Unknown Folder'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      No Folder
                    </span>
                  )}
                </div>
                
                {post.images && post.images.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500">{post.images.length} image(s)</p>
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  <p>Created: {new Date(post.created_at).toLocaleString()}</p>
                  {post.room_tag && <p>Room: {post.room_tag}</p>}
                  {post.style_tags && post.style_tags.length > 0 && (
                    <p>Styles: {post.style_tags.join(', ')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}