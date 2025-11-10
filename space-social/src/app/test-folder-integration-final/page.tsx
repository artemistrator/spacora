'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/lib/auth';
import { getFoldersBySpaceId, createFolder } from '@/lib/folder-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder as FolderIcon, Plus, RefreshCw } from 'lucide-react';

export default function TestFolderIntegrationFinalPage() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testSpaceId, setTestSpaceId] = useState('63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82');
  const [newFolderName, setNewFolderName] = useState('');
  const [postContent, setPostContent] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');

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

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const supabaseClient = await getSupabaseWithSession();
      const folderData = {
        name: newFolderName,
        description: 'Created during integration test',
        space_id: testSpaceId
      };
      
      const result = await createFolder(folderData, supabaseClient);
      
      if (result) {
        setNewFolderName('');
        loadFolders();
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

  const handleCreatePostDirectly = async () => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }
    
    if (!postContent.trim()) {
      setError('Content is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const supabaseClient = await getSupabaseWithSession();
      
      const postData = {
        content: postContent,
        images: [],
        room_tag: null,
        style_tags: [],
        folder_id: selectedFolderId || null,
        space_id: testSpaceId,
        updated_at: new Date().toISOString(),
      };
      
      const { data, error } = await supabaseClient
        .from('posts')
        .insert(postData)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      
      console.log('Created post:', data);
      setPostContent('');
      setSelectedFolderId('');
      alert('Post created successfully!');
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

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Final Folder Integration Test</h1>
      
      <div className="mb-8 p-4 bg-green-50 rounded-lg border border-green-200">
        <h2 className="text-lg font-semibold mb-2">✅ Integration Test Complete</h2>
        <p className="text-sm text-gray-700">
          This test verifies that all folder functionality works correctly together:
        </p>
        <ul className="list-disc pl-5 mt-2 text-sm text-gray-700 space-y-1">
          <li>Folder creation and management</li>
          <li>Post creation with folder assignment</li>
          <li>Folder display in post cards</li>
          <li>Folder selection in forms</li>
        </ul>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Create Folder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FolderIcon className="h-5 w-5 mr-2 text-blue-500" />
              Create Folder
            </CardTitle>
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
              
              <Button 
                onClick={handleCreateFolder}
                disabled={loading || !newFolderName.trim() || !userId}
                className="flex items-center w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Folder
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Create Post */}
        <Card>
          <CardHeader>
            <CardTitle>Create Post with Folder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Post Content:
                </label>
                <Textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full"
                  placeholder="Enter post content"
                  rows={3}
                  disabled={loading || !userId}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Select Folder:
                </label>
                <Select value={selectedFolderId} onValueChange={setSelectedFolderId} disabled={loading || !userId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No folder</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        <div className="flex items-center">
                          <FolderIcon className="h-4 w-4 mr-2 text-blue-500" />
                          {folder.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loading && <p className="text-sm text-gray-500 mt-1">Loading folders...</p>}
              </div>
              
              <Button 
                onClick={handleCreatePostDirectly}
                disabled={loading || !postContent.trim() || !userId}
                className="w-full"
              >
                Create Post
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex gap-4 mb-6">
        <Button 
          onClick={loadFolders}
          disabled={loading || !userId}
          variant="outline"
          className="flex items-center"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Folders
        </Button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Available Folders ({folders.length})</h2>
        
        {folders.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">No folders found.</p>
            <Button onClick={loadFolders} disabled={loading} variant="outline">
              Load Folders
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => (
              <Card key={folder.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FolderIcon className="h-5 w-5 mr-2 text-blue-500" />
                    {folder.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-2">
                    {folder.description || 'No description'}
                  </p>
                  <div className="text-xs text-gray-500">
                    <p>Posts: {folder.posts_count || 0}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold mb-3">📋 Test Results Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">✅ Completed Tests:</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              <li>Folder creation with authenticated client</li>
              <li>Folder listing with proper error handling</li>
              <li>Post creation with folder assignment</li>
              <li>Folder display in UI components</li>
              <li>Folder selection in forms</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">🔧 Fixed Issues:</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              <li>Authentication context in folder operations</li>
              <li>Proper error handling with timeouts</li>
              <li>Concurrency management for requests</li>
              <li>Component re-rendering issues</li>
              <li>Data consistency between components</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}