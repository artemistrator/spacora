'use client';

import { useState } from 'react';
import { useSupabaseAuth } from '@/lib/auth';
import { getFoldersBySpaceId, createFolder, updateFolder, deleteFolder } from '@/lib/folder-utils';

export default function TestFolderErrorHandlingPage() {
  const { getSupabaseWithSession } = useSupabaseAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testSpaceId, setTestSpaceId] = useState('63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82');

  const addTestResult = (testName: string, result: any, error: any = null) => {
    setTestResults(prev => [...prev, {
      testName,
      result,
      error,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runErrorHandlingTests = async () => {
    setIsTesting(true);
    setTestResults([]);
    
    try {
      const supabaseClient = await getSupabaseWithSession();
      
      // Test 1: Invalid space ID
      try {
        addTestResult('Invalid Space ID Test', 'Starting...');
        const folders = await getFoldersBySpaceId('invalid-space-id', supabaseClient);
        addTestResult('Invalid Space ID Test', 'Unexpected success', null);
      } catch (error) {
        addTestResult('Invalid Space ID Test', 'Error caught as expected', error);
      }
      
      // Test 2: Empty folder name
      try {
        addTestResult('Empty Folder Name Test', 'Starting...');
        const result = await createFolder({
          name: '',
          description: 'Test',
          space_id: testSpaceId
        }, supabaseClient);
        addTestResult('Empty Folder Name Test', 'Result: ' + (result ? 'Success' : 'Failed as expected'), null);
      } catch (error) {
        addTestResult('Empty Folder Name Test', 'Error caught', error);
      }
      
      // Test 3: Update non-existent folder
      try {
        addTestResult('Update Non-existent Folder Test', 'Starting...');
        const result = await updateFolder('non-existent-id', { name: 'Test' }, supabaseClient);
        addTestResult('Update Non-existent Folder Test', 'Result: ' + (result ? 'Unexpected success' : 'Failed as expected'), null);
      } catch (error) {
        addTestResult('Update Non-existent Folder Test', 'Error caught', error);
      }
      
      // Test 4: Delete non-existent folder
      try {
        addTestResult('Delete Non-existent Folder Test', 'Starting...');
        const result = await deleteFolder('non-existent-id', supabaseClient);
        addTestResult('Delete Non-existent Folder Test', 'Result: ' + (result ? 'Unexpected success' : 'Failed as expected'), null);
      } catch (error) {
        addTestResult('Delete Non-existent Folder Test', 'Error caught', error);
      }
      
      // Test 5: Network timeout simulation
      try {
        addTestResult('Network Timeout Test', 'Starting...');
        // This would test our timeout handling in request-manager
        // For now, we'll just log that we're testing this
        addTestResult('Network Timeout Test', 'Would test timeout handling', null);
      } catch (error) {
        addTestResult('Network Timeout Test', 'Error in timeout test', error);
      }
      
    } catch (error) {
      console.error('Error in error handling tests:', error);
      addTestResult('Overall Test', 'Fatal error in test suite', error);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Folder Error Handling Test</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <p className="text-sm text-gray-700">
          This page tests error handling for various folder operations.
        </p>
      </div>
      
      {/* Controls */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Test Controls</h2>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={runErrorHandlingTests}
            disabled={isTesting}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isTesting ? 'Running Tests...' : 'Run Error Handling Tests'}
          </button>
        </div>
      </div>
      
      {/* Configuration */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Configuration</h2>
        <div>
          <label className="block mb-2 font-medium">
            Space ID:
          </label>
          <input
            type="text"
            value={testSpaceId}
            onChange={(e) => setTestSpaceId(e.target.value)}
            className="border p-2 w-full rounded"
            placeholder="Enter space ID"
          />
        </div>
      </div>
      
      {/* Results */}
      <div className="p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Test Results ({testResults.length})</h2>
        
        {testResults.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <p>Run tests to see results.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {testResults.map((test, index) => (
              <div key={index} className="border p-3 rounded">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{test.testName}</h3>
                  <span className="text-sm text-gray-500">{test.timestamp}</span>
                </div>
                
                <div className="text-sm">
                  <p><strong>Result:</strong> {test.result}</p>
                  {test.error && (
                    <div className="mt-2 p-2 bg-red-50 rounded">
                      <p className="text-red-700"><strong>Error:</strong> {test.error.message || 'Unknown error'}</p>
                      {test.error.stack && (
                        <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap">
                          {test.error.stack}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}