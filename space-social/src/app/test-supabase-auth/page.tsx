'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestSupabaseAuthPage() {
  const [authStatus, setAuthStatus] = useState<string>('');
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  const addTestResult = (testName: string, status: string, details: string = '') => {
    setTestResults(prev => [...prev, {
      testName,
      status,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const checkCurrentSession = async () => {
    try {
      setAuthStatus('Checking session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        setAuthStatus(`Error: ${error.message}`);
        return;
      }
      
      setAuthStatus(session ? 'Authenticated' : 'Not authenticated');
      setSessionInfo(session);
      
      if (session) {
        addTestResult('Session Check', 'Passed', `User ID: ${session.user?.id}`);
        addTestResult('Email Check', 'Info', `Email: ${session.user?.email || 'No email'}`);
      } else {
        addTestResult('Session Check', 'Failed', 'No active session');
      }
    } catch (error: any) {
      setAuthStatus(`Error: ${error.message}`);
      addTestResult('Session Check', 'Error', `Error: ${error.message}`);
    }
  };

  const testFolderInsert = async () => {
    try {
      addTestResult('Folder Insert Test', 'Running', 'Attempting to insert folder');
      
      const { data, error } = await supabase
        .from('folders')
        .insert({
          name: `Test Folder ${Date.now()}`,
          space_id: '63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82'
        })
        .select()
        .maybeSingle();
      
      if (error) {
        addTestResult('Folder Insert Test', 'Failed', `Error: ${error.message}`);
        if (error.details) {
          addTestResult('Error Details', 'Error', `Details: ${error.details}`);
        }
      } else {
        addTestResult('Folder Insert Test', 'Passed', `Created folder: ${data?.name}`);
        
        // Clean up
        if (data?.id) {
          await supabase
            .from('folders')
            .delete()
            .eq('id', data.id);
          addTestResult('Cleanup', 'Passed', 'Test folder deleted');
        }
      }
    } catch (error: any) {
      addTestResult('Folder Insert Test', 'Error', `Error: ${error.message}`);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supabase Auth Test</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Test Supabase Authentication</h2>
        <p className="text-sm text-gray-700">
          This page tests Supabase authentication and folder creation directly.
        </p>
      </div>
      
      {/* Auth Status */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-semibold mb-3">Authentication Status</h2>
        <div className="mb-3">
          <p><strong>Status:</strong> {authStatus}</p>
        </div>
        
        {sessionInfo && (
          <div className="text-sm">
            <p><strong>User ID:</strong> {sessionInfo.user?.id}</p>
            <p><strong>Email:</strong> {sessionInfo.user?.email || 'No email'}</p>
            <p><strong>Provider:</strong> {sessionInfo.user?.app_metadata?.provider || 'Unknown'}</p>
          </div>
        )}
        
        <button 
          onClick={checkCurrentSession}
          className="mt-3 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Check Session
        </button>
      </div>
      
      {/* Test Controls */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Test Controls</h2>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={testFolderInsert}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Test Folder Insert
          </button>
          
          <button 
            onClick={() => setTestResults([])}
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
            <p>Run tests to see results.</p>
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