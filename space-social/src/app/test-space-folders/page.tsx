'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/lib/auth';
import { getFoldersBySpaceId, createFolder, updateFolder, deleteFolder } from '@/lib/folder-utils';

export default function TestSpaceFoldersPage() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testSpaceId, setTestSpaceId] = useState('63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82'); // Тестовый space ID
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');

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
        description: newFolderDescription || 'Test folder created from test page',
        space_id: testSpaceId
      };
      
      console.log('Creating folder:', folderData);
      const result = await createFolder(folderData, supabaseClient);
      console.log('Created folder:', result);
      
      if (result) {
        setNewFolderName('');
        setNewFolderDescription('');
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

  const handleUpdateFolder = async (folderId: string, newName: string, newDescription?: string) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const supabaseClient = await getSupabaseWithSession();
      console.log('Updating folder:', folderId, newName, newDescription);
      
      const updates: any = { name: newName };
      if (newDescription !== undefined) {
        updates.description = newDescription;
      }
      
      const result = await updateFolder(folderId, updates, supabaseClient);
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

  useEffect(() => {
    if (userId) {
      loadFolders();
    }
  }, [userId]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Space Folders</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <p className="text-sm text-gray-700">
          This page tests folder functionality for a specific space. Make sure you're logged in and have access to the space.
        </p>
      </div>
      
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
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      {loading && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Loading...
        </div>
      )}
      
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
                  <p className="mt-1">Updated: {new Date(folder.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}