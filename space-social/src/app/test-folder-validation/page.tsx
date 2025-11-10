'use client';

import { useState } from 'react';
import { useSupabaseAuth } from '@/lib/auth';
import { createFolder, getFoldersBySpaceId } from '@/lib/folder-utils';

export default function TestFolderValidationPage() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testSpaceId] = useState('63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82');

  const addTestResult = (testName: string, status: string, details: string = '') => {
    setTestResults(prev => [...prev, {
      testName,
      status,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runValidationTests = async () => {
    setIsTesting(true);
    setTestResults([]);
    
    try {
      const supabaseClient = await getSupabaseWithSession();
      
      // Test 1: Check authentication
      addTestResult('Authentication Check', 'Running', 'Verifying user authentication');
      if (!userId) {
        addTestResult('Authentication Check', 'Failed', 'User not authenticated');
        return;
      }
      addTestResult('Authentication Check', 'Passed', `User ID: ${userId}`);
      
      // Test 2: Test folder creation with minimal data
      try {
        addTestResult('Minimal Folder Creation', 'Running', 'Creating folder with minimal data');
        const testFolderName = `Validation Test ${Date.now()}`;
        const newFolder = await createFolder({
          name: testFolderName,
          space_id: testSpaceId
        }, supabaseClient);
        
        if (newFolder) {
          addTestResult('Minimal Folder Creation', 'Passed', `Created folder: ${newFolder.name} (${newFolder.id})`);
          
          // Clean up
          await supabaseClient
            .from('folders')
            .delete()
            .eq('id', newFolder.id);
          addTestResult('Cleanup', 'Passed', 'Test folder deleted');
        } else {
          addTestResult('Minimal Folder Creation', 'Failed', 'Folder creation returned null');
        }
      } catch (error) {
        addTestResult('Minimal Folder Creation', 'Failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Test 3: Test folder creation with full data
      try {
        addTestResult('Full Folder Creation', 'Running', 'Creating folder with full data');
        const testFolderName = `Full Validation Test ${Date.now()}`;
        const newFolder = await createFolder({
          name: testFolderName,
          description: 'Test folder with full data',
          space_id: testSpaceId,
          color: '#3b82f6',
          icon: 'Folder'
        }, supabaseClient);
        
        if (newFolder) {
          addTestResult('Full Folder Creation', 'Passed', `Created folder: ${newFolder.name} (${newFolder.id})`);
          
          // Verify the folder data
          if (newFolder.description === 'Test folder with full data') {
            addTestResult('Description Validation', 'Passed', 'Description correctly set');
          } else {
            addTestResult('Description Validation', 'Failed', `Expected "Test folder with full data", got "${newFolder.description}"`);
          }
          
          // Clean up
          await supabaseClient
            .from('folders')
            .delete()
            .eq('id', newFolder.id);
          addTestResult('Cleanup', 'Passed', 'Test folder deleted');
        } else {
          addTestResult('Full Folder Creation', 'Failed', 'Folder creation returned null');
        }
      } catch (error) {
        addTestResult('Full Folder Creation', 'Failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Test 4: Test folder creation with empty description
      try {
        addTestResult('Empty Description Test', 'Running', 'Creating folder with empty description');
        const testFolderName = `Empty Description Test ${Date.now()}`;
        const newFolder = await createFolder({
          name: testFolderName,
          description: '',
          space_id: testSpaceId
        }, supabaseClient);
        
        if (newFolder) {
          addTestResult('Empty Description Test', 'Passed', `Created folder: ${newFolder.name} (${newFolder.id})`);
          
          // Clean up
          await supabaseClient
            .from('folders')
            .delete()
            .eq('id', newFolder.id);
          addTestResult('Cleanup', 'Passed', 'Test folder deleted');
        } else {
          addTestResult('Empty Description Test', 'Failed', 'Folder creation returned null');
        }
      } catch (error) {
        addTestResult('Empty Description Test', 'Failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Test 5: Test folder retrieval
      try {
        addTestResult('Folder Retrieval', 'Running', 'Retrieving folders for space');
        const folders = await getFoldersBySpaceId(testSpaceId, supabaseClient);
        addTestResult('Folder Retrieval', 'Passed', `Retrieved ${folders.length} folders`);
      } catch (error) {
        addTestResult('Folder Retrieval', 'Failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      addTestResult('Validation Tests', 'Completed', 'All tests finished');
    } catch (error) {
      console.error('Validation test error:', error);
      addTestResult('Validation Tests', 'Fatal Error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Folder Validation Tests</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Folder Data Validation</h2>
        <p className="text-sm text-gray-700">
          This page tests the validation and handling of folder data including optional fields.
        </p>
      </div>
      
      {/* Controls */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Test Controls</h2>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={runValidationTests}
            disabled={isTesting || !userId}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isTesting ? 'Running Tests...' : 'Run Validation Tests'}
          </button>
          
          <button 
            onClick={() => setTestResults([])}
            disabled={isTesting}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            Clear Results
          </button>
        </div>
        
        {!userId && (
          <div className="mt-3 text-sm text-red-600">
            Please log in to run tests
          </div>
        )}
      </div>
      
      {/* Results */}
      <div className="p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Test Results ({testResults.length})</h2>
        
        {testResults.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <p>Run validation tests to see results.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {testResults.map((test, index) => (
              <div key={index} className={`border p-3 rounded ${
                test.status === 'Passed' ? 'border-green-200 bg-green-50' :
                test.status === 'Failed' ? 'border-red-200 bg-red-50' :
                test.status === 'Warning' ? 'border-yellow-200 bg-yellow-50' :
                test.status === 'Info' ? 'border-blue-200 bg-blue-50' :
                test.status === 'Running' ? 'border-gray-200 bg-gray-50' :
                'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{test.testName}</h3>
                  <span className={`text-sm font-medium px-2 py-1 rounded ${
                    test.status === 'Passed' ? 'bg-green-100 text-green-800' :
                    test.status === 'Failed' ? 'bg-red-100 text-red-800' :
                    test.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                    test.status === 'Info' ? 'bg-blue-100 text-blue-800' :
                    test.status === 'Running' ? 'bg-gray-100 text-gray-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {test.status}
                  </span>
                </div>
                
                <div className="text-sm">
                  <p>{test.details}</p>
                  <p className="text-xs text-gray-500 mt-1">{test.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}