'use client'

import { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function TestPostCreate() {
  const { getSupabaseWithSession, userId } = useSupabaseAuth()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [spaces, setSpaces] = useState<any[]>([])
  const [selectedSpace, setSelectedSpace] = useState<string>('')
  const router = useRouter()

  // Fetch user's spaces
  useEffect(() => {
    const fetchSpaces = async () => {
      if (!userId) return
      
      try {
        const supabaseClient = await getSupabaseWithSession()
        const { data, error } = await supabaseClient
          .from('spaces')
          .select('id, name')
        
        if (error) throw error
        setSpaces(data || [])
        if (data && data.length > 0) {
          setSelectedSpace(data[0].id)
        }
      } catch (error) {
        console.error('Error fetching spaces:', error)
      }
    }
    
    fetchSpaces()
  }, [userId, getSupabaseWithSession])

  const testCreatePost = async () => {
    if (!selectedSpace) {
      setResult({ success: false, error: 'Please select a space' })
      return
    }
    
    setLoading(true)
    try {
      // Get authenticated Supabase client
      const supabaseClient = await getSupabaseWithSession()
      
      // Log the client to see if it's properly authenticated
      console.log('Supabase client auth state:', supabaseClient.auth)
      
      // Try to create a post
      const { data, error } = await supabaseClient
        .from('posts')
        .insert({
          space_id: selectedSpace,
          content: 'Test post from test page',
          images: ['https://example.com/test-image.jpg'],
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (error) throw error
      
      setResult({ success: true, data })
    } catch (error: any) {
      console.error('Error creating post:', error)
      setResult({ success: false, error: error.message, details: error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Post Creation</h1>
      
      {userId ? (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Select Space</label>
            <select 
              value={selectedSpace} 
              onChange={(e) => setSelectedSpace(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a space</option>
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>{space.name}</option>
              ))}
            </select>
          </div>
          
          <Button onClick={testCreatePost} disabled={loading || !selectedSpace}>
            {loading ? 'Creating...' : 'Test Create Post'}
          </Button>
        </>
      ) : (
        <div className="p-4 bg-yellow-100 rounded">
          <p>Please log in to test post creation.</p>
          <Button onClick={() => router.push('/')} className="mt-2">
            Go to Home
          </Button>
        </div>
      )}
      
      {result && (
        <div className="mt-4 p-4 rounded bg-gray-100">
          <h2 className="text-lg font-semibold">Result:</h2>
          <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}