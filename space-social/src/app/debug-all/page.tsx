'use client'

import { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

export default function DebugAll() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth()
  const [testResults, setTestResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [spaceId, setSpaceId] = useState<string>('')
  const [postId, setPostId] = useState<string>('')
  const [favoriteId, setFavoriteId] = useState<string>('')
  const router = useRouter()

  const addResult = (testName: string, success: boolean, data?: any, error?: any) => {
    const result = {
      testName,
      success,
      data: data ? JSON.stringify(data, null, 2) : null,
      error: error ? JSON.stringify(error, null, 2) : null,
      timestamp: new Date().toISOString()
    }
    
    setTestResults(prev => [...prev, result])
    console.log(`Test: ${testName}`, result)
  }

  // Test 1: Create Space
  const testCreateSpace = async () => {
    if (!userId) {
      addResult('Create Space', false, null, { message: 'User not authenticated' })
      return
    }
    
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // Create a space
      // The database trigger will automatically create the user if needed
      const { data, error } = await supabaseClient
        .from('spaces')
        .insert({
          name: `Test Space ${Date.now()}`,
          description: 'Test space for debugging',
          space_type: 'apartment',
          is_public: true,
          owner_id: userId, // Use the Clerk user ID directly
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (error) throw error
      
      if (data && data[0]) {
        setSpaceId(data[0].id)
      }
      
      addResult('Create Space', true, data)
    } catch (error: any) {
      addResult('Create Space', false, null, error)
    }
  }

  // Test 2: Create Post
  const testCreatePost = async () => {
    if (!spaceId) {
      addResult('Create Post', false, null, { message: 'No space ID available' })
      return
    }
    
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      const { data, error } = await supabaseClient
        .from('posts')
        .insert({
          space_id: spaceId,
          content: 'Test post for debugging',
          images: [],
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (error) throw error
      
      if (data && data[0]) {
        setPostId(data[0].id)
      }
      
      addResult('Create Post', true, data)
    } catch (error: any) {
      addResult('Create Post', false, null, error)
    }
  }

  // Test 3: Add Reaction
  const testAddReaction = async () => {
    if (!postId || !spaceId) {
      addResult('Add Reaction', false, null, { message: 'No post ID or space ID available' })
      return
    }
    
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      const { data, error } = await supabaseClient
        .from('post_reactions')
        .insert({
          post_id: postId,
          space_id: spaceId,
          reaction_type: 'like'
        })
        .select()
      
      if (error) throw error
      
      addResult('Add Reaction', true, data)
    } catch (error: any) {
      addResult('Add Reaction', false, null, error)
    }
  }

  // Test 4: Add to Favorites
  const testAddToFavorites = async () => {
    if (!postId || !spaceId) {
      addResult('Add to Favorites', false, null, { message: 'No post ID or space ID available' })
      return
    }
    
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      const { data, error } = await supabaseClient
        .from('favorites')
        .insert({
          post_id: postId,
          space_id: spaceId,
          collection_name: 'default'
        })
        .select()
      
      if (error) throw error
      
      if (data && data[0]) {
        setFavoriteId(data[0].id)
      }
      
      addResult('Add to Favorites', true, data)
    } catch (error: any) {
      addResult('Add to Favorites', false, null, error)
    }
  }

  // Test 5: Read Operations
  const testReadOperations = async () => {
    try {
      const supabaseClient = await getSupabaseWithSession()
      
      // Test reading spaces
      const { data: spaces, error: spacesError } = await supabaseClient
        .from('spaces')
        .select('*')
        .limit(1)
      
      if (spacesError) throw spacesError
      addResult('Read Spaces', true, spaces)
      
      // Test reading posts
      const { data: posts, error: postsError } = await supabaseClient
        .from('posts')
        .select('*')
        .limit(1)
      
      if (postsError) throw postsError
      addResult('Read Posts', true, posts)
      
      // Test reading reactions
      const { data: reactions, error: reactionsError } = await supabaseClient
        .from('post_reactions')
        .select('*')
        .limit(1)
      
      if (reactionsError) throw reactionsError
      addResult('Read Reactions', true, reactions)
      
      // Test reading favorites
      const { data: favorites, error: favoritesError } = await supabaseClient
        .from('favorites')
        .select('*')
        .limit(1)
      
      if (favoritesError) throw favoritesError
      addResult('Read Favorites', true, favorites)
      
    } catch (error: any) {
      addResult('Read Operations', false, null, error)
    }
  }

  // Run all tests
  const runAllTests = async () => {
    setLoading(true)
    setTestResults([])
    
    await testCreateSpace()
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
    await testCreatePost()
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
    await testAddReaction()
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
    await testAddToFavorites()
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
    await testReadOperations()
    
    setLoading(false)
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug All Operations</h1>
      
      {!userId ? (
        <div className="p-4 bg-yellow-100 rounded">
          <p>Please log in to run tests.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Space ID</label>
              <Input 
                value={spaceId} 
                onChange={(e) => setSpaceId(e.target.value)} 
                placeholder="Enter space ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Post ID</label>
              <Input 
                value={postId} 
                onChange={(e) => setPostId(e.target.value)} 
                placeholder="Enter post ID"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            <Button onClick={testCreateSpace} disabled={loading}>
              Test Create Space
            </Button>
            <Button onClick={testCreatePost} disabled={loading || !spaceId}>
              Test Create Post
            </Button>
            <Button onClick={testAddReaction} disabled={loading || !postId || !spaceId}>
              Test Add Reaction
            </Button>
            <Button onClick={testAddToFavorites} disabled={loading || !postId || !spaceId}>
              Test Add to Favorites
            </Button>
            <Button onClick={testReadOperations} disabled={loading}>
              Test Read Operations
            </Button>
            <Button onClick={runAllTests} disabled={loading} variant="destructive">
              Run All Tests
            </Button>
          </div>
          
          {loading && (
            <div className="p-4 bg-blue-100 rounded mb-4">
              Running tests... Please wait.
            </div>
          )}
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Test Results</h2>
            {testResults.length === 0 ? (
              <p className="text-gray-500">No test results yet. Run some tests above.</p>
            ) : (
              testResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded border ${
                    result.success ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{result.testName}</h3>
                    <span className={`px-2 py-1 rounded text-sm ${
                      result.success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {result.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </div>
                  
                  {result.data && (
                    <div className="mt-2">
                      <h4 className="font-medium">Data:</h4>
                      <pre className="text-xs bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
                        {result.data}
                      </pre>
                    </div>
                  )}
                  
                  {result.error && (
                    <div className="mt-2">
                      <h4 className="font-medium text-red-700">Error:</h4>
                      <pre className="text-xs bg-gray-800 text-red-400 p-2 rounded overflow-x-auto">
                        {result.error}
                      </pre>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}