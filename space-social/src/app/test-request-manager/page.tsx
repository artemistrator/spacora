'use client';

import { useState, useEffect } from 'react';
import { requestManager, executeSupabaseQuery } from '@/lib/request-manager';
import { supabase } from '@/lib/supabase';

export default function TestRequestManagerPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [status, setStatus] = useState('');

  const runTest = async () => {
    setTestResults([]);
    setStatus('Running tests...');

    try {
      // Test 1: Run multiple concurrent requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          executeSupabaseQuery(async () => {
            const { data, error } = await supabase
              .from('spaces')
              .select('*')
              .limit(1);
            
            if (error) throw error;
            return data;
          }, 5000)
            .then(result => ({
              test: `Request ${i + 1}`,
              status: 'success',
              data: result,
              timestamp: new Date().toISOString()
            }))
            .catch(error => ({
              test: `Request ${i + 1}`,
              status: 'error',
              error: error.message,
              timestamp: new Date().toISOString()
            }))
        );
      }

      const results = await Promise.all(promises);
      setTestResults(results);
      setStatus('Tests completed');
    } catch (error) {
      setStatus(`Error running tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatus = () => {
    return requestManager.getStatus();
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Request Manager Test</h1>
      
      <div className="mb-4">
        <button 
          onClick={runTest}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
        >
          Run Test
        </button>
        
        <button 
          onClick={() => setStatus(JSON.stringify(getStatus(), null, 2))}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Get Status
        </button>
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Status:</h2>
        <pre className="bg-gray-100 p-2 rounded">{status}</pre>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold">Test Results:</h2>
        {testResults.map((result, index) => (
          <div 
            key={index} 
            className={`p-2 mb-2 rounded ${
              result.status === 'success' 
                ? 'bg-green-100 border border-green-300' 
                : 'bg-red-100 border border-red-300'
            }`}
          >
            <h3 className="font-bold">{result.test}</h3>
            <p>Status: {result.status}</p>
            {result.error && <p className="text-red-700">Error: {result.error}</p>}
            {result.data && <p>Data length: {result.data.length}</p>}
            <p className="text-sm text-gray-500">{result.timestamp}</p>
          </div>
        ))}
      </div>
    </div>
  );
}