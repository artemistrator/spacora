'use client';

import { useState } from 'react';
import { FolderList } from '@/components/space/FolderList';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

export default function TestFolderListPage() {
  const [spaceId, setSpaceId] = useState('63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82'); // Тестовый space ID
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [key, setKey] = useState(0); // Для перезагрузки компонента

  const handleRefresh = () => {
    setKey(prev => prev + 1);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Test FolderList Component</h1>
      
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <p className="text-sm text-gray-700">
          This page tests the FolderList component in isolation. You can change the space ID and see how folders are displayed.
        </p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>FolderList Test Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Space ID:
              </label>
              <Input
                type="text"
                value={spaceId}
                onChange={(e) => setSpaceId(e.target.value)}
                className="w-full"
                placeholder="Enter space ID"
              />
            </div>
            
            <Button 
              onClick={handleRefresh}
              className="flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh FolderList
            </Button>
          </div>
          
          <div className="mt-4">
            <p className="text-sm font-medium">Selected Folder ID:</p>
            <p className="text-sm text-gray-600">
              {selectedFolderId === null ? 'All posts (no folder)' : selectedFolderId || 'None'}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">FolderList Component</h2>
        <FolderList 
          key={key}
          spaceId={spaceId} 
          onFolderSelect={setSelectedFolderId}
          selectedFolderId={selectedFolderId}
        />
      </div>
      
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">How to Test:</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
          <li>Change the Space ID to test with different spaces</li>
          <li>Click on folders to select them</li>
          <li>Click "All posts" to show posts without folders</li>
          <li>Use the refresh button to reload the FolderList component</li>
          <li>Check that folder creation, editing, and deletion work correctly</li>
        </ul>
      </div>
    </div>
  );
}