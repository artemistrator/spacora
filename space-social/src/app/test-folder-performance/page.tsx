'use client';

import { useState } from 'react';
import { useSupabaseAuth } from '@/lib/auth';
import { getFoldersBySpaceId } from '@/lib/folder-utils';
import { requestManager } from '@/lib/request-manager';

export default function TestFolderPerformancePage() {
  const { getSupabaseWithSession } = useSupabaseAuth();
  const [testResults, setTestResults] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testSpaceId, setTestSpaceId] = useState('63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82');

  const runPerformanceTests = async () => {
    setIsTesting(true);
    setTestResults(null);
    
    try {
      const supabaseClient = await getSupabaseWithSession();
      
      // Test 1: Single folder request
      const startTime1 = Date.now();
      const folders1 = await getFoldersBySpaceId(testSpaceId, supabaseClient);
      const time1 = Date.now() - startTime1;
      
      // Test 2: Multiple sequential requests
      const startTime2 = Date.now();
      const results2 = [];
      for (let i = 0; i < 5; i++) {
        const folders = await getFoldersBySpaceId(testSpaceId, supabaseClient);
        results2.push(folders);
      }
      const time2 = Date.now() - startTime2;
      
      // Test 3: Multiple concurrent requests (without request manager)
      const startTime3 = Date.now();
      const promises3 = [];
      for (let i = 0; i < 5; i++) {
        promises3.push(getFoldersBySpaceId(testSpaceId, supabaseClient));
      }
      const results3 = await Promise.all(promises3);
      const time3 = Date.now() - startTime3;
      
      // Test 4: Multiple concurrent requests (with request manager)
      const startTime4 = Date.now();
      const promises4 = [];
      for (let i = 0; i < 5; i++) {
        promises4.push(requestManager.execute(() => getFoldersBySpaceId(testSpaceId, supabaseClient)));
      }
      const results4 = await Promise.all(promises4);
      const time4 = Date.now() - startTime4;
      
      // Test 5: Request manager status
      const requestManagerStatus = requestManager.getStatus();
      
      setTestResults({
        singleRequest: {
          time: time1,
          folderCount: folders1.length
        },
        sequentialRequests: {
          time: time2,
          requestCount: 5
        },
        concurrentRequests: {
          time: time3,
          requestCount: 5
        },
        managedRequests: {
          time: time4,
          requestCount: 5
        },
        requestManagerStatus
      });
    } catch (error) {
      console.error('Performance test error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Folder Performance Test</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <p className="text-sm text-gray-700">
          This page tests the performance of folder operations and request management.
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
              onClick={runPerformanceTests}
              disabled={isTesting}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full disabled:opacity-50"
            >
              {isTesting ? 'Running Tests...' : 'Run Performance Tests'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Results */}
      {testResults && (
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Performance Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded">
              <h3 className="font-medium mb-2">Single Request</h3>
              <p>Time: {testResults.singleRequest.time} ms</p>
              <p>Folders: {testResults.singleRequest.folderCount}</p>
            </div>
            
            <div className="p-3 bg-blue-50 rounded">
              <h3 className="font-medium mb-2">Sequential Requests (5)</h3>
              <p>Time: {testResults.sequentialRequests.time} ms</p>
              <p>Requests: {testResults.sequentialRequests.requestCount}</p>
            </div>
            
            <div className="p-3 bg-yellow-50 rounded">
              <h3 className="font-medium mb-2">Concurrent Requests (5)</h3>
              <p>Time: {testResults.concurrentRequests.time} ms</p>
              <p>Requests: {testResults.concurrentRequests.requestCount}</p>
            </div>
            
            <div className="p-3 bg-green-50 rounded">
              <h3 className="font-medium mb-2">Managed Requests (5)</h3>
              <p>Time: {testResults.managedRequests.time} ms</p>
              <p>Requests: {testResults.managedRequests.requestCount}</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-purple-50 rounded">
            <h3 className="font-medium mb-2">Request Manager Status</h3>
            <p>Current Requests: {testResults.requestManagerStatus.currentRequests}</p>
            <p>Queued Requests: {testResults.requestManagerStatus.queuedRequests}</p>
            <p>Max Concurrent Requests: {testResults.requestManagerStatus.maxConcurrentRequests}</p>
          </div>
        </div>
      )}
      
      {!testResults && !isTesting && (
        <div className="text-center py-8 text-gray-500">
          <p>Run performance tests to see results.</p>
        </div>
      )}
    </div>
  );
}