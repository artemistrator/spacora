'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Debug() {
  const debugPages = [
    {
      title: 'All Operations Debug',
      description: 'Test all operations: creating spaces, posts, reactions, and favorites',
      path: '/debug-all'
    },
    {
      title: 'Authentication Debug',
      description: 'Check authentication status and test auth-related operations',
      path: '/debug-auth'
    },
    {
      title: 'Database RLS Debug',
      description: 'Test Row Level Security policies for all tables',
      path: '/debug-db'
    },
    {
      title: 'User Mapping Debug',
      description: 'Check user identity mapping between Clerk and Supabase',
      path: '/debug-user-mapping'
    },
    {
      title: 'Auth Check Debug',
      description: 'Check authentication context and test various auth scenarios',
      path: '/debug-auth-check'
    },
    {
      title: 'Manual Auth Debug',
      description: 'Test manual authentication approaches',
      path: '/debug-manual-auth'
    },
    {
      title: 'Test API Create',
      description: 'Test creating spaces via server-side API routes',
      path: '/test-api-create'
    },
    {
      title: 'Debug Summary',
      description: 'View summary of findings and recommended solutions',
      path: '/debug-summary'
    },
    {
      title: 'Space Creation Test',
      description: 'Test creating spaces',
      path: '/test-space-create'
    },
    {
      title: 'Post Creation Test',
      description: 'Test creating posts',
      path: '/test-post-create'
    },
    {
      title: 'Reaction Test',
      description: 'Test adding reactions to posts',
      path: '/test-reaction'
    }
  ]

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Debug Pages</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {debugPages.map((page, index) => (
          <div key={index} className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold mb-2">{page.title}</h2>
            <p className="text-gray-600 mb-4">{page.description}</p>
            <Link href={page.path}>
              <Button className="w-full">
                Open Debug Page
              </Button>
            </Link>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-yellow-100 rounded">
        <h2 className="text-lg font-semibold mb-2">How to Use These Debug Pages</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Start with the Authentication Debug page to verify your login status</li>
          <li>Use the User Mapping Debug page to check if your user is properly mapped</li>
          <li>Test individual operations with the specific test pages</li>
          <li>Run the "All Operations Debug" page to test everything at once</li>
          <li>Check the Database RLS Debug page to verify Row Level Security policies</li>
          <li>View the Debug Summary for a comprehensive overview of the issue</li>
        </ul>
      </div>
    </div>
  )
}