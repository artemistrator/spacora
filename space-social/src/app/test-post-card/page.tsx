'use client'

import { PostCard } from '@/components/post/PostCard'

export default function TestPostCard() {
  // Test data in the format used by InfiniteFeed
  const mockPost1 = {
    id: 'test-1',
    content: 'Test post 1',
    images: ['https://placehold.co/600x400'],
    likesCount: 10,
    commentsCount: 5,
    roomTag: 'kitchen',
    styleTags: ['modern', 'minimal']
  }

  // Test data in the format used by the space page
  const mockPost2 = {
    id: 'test-2',
    content: 'Test post 2',
    images: ['https://placehold.co/600x400'],
    likes_count: 15,
    comments_count: 3,
    room_tag: 'bedroom',
    style_tags: ['scandinavian', 'cozy']
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test PostCard Component</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Format 1 (InfiniteFeed)</h2>
          <PostCard post={mockPost1} />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Format 2 (Space Page)</h2>
          <PostCard post={mockPost2} />
        </div>
      </div>
    </div>
  )
}