'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/lib/auth';
import { getFoldersBySpaceId, createFolder } from '@/lib/folder-utils';

export default function TestFolderPostIntegrationPage() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [folders, setFolders] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testSpaceId] = useState('63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [postContent, setPostContent] = useState('');

  const loadFolders = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const supabaseClient = await getSupabaseWithSession();
      const folderList = await getFoldersBySpaceId(testSpaceId, supabaseClient);
      setFolders(folderList);
    } catch (err) {
      console.error('Error loading folders:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const supabaseClient = await getSupabaseWithSession();
      
      let query = supabaseClient
        .from('posts')
        .select(`
          *,
          folders (name)
        `)
        .eq('space_id', testSpaceId);
      
      if (selectedFolderId) {
        query = query.eq('folder_id', selectedFolderId);
      } else if (selectedFolderId === null) {
        query = query.is('folder_id', null);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error loading posts:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createTestPost = async () => {
    if (!postContent.trim() || !userId) return;
    
    setLoading(true);
    try {
      const supabaseClient = await getSupabaseWithSession();
      
      const { error } = await supabaseClient
        .from('posts')
        .insert({
          content: postContent,
          space_id: testSpaceId,
          folder_id: selectedFolderId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      setPostContent('');
      loadPosts(); // Refresh posts
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadFolders();
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadPosts();
    }
  }, [userId, selectedFolderId]);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Folder-Post Integration Test</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <p className="text-sm text-gray-700">
          This page tests the integration between folders and posts. You can create posts and assign them to folders.
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Folder Management */}
        <div>
          <div className="mb-6 p-4 border rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Folders</h2>
            
            <div className="mb-4">
              <button 
                onClick={loadFolders}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                Refresh Folders
              </button>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => setSelectedFolderId(null)}
                className={`w-full text-left p-2 rounded ${
                  selectedFolderId === null
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                All Posts (No Folder)
              </button>
              
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`w-full text-left p-2 rounded ${
                    selectedFolderId === folder.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-medium">{folder.name}</div>
                  <div className="text-sm opacity-75">{folder.description || 'No description'}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Column - Post Management */}
        <div>
          <div className="mb-6 p-4 border rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Create Post</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium">
                  Post Content:
                </label>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="border p-2 w-full rounded"
                  placeholder="Enter post content"
                  rows={3}
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium">
                  Selected Folder:
                </label>
                <div className="p-2 bg-gray-100 rounded">
                  {selectedFolderId === null ? (
                    <span>All Posts (No Folder)</span>
                  ) : (
                    <span>
                      {folders.find(f => f.id === selectedFolderId)?.name || 'Unknown Folder'}
                    </span>
                  )}
                </div>
              </div>
              
              <button 
                onClick={createTestPost}
                disabled={loading || !postContent.trim()}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {loading ? 'Creating Post...' : 'Create Post'}
              </button>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold mb-3">
              Posts ({posts.length})
            </h2>
            
            <div className="space-y-3">
              {posts.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p>No posts found.</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="border p-3 rounded">
                    <div className="font-medium mb-1">{post.content.substring(0, 100)}{post.content.length > 100 ? '...' : ''}</div>
                    <div className="text-sm text-gray-600">
                      {post.folder_id ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Folder: {post.folders?.name || 'Unknown'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          No Folder
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Created: {new Date(post.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}