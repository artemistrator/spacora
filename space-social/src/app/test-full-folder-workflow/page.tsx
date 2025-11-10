'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/lib/auth';
import { getFoldersBySpaceId, createFolder, updateFolder, deleteFolder } from '@/lib/folder-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder as FolderIcon, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { PostCard } from '@/components/post/PostCard';

export default function TestFullFolderWorkflowPage() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [folders, setFolders] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testSpaceId, setTestSpaceId] = useState('63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82'); // Тестовый space ID
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [postContent, setPostContent] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');

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

  const loadPosts = async () => {
    if (!userId) return;
    
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

  const handleCreatePost = async () => {
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
      
      // Create post data
      const postData = {
        content: postContent,
        images: [],
        room_tag: null,
        style_tags: [],
        folder_id: selectedFolderId || null,
        space_id: testSpaceId,
        updated_at: new Date().toISOString(),
      };
      
      console.log('Creating post with data:', postData);
      
      // Insert post
      const { data, error } = await supabaseClient
        .from('posts')
        .insert(postData)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      
      console.log('Created post:', data);
      setPostContent('');
      setSelectedFolderId('');
      
      // Reload posts to show the new one
      loadPosts();
    } catch (err) {
      console.error('Error creating post:', err);
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
        // Also reload posts to update folder references
        loadPosts();
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
      loadPosts();
    }
  }, [userId]);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Full Folder Workflow Test</h1>
      
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <p className="text-sm text-gray-700">
          This page tests the complete folder workflow: create folders, create posts with folders, and display posts with folder information.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Folder Management */}
        <Card>
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
        
        {/* Post Creation */}
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
                onClick={handleCreatePost}
                disabled={loading || !postContent.trim() || !userId}
                className="w-full"
              >
                Create Post with Folder
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex gap-4 mb-6">
        <Button 
          onClick={() => {
            loadFolders();
            loadPosts();
          }}
          disabled={loading || !userId}
          variant="outline"
          className="flex items-center"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh All Data
        </Button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Folders List */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Folders ({folders.length})</h2>
          
          {folders.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">No folders found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
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
                            if (confirm(`Are you sure you want to delete folder "${folder.name}"? All posts in this folder will lose their folder association.`)) {
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
        
        {/* Posts List */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Posts ({posts.length})</h2>
          
          {posts.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">No posts found.</p>
            </div>
          ) : (
            <div className="space-y-6">
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
    </div>
  );
}