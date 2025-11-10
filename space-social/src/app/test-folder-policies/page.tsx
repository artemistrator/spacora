'use client';

import { useState } from 'react';
import { useSupabaseAuth } from '@/lib/auth';

export default function TestFolderPoliciesPage() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addTestResult = (testName: string, result: string, details: string = '') => {
    setTestResults(prev => [...prev, {
      testName,
      result,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runPolicyTests = async () => {
    setIsTesting(true);
    setTestResults([]);
    
    try {
      const supabaseClient = await getSupabaseWithSession();
      
      // Test 1: Check user authentication
      addTestResult('Authentication Check', 'Running', 'Checking if user is authenticated');
      if (!userId) {
        addTestResult('Authentication Check', 'Failed', 'User is not authenticated');
        return;
      }
      addTestResult('Authentication Check', 'Passed', `User ID: ${userId}`);
      
      // Test 2: Try to read folders without space_id (should fail)
      try {
        addTestResult('Read All Folders', 'Running', 'Attempting to read all folders (should fail)');
        const { data, error } = await supabaseClient
          .from('folders')
          .select('*');
        
        if (error) {
          addTestResult('Read All Folders', 'Expected Failure', `Correctly blocked: ${error.message}`);
        } else {
          addTestResult('Read All Folders', 'Warning', `Unexpected success: ${data?.length || 0} folders returned`);
        }
      } catch (error) {
        addTestResult('Read All Folders', 'Expected Failure', `Correctly blocked: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Test 3: Try to read folders with specific space_id
      try {
        addTestResult('Read Folders with Space ID', 'Running', 'Attempting to read folders for specific space');
        const testSpaceId = '63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82';
        const { data, error } = await supabaseClient
          .from('folders')
          .select('*')
          .eq('space_id', testSpaceId);
        
        if (error) {
          addTestResult('Read Folders with Space ID', 'Failed', `Error: ${error.message}`);
        } else {
          addTestResult('Read Folders with Space ID', 'Passed', `Success: ${data?.length || 0} folders returned`);
        }
      } catch (error) {
        addTestResult('Read Folders with Space ID', 'Failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Test 4: Try to insert folder without space_id
      try {
        addTestResult('Insert Folder without Space ID', 'Running', 'Attempting to insert folder without space_id (should fail)');
        const { data, error } = await supabaseClient
          .from('folders')
          .insert({
            name: 'Test Folder Policy',
            description: 'Test folder for policy checking'
          })
          .select();
        
        if (error) {
          addTestResult('Insert Folder without Space ID', 'Expected Failure', `Correctly blocked: ${error.message}`);
        } else {
          addTestResult('Insert Folder without Space ID', 'Warning', `Unexpected success: folder created with ID ${data?.[0]?.id}`);
          // Clean up if successful
          if (data?.[0]?.id) {
            await supabaseClient
              .from('folders')
              .delete()
              .eq('id', data[0].id);
          }
        }
      } catch (error) {
        addTestResult('Insert Folder without Space ID', 'Expected Failure', `Correctly blocked: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Test 5: Try to insert folder with space_id
      try {
        addTestResult('Insert Folder with Space ID', 'Running', 'Attempting to insert folder with space_id');
        const testSpaceId = '63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82';
        const { data, error } = await supabaseClient
          .from('folders')
          .insert({
            name: 'Test Folder Policy',
            description: 'Test folder for policy checking',
            space_id: testSpaceId
          })
          .select();
        
        if (error) {
          addTestResult('Insert Folder with Space ID', 'Failed', `Error: ${error.message}`);
        } else {
          addTestResult('Insert Folder with Space ID', 'Passed', `Success: folder created with ID ${data?.[0]?.id}`);
          // Clean up
          if (data?.[0]?.id) {
            await supabaseClient
              .from('folders')
              .delete()
              .eq('id', data[0].id);
            addTestResult('Cleanup', 'Passed', 'Test folder deleted');
          }
        }
      } catch (error) {
        addTestResult('Insert Folder with Space ID', 'Failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      addTestResult('Policy Tests', 'Completed', 'All tests finished');
    } catch (error) {
      console.error('Policy test error:', error);
      addTestResult('Policy Tests', 'Fatal Error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Folder Policy Tests</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">RLS Policy Verification</h2>
        <p className="text-sm text-gray-700">
          This page tests the Row Level Security policies for the folders table.
        </p>
      </div>
      
      {/* Controls */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Test Controls</h2>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={runPolicyTests}
            disabled={isTesting || !userId}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isTesting ? 'Running Tests...' : 'Run Policy Tests'}
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
            <p>Run policy tests to see results.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {testResults.map((test, index) => (
              <div key={index} className={`border p-3 rounded ${
                test.result === 'Passed' ? 'border-green-200 bg-green-50' :
                test.result === 'Failed' ? 'border-red-200 bg-red-50' :
                test.result === 'Expected Failure' ? 'border-yellow-200 bg-yellow-50' :
                test.result === 'Warning' ? 'border-orange-200 bg-orange-50' :
                test.result === 'Running' ? 'border-gray-200 bg-gray-50' :
                'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{test.testName}</h3>
                  <span className={`text-sm font-medium px-2 py-1 rounded ${
                    test.result === 'Passed' ? 'bg-green-100 text-green-800' :
                    test.result === 'Failed' ? 'bg-red-100 text-red-800' :
                    test.result === 'Expected Failure' ? 'bg-yellow-100 text-yellow-800' :
                    test.result === 'Warning' ? 'bg-orange-100 text-orange-800' :
                    test.result === 'Running' ? 'bg-gray-100 text-gray-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {test.result}
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