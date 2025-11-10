'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/lib/auth';
import { requestManager } from '@/lib/request-manager';

export default function TestRequestLimitingPage() {
  const { getSupabaseWithSession } = useSupabaseAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  // Function to simulate a Supabase request
  const simulateSupabaseRequest = async (requestId: number) => {
    const supabaseClient = await getSupabaseWithSession();
    
    // Simulate a database query with request manager
    const result = await requestManager.execute(async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      
      // Simple query to test
      const { data, error } = await supabaseClient
        .from('spaces')
        .select('id, name')
        .limit(1);
      
      if (error) throw error;
      return { requestId, data, timestamp: new Date().toISOString() };
    });
    
    return result;
  };

  const runPerformanceTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    setStatus('Running performance test...');
    
    try {
      // Test sequential requests
      setStatus('Testing sequential requests...');
      const sequentialStart = Date.now();
      const sequentialResults = [];
      
      for (let i = 1; i <= 5; i++) {
        const result = await simulateSupabaseRequest(i);
        sequentialResults.push(result);
        setTestResults(prev => [...prev, { type: 'sequential', ...result }]);
      }
      
      const sequentialTime = Date.now() - sequentialStart;
      
      // Test concurrent requests
      setStatus('Testing concurrent requests...');
      const concurrentStart = Date.now();
      
      const concurrentPromises = [];
      for (let i = 6; i <= 10; i++) {
        concurrentPromises.push(simulateSupabaseRequest(i));
      }
      
      const concurrentResults = await Promise.all(concurrentPromises);
      concurrentResults.forEach(result => {
        setTestResults(prev => [...prev, { type: 'concurrent', ...result }]);
      });
      
      const concurrentTime = Date.now() - concurrentStart;
      
      // Test managed requests (with our request manager)
      setStatus('Testing managed requests...');
      const managedStart = Date.now();
      
      const managedPromises = [];
      for (let i = 11; i <= 15; i++) {
        managedPromises.push(simulateSupabaseRequest(i));
      }
      
      const managedResults = await Promise.all(managedPromises);
      managedResults.forEach(result => {
        setTestResults(prev => [...prev, { type: 'managed', ...result }]);
      });
      
      const managedTime = Date.now() - managedStart;
      
      setStatus(`Performance test completed\n
Sequential Requests Time: ${sequentialTime.toFixed(2)} ms
Concurrent Requests Time: ${concurrentTime.toFixed(2)} ms
Managed Requests Time: ${managedTime.toFixed(2)} ms`);
    } catch (error) {
      console.error('Error in performance test:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const checkRequestManagerStatus = () => {
    const status = requestManager.getStatus();
    setStatus(`Request Manager Status: 
Current Requests: ${status.currentRequests}
Queued Requests: ${status.queuedRequests}
Max Concurrent Requests: ${status.maxConcurrentRequests}`);
  };

  useEffect(() => {
    checkRequestManagerStatus();
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Request Limiting Test</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <p className="text-sm text-gray-700">
          This page tests the request limiting functionality to prevent browser overload.
        </p>
      </div>
      
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Test Controls</h2>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={runPerformanceTest}
            disabled={isRunning}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isRunning ? 'Running Test...' : 'Run Performance Test'}
          </button>
          
          <button 
            onClick={checkRequestManagerStatus}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Check Request Manager Status
          </button>
        </div>
      </div>
      
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Status</h2>
        <pre className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap">{status}</pre>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-3">Test Results ({testResults.length})</h2>
        {testResults.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No test results yet. Run the performance test to see results.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className="border p-3 rounded">
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${
                    result.type === 'sequential' ? 'text-blue-600' : 
                    result.type === 'concurrent' ? 'text-green-600' : 
                    'text-purple-600'
                  }`}>
                    {result.type.toUpperCase()} Request #{result.requestId}
                  </span>
                  <span className="text-sm text-gray-500">{result.timestamp}</span>
                </div>
                <div className="mt-2 text-sm">
                  <p>Data length: {result.data?.length || 0}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}