'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/lib/auth';
import { getFoldersBySpaceId, createFolder, updateFolder, deleteFolder } from '@/lib/folder-utils';
import { requestManager } from '@/lib/request-manager';

export default function TestFolderFinalVerificationPage() {
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

  const runFinalVerificationTests = async () => {
    setIsTesting(true);
    setTestResults([]);
    
    try {
      const supabaseClient = await getSupabaseWithSession();
      
      // Test 1: Authentication and basic folder retrieval
      try {
        addTestResult('Authentication Check', 'Running', 'Verifying authenticated access to folders');
        const folders = await getFoldersBySpaceId(testSpaceId, supabaseClient);
        addTestResult('Authentication Check', 'Passed', `Retrieved ${folders.length} folders successfully`);
      } catch (error) {
        addTestResult('Authentication Check', 'Failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return; // Stop if authentication fails
      }
      
      // Test 2: Folder creation
      try {
        addTestResult('Folder Creation', 'Running', 'Creating test folder');
        const testFolderName = `Final Verification Test ${Date.now()}`;
        const newFolder = await createFolder({
          name: testFolderName,
          description: 'Temporary test folder for final verification',
          space_id: testSpaceId
        }, supabaseClient);
        
        if (newFolder) {
          addTestResult('Folder Creation', 'Passed', `Created folder: ${newFolder.name} (${newFolder.id})`);
          
          // Test 3: Folder update
          try {
            addTestResult('Folder Update', 'Running', 'Updating test folder');
            const updatedFolder = await updateFolder(newFolder.id, {
              name: `${testFolderName} - Updated`,
              description: 'Updated test folder for final verification'
            }, supabaseClient);
            
            if (updatedFolder) {
              addTestResult('Folder Update', 'Passed', `Updated folder: ${updatedFolder.name}`);
              
              // Test 4: Folder deletion
              try {
                addTestResult('Folder Deletion', 'Running', 'Deleting test folder');
                const deleteResult = await deleteFolder(newFolder.id, supabaseClient);
                
                if (deleteResult) {
                  addTestResult('Folder Deletion', 'Passed', 'Folder deleted successfully');
                } else {
                  addTestResult('Folder Deletion', 'Failed', 'Folder deletion returned false');
                }
              } catch (error) {
                addTestResult('Folder Deletion', 'Failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            } else {
              addTestResult('Folder Update', 'Failed', 'Folder update returned null');
            }
          } catch (error) {
            addTestResult('Folder Update', 'Failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        } else {
          addTestResult('Folder Creation', 'Failed', 'Folder creation returned null');
        }
      } catch (error) {
        addTestResult('Folder Creation', 'Failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Test 5: Request manager functionality
      try {
        addTestResult('Request Manager', 'Running', 'Testing concurrent request handling');
        
        // Check initial status
        const initialStatus = requestManager.getStatus();
        addTestResult('Request Manager', 'Info', `Initial status: ${JSON.stringify(initialStatus)}`);
        
        // Simulate concurrent requests
        const promises = [];
        for (let i = 0; i < 5; i++) {
          promises.push(requestManager.execute(() => getFoldersBySpaceId(testSpaceId, supabaseClient)));
        }
        
        const results = await Promise.all(promises);
        addTestResult('Request Manager', 'Passed', `Handled ${results.length} concurrent requests successfully`);
        
        // Check final status
        const finalStatus = requestManager.getStatus();
        addTestResult('Request Manager', 'Info', `Final status: ${JSON.stringify(finalStatus)}`);
      } catch (error) {
        addTestResult('Request Manager', 'Failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Test 6: Error handling
      try {
        addTestResult('Error Handling', 'Running', 'Testing error scenarios');
        
        // Test with invalid folder ID
        const invalidUpdate = await updateFolder('invalid-id', { name: 'test' }, supabaseClient);
        if (!invalidUpdate) {
          addTestResult('Error Handling', 'Passed', 'Properly handled invalid folder ID');
        } else {
          addTestResult('Error Handling', 'Warning', 'Unexpected success with invalid folder ID');
        }
      } catch (error) {
        addTestResult('Error Handling', 'Passed', `Properly caught error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      addTestResult('Final Verification', 'Completed', 'All tests finished');
    } catch (error) {
      console.error('Final verification error:', error);
      addTestResult('Final Verification', 'Fatal Error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Folder Final Verification Test</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Final Integration Verification</h2>
        <p className="text-sm text-gray-700">
          This page performs a comprehensive test of all folder functionality to verify complete integration.
        </p>
      </div>
      
      {/* Controls */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Test Controls</h2>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={runFinalVerificationTests}
            disabled={isTesting || !userId}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isTesting ? 'Running Tests...' : 'Run Final Verification'}
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
            <p>Run final verification tests to see results.</p>
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
      
      {/* Summary */}
      {testResults.length > 0 && (
        <div className="mt-6 p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Test Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-2 bg-green-100 rounded text-center">
              <div className="text-2xl font-bold">
                {testResults.filter(t => t.status === 'Passed').length}
              </div>
              <div className="text-sm">Passed</div>
            </div>
            <div className="p-2 bg-red-100 rounded text-center">
              <div className="text-2xl font-bold">
                {testResults.filter(t => t.status === 'Failed').length}
              </div>
              <div className="text-sm">Failed</div>
            </div>
            <div className="p-2 bg-yellow-100 rounded text-center">
              <div className="text-2xl font-bold">
                {testResults.filter(t => t.status === 'Warning').length}
              </div>
              <div className="text-sm">Warnings</div>
            </div>
            <div className="p-2 bg-blue-100 rounded text-center">
              <div className="text-2xl font-bold">
                {testResults.filter(t => t.status === 'Info').length}
              </div>
              <div className="text-sm">Info</div>
            </div>
            <div className="p-2 bg-gray-100 rounded text-center">
              <div className="text-2xl font-bold">
                {testResults.length}
              </div>
              <div className="text-sm">Total</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}