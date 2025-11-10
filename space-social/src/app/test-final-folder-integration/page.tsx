'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/lib/auth';
import { getFoldersBySpaceId, createFolder, updateFolder, deleteFolder } from '@/lib/folder-utils';

export default function TestFinalFolderIntegrationPage() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [folders, setFolders] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testSpaceId, setTestSpaceId] = useState('63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [postContent, setPostContent] = useState('');

  const loadAllData = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const supabaseClient = await getSupabaseWithSession();
      
      // Load folders
      const folderList = await getFoldersBySpaceId(testSpaceId, supabaseClient);
      setFolders(folderList);
      
      // Load posts for selected folder
      let query = supabaseClient
        .from('posts')
        .select(`
          *,
          folders (name)
        `)
        .eq('space_id', testSpaceId);
      
      if (selectedFolderId !== null) {
        query = query.eq('folder_id', selectedFolderId);
      } else {
        query = query.is('folder_id', null);
      }
      
      const { data: postData, error: postError } = await query.order('created_at', { ascending: false });
      
      if (postError) throw postError;
      setPosts(postData || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !userId) return;
    
    setLoading(true);
    try {
      const supabaseClient = await getSupabaseWithSession();
      const folderData = {
        name: newFolderName,
        description: newFolderDescription || 'Test folder',
        space_id: testSpaceId
      };
      
      const result = await createFolder(folderData, supabaseClient);
      
      if (result) {
        setNewFolderName('');
        setNewFolderDescription('');
        loadAllData(); // Refresh all data
      } else {
        setError('Failed to create folder');
      }
    } catch (err) {
      console.error('Error creating folder:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFolder = async (folderId: string, newName: string, newDescription?: string) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const supabaseClient = await getSupabaseWithSession();
      
      const updates: any = { name: newName };
      if (newDescription !== undefined) {
        updates.description = newDescription;
      }
      
      const result = await updateFolder(folderId, updates, supabaseClient);
      
      if (result) {
        loadAllData(); // Refresh all data
      } else {
        setError('Failed to update folder');
      }
    } catch (err) {
      console.error('Error updating folder:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!userId) return;
    
    if (!confirm('Are you sure you want to delete this folder?')) {
      return;
    }
    
    setLoading(true);
    try {
      const supabaseClient = await getSupabaseWithSession();
      const result = await deleteFolder(folderId, supabaseClient);
      
      if (result) {
        // If we're deleting the selected folder, clear selection
        if (selectedFolderId === folderId) {
          setSelectedFolderId(null);
        }
        loadAllData(); // Refresh all data
      } else {
        setError('Failed to delete folder');
      }
    } catch (err) {
      console.error('Error deleting folder:', err);
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
      loadAllData(); // Refresh posts
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadAllData();
    }
  }, [userId, selectedFolderId]);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Final Folder Integration Test</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Complete Folder & Post Integration</h2>
        <p className="text-sm text-gray-700">
          This page tests all aspects of folder functionality including creation, management, and integration with posts.
        </p>
      </div>
      
      {/* Space Configuration */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              onClick={loadAllData}
              disabled={loading || !userId}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full disabled:opacity-50"
            >
              Refresh All Data
            </button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Folder Management */}
        <div>
          {/* Create Folder Form */}
          <div className="mb-6 p-4 border rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Create New Folder</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="border p-2 w-full rounded"
                placeholder="Enter folder name"
                disabled={loading || !userId}
              />
              <textarea
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                className="border p-2 w-full rounded"
                placeholder="Enter folder description (optional)"
                rows={2}
                disabled={loading || !userId}
              />
              <button 
                onClick={handleCreateFolder}
                disabled={loading || !newFolderName.trim() || !userId}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                Create Folder
              </button>
            </div>
          </div>
          
          {/* Folder List */}
          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Folders ({folders.length})</h2>
            
            <div className="space-y-2 mb-4">
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
                <div key={folder.id} className="border rounded">
                  <div className="p-2">
                    <div className="flex justify-between items-center">
                      <div 
                        onClick={() => setSelectedFolderId(folder.id)}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">{folder.name}</div>
                        <div className="text-sm text-gray-600">{folder.description || 'No description'}</div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => {
                            const newName = prompt('Enter new name:', folder.name);
                            if (newName && newName.trim()) {
                              const newDescription = prompt('Enter new description:', folder.description || '');
                              handleUpdateFolder(folder.id, newName.trim(), newDescription !== null ? newDescription : undefined);
                            }
                          }}
                          disabled={loading}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white p-1 rounded text-sm disabled:opacity-50"
                          title="Edit folder"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteFolder(folder.id)}
                          disabled={loading}
                          className="bg-red-500 hover:bg-red-600 text-white p-1 rounded text-sm disabled:opacity-50"
                          title="Delete folder"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Posts: {folder.posts_count || 0} | 
                      Created: {new Date(folder.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Column - Post Management */}
        <div>
          {/* Create Post Form */}
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
                  disabled={loading || !userId}
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium">
                  Assigned Folder:
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
                disabled={loading || !postContent.trim() || !userId}
                className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {loading ? 'Creating Post...' : 'Create Post'}
              </button>
            </div>
          </div>
          
          {/* Posts List */}
          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold mb-3">
              Posts ({posts.length})
            </h2>
            
            {loading ? (
              <div className="text-center py-4">Loading posts...</div>
            ) : (
              <div className="space-y-3">
                {posts.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p>No posts found in this folder.</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className="border p-3 rounded">
                      <div className="font-medium mb-1">{post.content.substring(0, 100)}{post.content.length > 100 ? '...' : ''}</div>
                      <div className="text-sm text-gray-600 mb-2">
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
                      <div className="text-xs text-gray-500">
                        Created: {new Date(post.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}