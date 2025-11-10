'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/lib/auth';
import { getFoldersBySpaceId, createFolder, updateFolder, deleteFolder } from '@/lib/folder-utils';
import { useRouter } from 'next/navigation';

export default function TestCompleteFolderWorkflowPage() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const router = useRouter();
  
  // State for folders
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for folder operations
  const [testSpaceId, setTestSpaceId] = useState('63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82'); // Тестовый space ID
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  
  // State for post creation
  const [postContent, setPostContent] = useState('');
  const [creatingPost, setCreatingPost] = useState(false);
  
  // State for folder selection in post
  const [postFolderId, setPostFolderId] = useState('');

  const loadFolders = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const supabaseClient = await getSupabaseWithSession();
      console.log('Loading folders for space:', testSpaceId);
      const folderList = await getFoldersBySpaceId(testSpaceId, supabaseClient);
      console.log('Loaded folders:', folderList);
      setFolders(folderList);
    } catch (err) {
      console.error('Error loading folders:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const supabaseClient = await getSupabaseWithSession();
      const folderData = {
        name: newFolderName,
        description: 'Test folder created from complete workflow test',
        space_id: testSpaceId
      };
      
      console.log('Creating folder:', folderData);
      const result = await createFolder(folderData, supabaseClient);
      console.log('Created folder:', result);
      
      if (result) {
        setNewFolderName('');
        loadFolders(); // Reload folders
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

  const handleUpdateFolder = async (folderId: string, newName: string) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const supabaseClient = await getSupabaseWithSession();
      console.log('Updating folder:', folderId, newName);
      const result = await updateFolder(folderId, { name: newName }, supabaseClient);
      console.log('Updated folder:', result);
      
      if (result) {
        loadFolders(); // Reload folders
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
    
    setLoading(true);
    setError(null);
    try {
      const supabaseClient = await getSupabaseWithSession();
      console.log('Deleting folder:', folderId);
      const result = await deleteFolder(folderId, supabaseClient);
      console.log('Deleted folder result:', result);
      
      if (result) {
        // If we're deleting the selected folder, clear selection
        if (selectedFolderId === folderId) {
          setSelectedFolderId(null);
        }
        // If we're deleting the post folder, clear selection
        if (postFolderId === folderId) {
          setPostFolderId('');
        }
        loadFolders(); // Reload folders
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

  const handleCreatePost = async () => {
    if (!postContent.trim() || !userId) return;
    
    setCreatingPost(true);
    setError(null);
    try {
      const supabaseClient = await getSupabaseWithSession();
      
      const postData = {
        content: postContent,
        images: [],
        folder_id: postFolderId || null,
        space_id: testSpaceId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      console.log('Creating post with data:', postData);
      const { error } = await supabaseClient
        .from('posts')
        .insert(postData);
      
      if (error) throw error;
      
      console.log('Post created successfully');
      setPostContent('');
      setPostFolderId('');
      alert('Post created successfully!');
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCreatingPost(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadFolders();
    }
  }, [userId]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Complete Folder Workflow Test</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <p className="text-sm text-gray-700">
          This page tests the complete folder workflow including folder management and post creation with folders.
        </p>
      </div>
      
      {/* Space ID Section */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
            onClick={loadFolders}
            disabled={loading || !userId}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full disabled:opacity-50"
          >
            Load Folders
          </button>
        </div>
      </div>
      
      {/* Create Folder Section */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Create New Folder</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="border p-2 flex-1 rounded"
            placeholder="Enter folder name"
            disabled={loading || !userId}
          />
          <button 
            onClick={handleCreateFolder}
            disabled={loading || !newFolderName.trim() || !userId}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
      
      {/* Create Post Section */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Create Post with Folder</h2>
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
              disabled={creatingPost || !userId}
            />
          </div>
          
          <div>
            <label className="block mb-2 font-medium">
              Select Folder for Post:
            </label>
            <select
              value={postFolderId}
              onChange={(e) => setPostFolderId(e.target.value)}
              className="border p-2 w-full rounded"
              disabled={creatingPost || !userId}
            >
              <option value="">No folder (default)</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={handleCreatePost}
            disabled={creatingPost || !postContent.trim() || !userId}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {creatingPost ? 'Creating Post...' : 'Create Post'}
          </button>
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
          Loading...
        </div>
      )}
      
      {/* Folders Display */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Folders in Space ({folders.length})</h2>
        {folders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No folders found in this space.</p>
            <p className="text-sm mt-2">Create a new folder using the form above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => (
              <div key={folder.id} className="border p-4 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg truncate">{folder.name}</h3>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        const newName = prompt('Enter new name:', folder.name);
                        if (newName && newName.trim()) {
                          handleUpdateFolder(folder.id, newName.trim());
                        }
                      }}
                      disabled={loading}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white p-1 rounded text-sm disabled:opacity-50"
                      title="Edit folder name"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete folder "${folder.name}"?`)) {
                          handleDeleteFolder(folder.id);
                        }
                      }}
                      disabled={loading}
                      className="bg-red-500 hover:bg-red-600 text-white p-1 rounded text-sm disabled:opacity-50"
                      title="Delete folder"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-3">{folder.description || 'No description'}</p>
                <div className="text-xs text-gray-500">
                  <p>Posts: {folder.posts_count || 0}</p>
                  <p className="mt-1">Created: {new Date(folder.created_at).toLocaleDateString()}</p>
                </div>
                
                {/* Folder Selection for Testing */}
                <div className="mt-3">
                  <button
                    onClick={() => setSelectedFolderId(folder.id === selectedFolderId ? null : folder.id)}
                    className={`text-xs px-2 py-1 rounded ${
                      selectedFolderId === folder.id 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {selectedFolderId === folder.id ? 'Selected' : 'Select for Testing'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Selected Folder Info */}
      {selectedFolderId && (
        <div className="mt-4 p-3 bg-green-100 rounded">
          <p className="text-green-800">
            Selected folder for testing: {folders.find(f => f.id === selectedFolderId)?.name}
          </p>
        </div>
      )}
    </div>
  );
}