'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/lib/auth';
import { createFolder, deleteFolder } from '@/lib/folder-utils';

export default function TestAuthDebugPage() {
  const { getSupabaseWithSession, session, userId, isAuthenticating, authError, checkSupabaseAuth } = useSupabaseAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
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

  const runAuthDebugTest = async () => {
    setTestResults([]);
    setDebugInfo({});
    
    try {
      // Step 1: Check Clerk session
      addTestResult('Clerk Session Check', 'Running', 'Checking if Clerk session exists');
      console.log('Clerk session:', session);
      console.log('User ID:', userId);
      
      if (!session) {
        addTestResult('Clerk Session Check', 'Failed', 'No Clerk session found');
        return;
      }
      
      if (!userId) {
        addTestResult('Clerk Session Check', 'Failed', 'No user ID found in session');
        return;
      }
      
      addTestResult('Clerk Session Check', 'Passed', `Session exists for user: ${userId}`);
      setDebugInfo((prev: any) => ({ ...prev, clerkUserId: userId }));
      
      // Step 2: Try to get Clerk token directly
      addTestResult('Clerk Token Test', 'Running', 'Attempting to get Clerk JWT token');
      try {
        const token = await session.getToken({ template: 'supabase' });
        console.log('Clerk token:', token);
        addTestResult('Clerk Token Test', token ? 'Passed' : 'Failed', 
          token ? `Token received, length: ${token.length}` : 'No token received');
        setDebugInfo((prev: any) => ({ ...prev, clerkToken: token ? 'Exists' : 'None' }));
      } catch (tokenError: any) {
        console.error('Clerk token error:', tokenError);
        addTestResult('Clerk Token Test', 'Error', `Token error: ${tokenError.message || 'Unknown error'}`);
      }
      
      // Step 3: Get authenticated Supabase client
      addTestResult('Supabase Auth', 'Running', 'Getting authenticated Supabase client');
      const supabaseClient = await getSupabaseWithSession();
      addTestResult('Supabase Auth', 'Passed', 'Got Supabase client');
      
      // Step 4: Check Supabase auth status with detailed info
      addTestResult('Supabase Session Check', 'Running', 'Checking Supabase session');
      const isSupabaseAuthed = await checkSupabaseAuth();
      addTestResult('Supabase Session Check', 'Passed', `Supabase auth status: ${isSupabaseAuthed}`);
      setDebugInfo((prev: any) => ({ ...prev, supabaseAuthed: isSupabaseAuthed }));
      
      // Additional debug: Check the session directly
      try {
        const { data: { session: supabaseSession } } = await supabaseClient.auth.getSession();
        console.log('Direct session check:', supabaseSession);
        setDebugInfo((prev: any) => ({ ...prev, directSessionCheck: !!supabaseSession }));
        if (supabaseSession) {
          setDebugInfo((prev: any) => ({ 
            ...prev, 
            supabaseUserId: supabaseSession.user?.id,
            supabaseUserEmail: supabaseSession.user?.email
          }));
          addTestResult('Session Details', 'Info', 
            `User ID: ${supabaseSession.user?.id}, Email: ${supabaseSession.user?.email}`);
        }
        addTestResult('Direct Session Check', 'Info', `Direct session check: ${!!supabaseSession}`);
      } catch (error: any) {
        console.error('Direct session check failed:', error);
        addTestResult('Direct Session Check', 'Error', `Direct session check failed: ${error.message || 'Unknown error'}`);
      }
      
      // Step 5: Test folder creation with new approach
      addTestResult('Folder Creation Test', 'Running', 'Attempting to create folder with new approach');
      const testFolderName = `Auth Debug Test ${Date.now()}`;
      
      console.log('Creating folder with data:', {
        name: testFolderName,
        space_id: testSpaceId
      });
      
      // Log the space ownership before creating folder
      try {
        const { data: spaceData, error: spaceError } = await supabaseClient
          .from('spaces')
          .select('id, name, owner_id')
          .eq('id', testSpaceId)
          .single();
        
        console.log('Space data:', spaceData);
        console.log('Space error:', spaceError);
        
        if (spaceData) {
          addTestResult('Space Ownership Check', 'Info', `Space owned by: ${spaceData.owner_id}`);
          const isOwner = spaceData.owner_id === userId;
          addTestResult('Ownership Verification', isOwner ? 'Passed' : 'Failed', 
            isOwner ? 'User is space owner' : 'User is NOT space owner');
        }
      } catch (error: any) {
        console.error('Space ownership check failed:', error);
        addTestResult('Space Ownership Check', 'Error', `Failed: ${error.message || 'Unknown error'}`);
      }
      
      // Try folder creation with new approach
      try {
        addTestResult('New Folder Create Test', 'Running', 'Attempting folder creation with user ID');
        const newFolder = await createFolder({
          name: testFolderName,
          space_id: testSpaceId
        }, userId, supabaseClient);
        
        console.log('Folder creation result:', newFolder);
        
        if (newFolder) {
          addTestResult('New Folder Create Test', 'Passed', `Created folder: ${newFolder.name} (${newFolder.id})`);
          
          // Clean up
          const deleteResult = await deleteFolder(newFolder.id, userId, supabaseClient);
          if (deleteResult) {
            addTestResult('Cleanup', 'Passed', 'Test folder deleted');
          } else {
            addTestResult('Cleanup', 'Warning', 'Failed to delete test folder');
          }
        } else {
          addTestResult('New Folder Create Test', 'Failed', 'Folder creation returned null');
          
          // Try to get more error details
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
              addTestResult('Detailed Error Info', 'Error', `Insert error: ${error.message || 'Unknown error'}`);
              if (error.details) {
                addTestResult('Error Details', 'Error', `Details: ${error.details}`);
              }
              if (error.hint) {
                addTestResult('Error Hint', 'Error', `Hint: ${error.hint}`);
              }
            }
          } catch (insertError: any) {
            console.error('Direct insert failed:', insertError);
            addTestResult('Direct Insert Test', 'Error', `Direct insert failed: ${insertError.message || 'Unknown error'}`);
          }
        }
      } catch (folderError: any) {
        console.error('Folder creation failed:', folderError);
        addTestResult('New Folder Create Test', 'Error', `Folder creation failed: ${folderError.message || 'Unknown error'}`);
      }
      
      addTestResult('Debug Test', 'Completed', 'All tests finished');
    } catch (error: any) {
      console.error('Debug test error:', error);
      addTestResult('Debug Test', 'Error', `Error: ${error.message || error}`);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug Test</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Debug Authentication Flow</h2>
        <p className="text-sm text-gray-700">
          This page tests the complete authentication flow for folder operations.
        </p>
      </div>
      
      {/* Debug Info */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-semibold mb-3">Debug Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Clerk Session:</strong> {session ? 'Exists' : 'None'}</p>
            <p><strong>User ID:</strong> {userId || 'None'}</p>
            <p><strong>Authenticating:</strong> {isAuthenticating ? 'Yes' : 'No'}</p>
            <p><strong>Auth Error:</strong> {authError || 'None'}</p>
          </div>
          <div>
            {Object.keys(debugInfo).map(key => (
              <p key={key}><strong>{key}:</strong> {String(debugInfo[key])}</p>
            ))}
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Test Controls</h2>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={runAuthDebugTest}
            disabled={isAuthenticating}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isAuthenticating ? 'Testing...' : 'Run Auth Debug Test'}
          </button>
          
          <button 
            onClick={() => {
              setTestResults([]);
              setDebugInfo({});
            }}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Clear Results
          </button>
        </div>
      </div>
      
      {/* Results */}
      <div className="p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Test Results ({testResults.length})</h2>
        
        {testResults.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <p>Run debug test to see results.</p>
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