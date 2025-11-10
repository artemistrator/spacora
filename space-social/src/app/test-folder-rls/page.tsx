'use client';

import { useState } from 'react';
import { useSupabaseAuth } from '@/lib/auth';

export default function TestFolderRLSPage() {
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

  const runRLSTests = async () => {
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
      
      // Test 2: Check space ownership
      try {
        addTestResult('Space Ownership Check', 'Running', 'Checking if user owns the space');
        const { data: spaceData, error: spaceError } = await supabaseClient
          .from('spaces')
          .select('id, owner_id')
          .eq('id', testSpaceId)
          .maybeSingle();
        
        console.log('Space data:', { spaceData, spaceError });
        
        if (spaceError) {
          addTestResult('Space Ownership Check', 'Failed', `Error: ${spaceError.message}`);
        } else if (!spaceData) {
          addTestResult('Space Ownership Check', 'Failed', 'Space not found');
        } else {
          addTestResult('Space Ownership Check', 'Passed', `Space owner: ${spaceData.owner_id}`);
          if (spaceData.owner_id === userId) {
            addTestResult('Ownership Verification', 'Passed', 'User is the owner of this space');
          } else {
            addTestResult('Ownership Verification', 'Warning', 'User is NOT the owner of this space');
          }
        }
      } catch (error) {
        addTestResult('Space Ownership Check', 'Failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Test 3: Try to insert folder with detailed error handling
      try {
        addTestResult('Folder Insert Test', 'Running', 'Attempting to insert folder with detailed error handling');
        const testFolderName = `RLS Test ${Date.now()}`;
        
        console.log('Attempting to insert folder with data:', {
          name: testFolderName,
          space_id: testSpaceId
        });
        
        const { data, error } = await supabaseClient
          .from('folders')
          .insert({
            name: testFolderName,
            space_id: testSpaceId
          })
          .select()
          .maybeSingle();
        
        console.log('Folder insert result:', { data, error });
        
        if (error) {
          addTestResult('Folder Insert Test', 'Failed', `Error: ${error.message}`);
          if (error.details) {
            addTestResult('Error Details', 'Info', `Details: ${error.details}`);
          }
          if (error.hint) {
            addTestResult('Error Hint', 'Info', `Hint: ${error.hint}`);
          }
        } else if (data) {
          addTestResult('Folder Insert Test', 'Passed', `Created folder: ${data.name} (${data.id})`);
          
          // Clean up
          const { error: deleteError } = await supabaseClient
            .from('folders')
            .delete()
            .eq('id', data.id);
          
          if (deleteError) {
            addTestResult('Cleanup', 'Failed', `Error deleting test folder: ${deleteError.message}`);
          } else {
            addTestResult('Cleanup', 'Passed', 'Test folder deleted');
          }
        } else {
          addTestResult('Folder Insert Test', 'Failed', 'No data returned, no error');
        }
      } catch (error) {
        addTestResult('Folder Insert Test', 'Failed', `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Test 4: Check folder policies
      try {
        addTestResult('Folder Policy Check', 'Running', 'Checking folder RLS policies');
        
        // Try to read folders without space_id (should fail)
        const { data: allFolders, error: allFoldersError } = await supabaseClient
          .from('folders')
          .select('id, name')
          .limit(1);
        
        if (allFoldersError) {
          addTestResult('Folder Policy Check', 'Info', `Blocked reading all folders: ${allFoldersError.message}`);
        } else {
          addTestResult('Folder Policy Check', 'Warning', `Allowed reading all folders: ${allFolders.length} folders returned`);
        }
        
        // Try to read folders with space_id (should work if user has access)
        const { data: spaceFolders, error: spaceFoldersError } = await supabaseClient
          .from('folders')
          .select('id, name')
          .eq('space_id', testSpaceId)
          .limit(1);
        
        if (spaceFoldersError) {
          addTestResult('Space Folder Access', 'Failed', `Error reading space folders: ${spaceFoldersError.message}`);
        } else {
          addTestResult('Space Folder Access', 'Passed', `Can read space folders: ${spaceFolders?.length || 0} folders returned`);
        }
      } catch (error) {
        addTestResult('Folder Policy Check', 'Failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      addTestResult('RLS Tests', 'Completed', 'All tests finished');
    } catch (error) {
      console.error('RLS test error:', error);
      addTestResult('RLS Tests', 'Fatal Error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Folder RLS Policy Tests</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Row Level Security Verification</h2>
        <p className="text-sm text-gray-700">
          This page tests the Row Level Security policies for folder operations.
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
              onClick={runRLSTests}
              disabled={isTesting || !userId}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full disabled:opacity-50"
            >
              {isTesting ? 'Running Tests...' : 'Run RLS Tests'}
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
            <p>Run RLS tests to see results.</p>
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