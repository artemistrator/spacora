'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/lib/auth';
import { getFoldersBySpaceId, createFolder, updateFolder, deleteFolder } from '@/lib/folder-utils';

export default function TestFolderFunctionalityPage() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [testResult, setTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);
  const [testSpaceId] = useState('63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82'); // Тестовый space ID

  const runFolderTests = async () => {
    if (!userId) {
      setTestResult('User not authenticated');
      return;
    }

    setIsTesting(true);
    setTestResult('Starting folder functionality tests...\n');

    try {
      const supabaseClient = await getSupabaseWithSession();
      
      // Test 1: Get folders
      setTestResult(prev => prev + 'Test 1: Getting folders...\n');
      const folders = await getFoldersBySpaceId(testSpaceId, supabaseClient);
      setTestResult(prev => prev + `Found ${folders.length} folders\n`);
      
      // Test 2: Create folder
      setTestResult(prev => prev + '\nTest 2: Creating folder...\n');
      const testFolderName = `Test Folder ${Date.now()}`;
      const newFolder = await createFolder({
        name: testFolderName,
        description: 'Temporary test folder',
        space_id: testSpaceId
      }, supabaseClient);
      
      if (newFolder) {
        setTestResult(prev => prev + `Created folder: ${newFolder.name} (ID: ${newFolder.id})\n`);
        
        // Test 3: Update folder
        setTestResult(prev => prev + '\nTest 3: Updating folder...\n');
        const updatedFolder = await updateFolder(newFolder.id, {
          name: `${testFolderName} - Updated`,
          description: 'Updated test folder'
        }, supabaseClient);
        
        if (updatedFolder) {
          setTestResult(prev => prev + `Updated folder: ${updatedFolder.name}\n`);
          
          // Test 4: Delete folder
          setTestResult(prev => prev + '\nTest 4: Deleting folder...\n');
          const deleteResult = await deleteFolder(newFolder.id, supabaseClient);
          
          if (deleteResult) {
            setTestResult(prev => prev + 'Folder deleted successfully\n');
          } else {
            setTestResult(prev => prev + 'Failed to delete folder\n');
          }
        } else {
          setTestResult(prev => prev + 'Failed to update folder\n');
        }
      } else {
        setTestResult(prev => prev + 'Failed to create folder\n');
      }
      
      setTestResult(prev => prev + '\nAll tests completed!');
    } catch (error) {
      console.error('Test error:', error);
      setTestResult(prev => prev + `\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Folder Functionality Test</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <p className="text-sm text-gray-700">
          This page tests all folder functionality including create, read, update, and delete operations.
        </p>
      </div>
      
      <div className="mb-6">
        <button 
          onClick={runFolderTests}
          disabled={isTesting}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isTesting ? 'Running Tests...' : 'Run Folder Tests'}
        </button>
      </div>
      
      <div className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Test Results</h2>
        <pre className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap font-mono">
          {testResult || 'Click "Run Folder Tests" to start testing'}
        </pre>
      </div>
    </div>
  );
}