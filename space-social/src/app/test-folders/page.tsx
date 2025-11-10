'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/lib/auth';
import { getFoldersBySpaceId, createFolder, updateFolder, deleteFolder } from '@/lib/folder-utils';

export default function TestFoldersPage() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testSpaceId, setTestSpaceId] = useState('63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82'); // Тестовый space ID
  const [newFolderName, setNewFolderName] = useState('');

  const loadFolders = async () => {
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
    if (!newFolderName.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const supabaseClient = await getSupabaseWithSession();
      const folderData = {
        name: newFolderName,
        description: 'Test folder',
        space_id: testSpaceId
      };
      
      console.log('Creating folder:', folderData);
      const result = await createFolder(folderData, supabaseClient);
      console.log('Created folder:', result);
      
      if (result) {
        setNewFolderName('');
        loadFolders(); // Reload folders
      }
    } catch (err) {
      console.error('Error creating folder:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFolder = async (folderId: string, newName: string) => {
    setLoading(true);
    setError(null);
    try {
      const supabaseClient = await getSupabaseWithSession();
      console.log('Updating folder:', folderId, newName);
      const result = await updateFolder(folderId, { name: newName }, supabaseClient);
      console.log('Updated folder:', result);
      
      if (result) {
        loadFolders(); // Reload folders
      }
    } catch (err) {
      console.error('Error updating folder:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const supabaseClient = await getSupabaseWithSession();
      console.log('Deleting folder:', folderId);
      const result = await deleteFolder(folderId, supabaseClient);
      console.log('Deleted folder result:', result);
      
      if (result) {
        loadFolders(); // Reload folders
      }
    } catch (err) {
      console.error('Error deleting folder:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Folders Functionality</h1>
      
      <div className="mb-4">
        <label className="block mb-2">
          Space ID:
          <input
            type="text"
            value={testSpaceId}
            onChange={(e) => setTestSpaceId(e.target.value)}
            className="border p-2 w-full"
          />
        </label>
        <button 
          onClick={loadFolders}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
        >
          Load Folders
        </button>
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">
          New Folder Name:
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="border p-2 w-full"
          />
        </label>
        <button 
          onClick={handleCreateFolder}
          disabled={loading || !newFolderName.trim()}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Create Folder
        </button>
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
        <h2 className="text-xl font-semibold mb-2">Folders:</h2>
        {folders.length === 0 ? (
          <p>No folders found</p>
        ) : (
          <ul className="space-y-2">
            {folders.map((folder) => (
              <li key={folder.id} className="border p-3 rounded flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{folder.name}</h3>
                  <p className="text-sm text-gray-600">{folder.description}</p>
                  <p className="text-xs text-gray-500">Posts: {folder.posts_count}</p>
                </div>
                <div className="space-x-2">
                  <button 
                    onClick={() => {
                      const newName = prompt('Enter new name:', folder.name);
                      if (newName) {
                        handleUpdateFolder(folder.id, newName);
                      }
                    }}
                    disabled={loading}
                    className="bg-yellow-500 hover:bg-yellow-700 text-white py-1 px-2 rounded text-sm"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteFolder(folder.id)}
                    disabled={loading}
                    className="bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}