'use client';

import { useState } from 'react';
import { useSupabaseAuth } from '@/lib/auth';
import { createFolder, getFoldersBySpaceId } from '@/lib/folder-utils';

export default function TestFolderFinalPage() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testSpaceId] = useState('63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82');

  const addTestResult = (testName: string, status: string, details: string = '') => {
    setTestResults(prev => [...prev, {
      testName,
      status,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runFinalTest = async () => {
    setTestResults([]);
    
    try {
      // Check authentication
      addTestResult('Authentication Check', 'Running', 'Verifying user authentication');
      if (!userId) {
        addTestResult('Authentication Check', 'Failed', 'User not authenticated');
        return;
      }
      addTestResult('Authentication Check', 'Passed', `User ID: ${userId}`);
      
      // Get authenticated client
      addTestResult('Get Client', 'Running', 'Getting Supabase client');
      const supabaseClient = await getSupabaseWithSession();
      addTestResult('Get Client', 'Passed', 'Got client successfully');
      
      // Test folder creation
      addTestResult('Folder Creation', 'Running', 'Creating test folder');
      const testFolderName = `Final Test ${Date.now()}`;
      
      console.log('=== DEBUG FOLDER CREATION ===');
      console.log('User ID:', userId);
      console.log('Space ID:', testSpaceId);
      console.log('Folder name:', testFolderName);
      
      const newFolder = await createFolder({
        name: testFolderName,
        space_id: testSpaceId
      }, userId, supabaseClient);
      
      console.log('Folder creation result:', newFolder);
      
      if (newFolder) {
        addTestResult('Folder Creation', 'Passed', `Created folder: ${newFolder.name} (${newFolder.id})`);
        
        // Verify folder exists
        addTestResult('Verification', 'Running', 'Verifying folder exists');
        const folders = await getFoldersBySpaceId(testSpaceId, supabaseClient);
        const createdFolder = folders.find(f => f.id === newFolder.id);
        if (createdFolder) {
          addTestResult('Verification', 'Passed', 'Folder verified in list');
        } else {
          addTestResult('Verification', 'Warning', 'Folder not found in list');
        }
        
        // Clean up
        addTestResult('Cleanup', 'Running', 'Deleting test folder');
        try {
          const { error } = await supabaseClient
            .from('folders')
            .delete()
            .eq('id', newFolder.id);
          
          if (error) {
            addTestResult('Cleanup', 'Warning', `Delete error: ${error.message}`);
          } else {
            addTestResult('Cleanup', 'Passed', 'Test folder deleted');
          }
        } catch (deleteError: any) {
          addTestResult('Cleanup', 'Error', `Delete failed: ${deleteError.message}`);
        }
      } else {
        addTestResult('Folder Creation', 'Failed', 'Folder creation returned null');
        
        // Try direct insert for debugging
        addTestResult('Direct Insert', 'Running', 'Attempting direct insert for debugging');
        try {
          const { data, error } = await supabaseClient
            .from('folders')
            .insert({
              name: testFolderName,
              space_id: testSpaceId
            })
            .select()
            .maybeSingle();
          
          console.log('Direct insert result:', { data, error });
          
          if (error) {
            addTestResult('Direct Insert', 'Failed', `Error: ${error.message}`);
            if (error.details) {
              addTestResult('Error Details', 'Error', `Details: ${error.details}`);
            }
            if (error.hint) {
              addTestResult('Error Hint', 'Error', `Hint: ${error.hint}`);
            }
          } else {
            addTestResult('Direct Insert', 'Passed', `Success: ${data?.name}`);
            
            // Clean up direct insert
            if (data?.id) {
              await supabaseClient
                .from('folders')
                .delete()
                .eq('id', data.id);
              addTestResult('Direct Cleanup', 'Passed', 'Direct insert cleaned up');
            }
          }
        } catch (directError: any) {
          addTestResult('Direct Insert', 'Error', `Direct error: ${directError.message}`);
        }
      }
      
      addTestResult('Test Complete', 'Finished', 'All tests completed');
    } catch (error: any) {
      console.error('Test error:', error);
      addTestResult('Test Error', 'Error', `Error: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Final Folder Test</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Test Folder Creation</h2>
        <p className="text-sm text-gray-700">
          This page tests the final folder creation implementation.
        </p>
      </div>
      
      {/* Controls */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Test Controls</h2>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={runFinalTest}
            disabled={!userId}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            Run Final Test
          </button>
          
          <button 
            onClick={() => setTestResults([])}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
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
            <p>Run test to see results.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {testResults.map((test, index) => (
              <div key={index} className={`border p-3 rounded ${
                test.status === 'Passed' ? 'border-green-200 bg-green-50' :
                test.status === 'Failed' ? 'border-red-200 bg-red-50' :
                test.status === 'Error' ? 'border-red-200 bg-red-50' :
                test.status === 'Warning' ? 'border-yellow-200 bg-yellow-50' :
                test.status === 'Info' ? 'border-blue-200 bg-blue-50' :
                test.status === 'Running' ? 'border-gray-200 bg-gray-50' :
                test.status === 'Finished' ? 'border-purple-200 bg-purple-50' :
                'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{test.testName}</h3>
                  <span className={`text-sm font-medium px-2 py-1 rounded ${
                    test.status === 'Passed' ? 'bg-green-100 text-green-800' :
                    test.status === 'Failed' ? 'bg-red-100 text-red-800' :
                    test.status === 'Error' ? 'bg-red-100 text-red-800' :
                    test.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                    test.status === 'Info' ? 'bg-blue-100 text-blue-800' :
                    test.status === 'Running' ? 'bg-gray-100 text-gray-800' :
                    test.status === 'Finished' ? 'bg-purple-100 text-purple-800' :
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