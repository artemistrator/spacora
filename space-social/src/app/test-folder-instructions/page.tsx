'use client';

import Link from 'next/link';

export default function TestFolderInstructionsPage() {
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Folder Testing Instructions</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Overview</h2>
        <p className="text-sm text-gray-700">
          This page provides instructions for testing the folder functionality integration.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Prerequisites */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Prerequisites</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Ensure you are logged into the application</li>
            <li>Have access to a test space (default provided: 63d8fbaa-0e7a-4d1e-bd00-db45c5aadd82)</li>
            <li>Browser console open for debugging (F12 → Console)</li>
            <li>Network tab open to monitor requests (F12 → Network)</li>
          </ul>
        </div>
        
        {/* Test Sequence */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Recommended Test Sequence</h2>
          <ol className="list-decimal pl-5 space-y-3">
            <li>
              <strong>Basic Folder Operations</strong>
              <p className="text-sm text-gray-600 mt-1">
                Navigate to <Link href="/test-space-folders" className="text-blue-600 hover:underline">Test Space Folders</Link> to verify basic folder creation, update, and deletion.
              </p>
            </li>
            <li>
              <strong>Component Integration</strong>
              <p className="text-sm text-gray-600 mt-1">
                Test <Link href="/test-folder-list" className="text-blue-600 hover:underline">Folder List</Link> and <Link href="/test-post-form-with-folders" className="text-blue-600 hover:underline">Post Form with Folders</Link> components.
              </p>
            </li>
            <li>
              <strong>Complete Workflow</strong>
              <p className="text-sm text-gray-600 mt-1">
                Use <Link href="/test-complete-folder-workflow" className="text-blue-600 hover:underline">Complete Folder Workflow</Link> to test end-to-end functionality.
              </p>
            </li>
            <li>
              <strong>Performance Testing</strong>
              <p className="text-sm text-gray-600 mt-1">
                Run <Link href="/test-folder-performance" className="text-blue-600 hover:underline">Folder Performance</Link> and <Link href="/test-request-limiting" className="text-blue-600 hover:underline">Request Limiting</Link> tests.
              </p>
            </li>
            <li>
              <strong>Error Handling</strong>
              <p className="text-sm text-gray-600 mt-1">
                Verify error handling with <Link href="/test-folder-error-handling" className="text-blue-600 hover:underline">Folder Error Handling</Link> test.
              </p>
            </li>
            <li>
              <strong>Final Verification</strong>
              <p className="text-sm text-gray-600 mt-1">
                Run the comprehensive <Link href="/test-folder-final-verification" className="text-blue-600 hover:underline">Final Verification</Link> test.
              </p>
            </li>
          </ol>
        </div>
        
        {/* What to Look For */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-3">What to Look For During Testing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 rounded">
              <h3 className="font-medium text-green-800 mb-2">Expected Success Indicators</h3>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>No console errors</li>
                <li>Folders created/updated/deleted successfully</li>
                <li>Posts properly associated with folders</li>
                <li>Fast response times (&lt;3 seconds)</li>
                <li>No timeout errors</li>
              </ul>
            </div>
            
            <div className="p-3 bg-red-50 rounded">
              <h3 className="font-medium text-red-800 mb-2">Error Indicators</h3>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>Console errors or warnings</li>
                <li>"Unexpected error creating folder" messages</li>
                <li>Timeout errors or request failures</li>
                <li>Empty folder lists when they should have content</li>
                <li>Posts not showing in correct folders</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Common Issues and Solutions */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Common Issues and Solutions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Authentication Errors</h3>
              <p className="text-sm text-gray-600">
                <strong>Symptom:</strong> "Unexpected error creating folder: {}" or RLS policy errors<br/>
                <strong>Solution:</strong> Ensure you're logged in and refresh the page
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Timeout Errors</h3>
              <p className="text-sm text-gray-600">
                <strong>Symptom:</strong> "Request timeout" or slow loading<br/>
                <strong>Solution:</strong> Check network connection and run performance tests
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Folder Not Showing in Post Form</h3>
              <p className="text-sm text-gray-600">
                <strong>Symptom:</strong> Empty folder dropdown in post creation form<br/>
                <strong>Solution:</strong> Verify space ID and check console for loading errors
              </p>
            </div>
          </div>
        </div>
        
        {/* Quick Access */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Quick Access to Test Pages</h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/test-folder-dashboard" className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Test Dashboard
            </Link>
            <Link href="/test-space-folders" className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              Space Folders Test
            </Link>
            <Link href="/test-folder-final-verification" className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
              Final Verification
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}