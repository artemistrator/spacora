'use client';

import { useState } from 'react';
import { useSupabaseAuth } from '@/lib/auth';

export default function TestFolderDetailedPage() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testSpaceId, setTestSpaceId] = useState('63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82');

  const addTestResult = (testName: string, status: string, details: string = '') => {
    setTestResults(prev => [...prev, {
      testName,
      status,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runDetailedTests = async () => {
    setIsTesting(true);
    setTestResults([]);
    
    try {
      const supabaseClient = await getSupabaseWithSession();
      
      // Test 1: Check authentication status
      addTestResult('Auth Status Check', 'Running', 'Checking current authentication status');
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
          addTestResult('Auth Status Check', 'Passed', `Authenticated as user: ${session.user.id}`);
        } else {
          addTestResult('Auth Status Check', 'Warning', 'Not authenticated with Supabase');
        }
      } catch (error) {
        addTestResult('Auth Status Check', 'Failed', `Error checking auth: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Test 2: Check space ownership
      try {
        addTestResult('Space Ownership Verification', 'Running', 'Verifying space ownership');
        const { data: spaceData, error: spaceError } = await supabaseClient
          .from('spaces')
          .select('id, owner_id, name')
          .eq('id', testSpaceId)
          .maybeSingle();
        
        if (spaceError) {
          addTestResult('Space Ownership Verification', 'Failed', `Space query error: ${spaceError.message}`);
        } else if (!spaceData) {
          addTestResult('Space Ownership Verification', 'Failed', 'Space not found');
        } else {
          addTestResult('Space Ownership Verification', 'Passed', `Space: ${spaceData.name} (${spaceData.id})`);
          addTestResult('Ownership Check', 'Info', `Owner: ${spaceData.owner_id}, Current User: ${userId}`);
          
          if (spaceData.owner_id === userId) {
            addTestResult('Ownership Validation', 'Passed', 'User is the owner of this space');
          } else {
            addTestResult('Ownership Validation', 'Warning', 'User is NOT the owner of this space');
          }
        }
      } catch (error) {
        addTestResult('Space Ownership Verification', 'Failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Test 3: Test folder creation with explicit error handling
      try {
        addTestResult('Folder Creation Test', 'Running', 'Testing folder creation with detailed error handling');
        
        // First, let's see what happens when we try to insert
        const testFolderName = `Detailed Test ${Date.now()}`;
        const folderData = {
          name: testFolderName,
          space_id: testSpaceId
        };
        
        addTestResult('Folder Data Preparation', 'Info', `Preparing to create folder with data: ${JSON.stringify(folderData)}`);
        
        // Try the insert operation
        const { data, error } = await supabaseClient
          .from('folders')
          .insert(folderData)
          .select()
          .maybeSingle();
        
        addTestResult('Raw Insert Result', 'Info', `Raw result - Data: ${JSON.stringify(data)}, Error: ${error ? error.message : 'None'}`);
        
        if (error) {
          addTestResult('Folder Creation Test', 'Failed', `Insert failed: ${error.message}`);
          
          // Check for specific error types
          if (error.message.includes('permission')) {
            addTestResult('Permission Analysis', 'Failed', 'Permission denied - RLS policy blocking operation');
          }
          if (error.message.includes('constraint')) {
            addTestResult('Constraint Analysis', 'Failed', 'Constraint violation - check data validity');
          }
          if (error.details) {
            addTestResult('Error Details', 'Info', `Details: ${error.details}`);
          }
          if (error.hint) {
            addTestResult('Error Hint', 'Info', `Hint: ${error.hint}`);
          }
        } else if (data) {
          addTestResult('Folder Creation Test', 'Passed', `Successfully created folder: ${data.name} (${data.id})`);
          
          // Clean up the test folder
          try {
            const { error: deleteError } = await supabaseClient
              .from('folders')
              .delete()
              .eq('id', data.id);
            
            if (deleteError) {
              addTestResult('Cleanup', 'Failed', `Failed to delete test folder: ${deleteError.message}`);
            } else {
              addTestResult('Cleanup', 'Passed', 'Test folder cleaned up successfully');
            }
          } catch (cleanupError) {
            addTestResult('Cleanup', 'Failed', `Exception during cleanup: ${cleanupError instanceof Error ? cleanupError.message : 'Unknown error'}`);
          }
        } else {
          addTestResult('Folder Creation Test', 'Warning', 'No error but no data returned - check policies');
        }
      } catch (error) {
        addTestResult('Folder Creation Test', 'Failed', `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Test 4: Test folder reading to confirm read access works
      try {
        addTestResult('Folder Read Test', 'Running', 'Testing folder reading for space');
        const { data: folders, error: readError } = await supabaseClient
          .from('folders')
          .select('id, name, space_id')
          .eq('space_id', testSpaceId)
          .limit(3);
        
        if (readError) {
          addTestResult('Folder Read Test', 'Failed', `Read failed: ${readError.message}`);
        } else {
          addTestResult('Folder Read Test', 'Passed', `Successfully read ${folders?.length || 0} folders`);
          if (folders && folders.length > 0) {
            addTestResult('Sample Data', 'Info', `First folder: ${folders[0].name} (${folders[0].id})`);
          }
        }
      } catch (error) {
        addTestResult('Folder Read Test', 'Failed', `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      addTestResult('Detailed Tests', 'Completed', 'All detailed tests finished');
    } catch (error) {
      console.error('Detailed test error:', error);
      addTestResult('Detailed Tests', 'Fatal Error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Detailed Folder Tests</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Comprehensive Folder Operation Analysis</h2>
        <p className="text-sm text-gray-700">
          This page provides detailed testing and analysis of folder operations including authentication, permissions, and data handling.
        </p>
      </div>
      
      {/* Configuration */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          
          <div className="flex items-end">
            <button 
              onClick={runDetailedTests}
              disabled={isTesting || !userId}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full disabled:opacity-50"
            >
              {isTesting ? 'Running Tests...' : 'Run Detailed Tests'}
            </button>
          </div>
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
            <p>Run detailed tests to see results.</p>
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