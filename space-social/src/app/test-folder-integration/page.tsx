'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/lib/auth';
import { getFoldersBySpaceId, createFolder, updateFolder, deleteFolder } from '@/lib/folder-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder as FolderIcon, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';

export default function TestFolderIntegrationPage() {
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
        description: newFolderDescription,
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

  const handleUpdateFolder = async (folderId: string, newName: string, newDescription: string) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const supabaseClient = await getSupabaseWithSession();
      console.log('Updating folder:', folderId, newName, newDescription);
      const result = await updateFolder(folderId, { name: newName, description: newDescription }, supabaseClient);
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
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Test Folder Integration</h1>
      
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <p className="text-sm text-gray-700">
          This page tests the complete folder functionality integration. Make sure you're logged in and have access to the space.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Folder Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Folder Name:
                  </label>
                  <Input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full"
                    placeholder="Enter folder name"
                    disabled={loading || !userId}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description:
                  </label>
                  <Input
                    type="text"
                    value={newFolderDescription}
                    onChange={(e) => setNewFolderDescription(e.target.value)}
                    className="w-full"
                    placeholder="Enter description"
                    disabled={loading || !userId}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateFolder}
                  disabled={loading || !newFolderName.trim() || !userId}
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Folder
                </Button>
                
                <Button 
                  onClick={loadFolders}
                  disabled={loading || !userId}
                  variant="outline"
                  className="flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">User ID:</p>
                <p className="text-sm text-gray-600 truncate">{userId || 'Not logged in'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Space ID:</p>
                <p className="text-sm text-gray-600 truncate">{testSpaceId}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Folders Count:</p>
                <p className="text-sm text-gray-600">{folders.length}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Status:</p>
                <p className="text-sm text-gray-600">
                  {loading ? 'Loading...' : 'Ready'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Folders in Space ({folders.length})</h2>
        
        {folders.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">No folders found in this space.</p>
            <p className="text-sm text-gray-400">Create a new folder using the form above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => (
              <Card key={folder.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FolderIcon className="h-5 w-5 mr-2 text-blue-500" />
                      <span className="truncate">{folder.name}</span>
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          const newName = prompt('Enter new name:', folder.name) || folder.name;
                          const newDescription = prompt('Enter new description:', folder.description || '') || '';
                          handleUpdateFolder(folder.id, newName, newDescription);
                        }}
                        disabled={loading}
                        title="Edit folder"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete folder "${folder.name}"?`)) {
                            handleDeleteFolder(folder.id);
                          }
                        }}
                        disabled={loading}
                        title="Delete folder"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    {folder.description || 'No description'}
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Posts: {folder.posts_count || 0}</p>
                    <p>Created: {new Date(folder.created_at).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}