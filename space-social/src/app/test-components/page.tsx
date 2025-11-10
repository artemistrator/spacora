'use client';

import { useState, useEffect } from 'react';
import { FolderList } from '@/components/space/FolderList';
import { PostCard } from '@/components/post/PostCard';

export default function TestComponentsPage() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [testPost, setTestPost] = useState<any>(null);

  useEffect(() => {
    // Create a test post
    const post = {
      id: 'test-post-id',
      space_id: '63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82',
      content: 'Тестовый пост для проверки компонентов',
      images: [],
      likes_count: 5,
      comments_count: 3,
      shares_count: 1,
      folder_id: 'eb59f657-1401-4a78-9521-f0226e5da869',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setTestPost(post);
  }, []);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Тест компонентов</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">FolderList</h2>
        <FolderList 
          spaceId="63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82"
          onFolderSelect={setSelectedFolderId}
          selectedFolderId={selectedFolderId}
        />
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">PostCard</h2>
        {testPost && (
          <div className="max-w-sm">
            <PostCard 
              post={testPost}
              onClick={() => console.log('Post clicked')}
            />
          </div>
        )}
      </div>
      
      <div className="p-4 bg-blue-100 rounded">
        <p>Выбранная папка: {selectedFolderId || 'все посты'}</p>
      </div>
    </div>
  );
}