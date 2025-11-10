'use client'

import { use } from 'react'

export default function TestSpaceParams({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Space Params</h1>
      <p>Space ID: {unwrappedParams.id}</p>
      <div className="mt-4 p-4 bg-green-100 rounded">
        <p>If you see this page without params warnings, the fix worked!</p>
      </div>
    </div>
  )
}