'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/lib/auth';
import { getFoldersBySpaceId } from '@/lib/folder-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder as FolderIcon } from 'lucide-react';

export default function TestPostWithFolderPage() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testSpaceId, setTestSpaceId] = useState('63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82'); // Тестовый space ID
  const [content, setContent] = useState('');
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

  const handleCreatePost = async () => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }
    
    if (!content.trim()) {
      setError('Content is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const supabaseClient = await getSupabaseWithSession();
      
      // Create post data
      const postData = {
        content,
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
      alert('Post created successfully!');
      setContent('');
      setSelectedFolderId('');
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
      <h1 className="text-3xl font-bold mb-6">Test Post Creation with Folder</h1>
      
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <p className="text-sm text-gray-700">
          This page tests creating a post with folder selection. Make sure you're logged in and have access to the space.
        </p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create Post with Folder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
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
                Post Content:
              </label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full"
                placeholder="Enter post content"
                rows={4}
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
            
            <div className="flex gap-2">
              <Button 
                onClick={handleCreatePost}
                disabled={loading || !content.trim() || !userId}
              >
                Create Post
              </Button>
              
              <Button 
                onClick={loadFolders}
                disabled={loading || !userId}
                variant="outline"
              >
                Refresh Folders
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Available Folders ({folders.length})</h2>
        
        {folders.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">No folders found in this space.</p>
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
    </div>
  );
}