'use client';

import { useState } from 'react';
import { PostForm } from '@/components/post/PostForm';

export default function TestPostFormWithFoldersPage() {
  const [spaceId, setSpaceId] = useState('63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82');
  
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Post Form with Folders Test</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <p className="text-sm text-gray-700">
          This page tests the PostForm component with folder selection functionality.
        </p>
      </div>
      
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Space Configuration</h2>
        <div>
          <label className="block mb-2 font-medium">
            Space ID:
          </label>
          <input
            type="text"
            value={spaceId}
            onChange={(e) => setSpaceId(e.target.value)}
            className="border p-2 w-full rounded"
            placeholder="Enter space ID"
          />
        </div>
      </div>
      
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Create New Post</h2>
        <PostForm spaceId={spaceId} />
      </div>
      
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold mb-2">Testing Instructions:</h3>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>Ensure you are logged in</li>
          <li>Verify that folders load correctly for the specified space</li>
          <li>Test creating a post with and without folder selection</li>
          <li>Check that folder selection dropdown shows all available folders</li>
          <li>Verify that posts are correctly associated with folders in the database</li>
        </ul>
      </div>
    </div>
  );
}