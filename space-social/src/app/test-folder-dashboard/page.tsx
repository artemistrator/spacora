'use client';

import Link from 'next/link';

export default function TestFolderDashboardPage() {
  const testPages = [
    {
      id: 'test-space-folders',
      title: 'Test Space Folders',
      description: 'Basic folder management functionality test'
    },
    {
      id: 'test-folder-list',
      title: 'Test Folder List',
      description: 'Folder list component testing'
    },
    {
      id: 'test-folder-integration',
      title: 'Test Folder Integration',
      description: 'Folder integration with other components'
    },
    {
      id: 'test-folder-integration-final',
      title: 'Test Folder Integration Final',
      description: 'Final folder integration testing'
    },
    {
      id: 'test-full-folder-workflow',
      title: 'Test Full Folder Workflow',
      description: 'Complete folder workflow testing'
    },
    {
      id: 'test-post-with-folder',
      title: 'Test Post with Folder',
      description: 'Post creation with folder assignment'
    },
    {
      id: 'test-post-display',
      title: 'Test Post Display',
      description: 'Post display with folder information'
    },
    {
      id: 'test-post-form-with-folders',
      title: 'Test Post Form with Folders',
      description: 'Post form with folder selection'
    },
    {
      id: 'test-complete-folder-workflow',
      title: 'Test Complete Folder Workflow',
      description: 'Complete workflow including folder management and post creation'
    },
    {
      id: 'test-folder-posts-display',
      title: 'Test Folder Posts Display',
      description: 'Display posts organized by folders'
    },
    {
      id: 'test-folder-functionality',
      title: 'Test Folder Functionality',
      description: 'Comprehensive folder functionality testing'
    },
    {
      id: 'test-folder-post-integration',
      title: 'Test Folder-Post Integration',
      description: 'Integration between folders and posts'
    },
    {
      id: 'test-final-folder-integration',
      title: 'Test Final Folder Integration',
      description: 'Complete folder and post integration'
    },
    {
      id: 'test-folder-performance',
      title: 'Test Folder Performance',
      description: 'Performance testing of folder operations'
    },
    {
      id: 'test-folder-error-handling',
      title: 'Test Folder Error Handling',
      description: 'Error handling for folder operations'
    },
    {
      id: 'test-request-limiting',
      title: 'Test Request Limiting',
      description: 'Request limiting and concurrency control'
    }
  ];

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Folder Testing Dashboard</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <p className="text-sm text-gray-700">
          This dashboard provides access to all folder-related test pages. Click on any test to navigate to that page.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testPages.map((page) => (
          <Link 
            key={page.id}
            href={`/${page.id}`}
            className="block border rounded-lg p-4 hover:shadow-md transition-shadow hover:bg-gray-50"
          >
            <h3 className="font-bold text-lg mb-2">{page.title}</h3>
            <p className="text-sm text-gray-600">{page.description}</p>
            <div className="mt-3 text-xs text-blue-600 font-medium">
              Click to test →
            </div>
          </Link>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold mb-2">Testing Instructions:</h3>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>Ensure you are logged in before running tests</li>
          <li>Run tests in order from basic to advanced functionality</li>
          <li>Check console logs for detailed test output</li>
          <li>Report any issues or unexpected behavior</li>
        </ul>
      </div>
    </div>
  );
}