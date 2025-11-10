'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/lib/auth';
import { requestManager } from '@/lib/request-manager';

export default function TestPerformancePage() {
  const { getSupabaseWithSession } = useSupabaseAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const runPerformanceTest = async () => {
    setLoading(true);
    setTestResults([]);
    setStatus('Running performance test...');

    try {
      const supabaseClient = await getSupabaseWithSession();
      
      // Test 1: Measure time for sequential requests
      setStatus('Testing sequential requests...');
      const sequentialStart = performance.now();
      
      for (let i = 0; i < 5; i++) {
        await supabaseClient
          .from('spaces')
          .select('*')
          .limit(1);
      }
      
      const sequentialEnd = performance.now();
      const sequentialTime = sequentialEnd - sequentialStart;
      
      // Test 2: Measure time for concurrent requests (without manager)
      setStatus('Testing concurrent requests (without manager)...');
      const concurrentStart = performance.now();
      
      const concurrentPromises = [];
      for (let i = 0; i < 5; i++) {
        concurrentPromises.push(
          supabaseClient
            .from('spaces')
            .select('*')
            .limit(1)
        );
      }
      
      await Promise.all(concurrentPromises);
      const concurrentEnd = performance.now();
      const concurrentTime = concurrentEnd - concurrentStart;
      
      // Test 3: Measure time for managed requests
      setStatus('Testing managed requests...');
      const managedStart = performance.now();
      
      const managedPromises = [];
      for (let i = 0; i < 5; i++) {
        managedPromises.push(
          requestManager.execute(async () => {
            return await supabaseClient
              .from('spaces')
              .select('*')
              .limit(1);
          })
        );
      }
      
      await Promise.all(managedPromises);
      const managedEnd = performance.now();
      const managedTime = managedEnd - managedStart;
      
      setTestResults([
        {
          test: 'Sequential Requests',
          time: sequentialTime,
          description: '5 requests executed one after another'
        },
        {
          test: 'Concurrent Requests',
          time: concurrentTime,
          description: '5 requests executed simultaneously'
        },
        {
          test: 'Managed Requests',
          time: managedTime,
          description: '5 requests executed with request manager'
        }
      ]);
      
      setStatus('Performance test completed');
    } catch (error) {
      setStatus(`Error running performance test: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = () => {
    return requestManager.getStatus();
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Performance Test</h1>
      
      <div className="mb-4">
        <button 
          onClick={runPerformanceTest}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
        >
          Run Performance Test
        </button>
        
        <button 
          onClick={() => setStatus(JSON.stringify(getStatus(), null, 2))}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Get Manager Status
        </button>
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Status:</h2>
        <pre className="bg-gray-100 p-2 rounded">{status}</pre>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold">Test Results:</h2>
        {testResults.map((result, index) => (
          <div key={index} className="border p-3 rounded mb-2">
            <h3 className="font-bold">{result.test}</h3>
            <p>Time: {result.time.toFixed(2)} ms</p>
            <p className="text-sm text-gray-600">{result.description}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold">Explanation:</h2>
        <p className="mt-2">
          This test compares three approaches to handling multiple requests:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><strong>Sequential Requests</strong>: Each request waits for the previous one to complete</li>
          <li><strong>Concurrent Requests</strong>: All requests are sent at the same time (may cause browser overload)</li>
          <li><strong>Managed Requests</strong>: Requests are sent with a concurrency limit to prevent browser overload</li>
        </ul>
      </div>
    </div>
  );
}