'use client'

import { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { PostReactions } from '@/components/post/PostReactions'

export default function TestReaction() {
  const { userId } = useSupabaseAuth()
  const [postId, setPostId] = useState<string>('')
  const [spaceName, setSpaceName] = useState<string>('Test Space')
  const router = useRouter()

  // Fetch a test post ID
  useEffect(() => {
    const fetchTestPost = async () => {
      if (!userId) return
      
      try {
        // For testing purposes, we'll just use a placeholder
        // In a real implementation, you'd fetch an actual post
        setPostId('test-post-id')
      } catch (error) {
        console.error('Error fetching test post:', error)
      }
    }
    
    fetchTestPost()
  }, [userId])

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Post Reactions</h1>
      
      {userId ? (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Post ID</label>
            <input 
              type="text"
              value={postId}
              onChange={(e) => setPostId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Space Name</label>
            <input 
              type="text"
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          
          {postId && (
            <div className="p-4 border rounded">
              <h2 className="text-lg font-semibold mb-2">Test Reactions</h2>
              <PostReactions 
                postId={postId} 
                spaceName={spaceName}
                initialReactions={[]} 
              />
            </div>
          )}
        </>
      ) : (
        <div className="p-4 bg-yellow-100 rounded">
          <p>Please log in to test reactions.</p>
          <Button onClick={() => router.push('/')} className="mt-2">
            Go to Home
          </Button>
        </div>
      )}
    </div>
  )
}