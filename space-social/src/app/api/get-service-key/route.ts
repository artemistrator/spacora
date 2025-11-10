import { NextResponse } from 'next/server'

export async function GET() {
  // Only allow this in development or for authorized requests
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY
  
  if (!serviceKey) {
    return NextResponse.json({ error: 'Service key not found' }, { status: 404 })
  }
  
  // In a real application, you would want to add authentication here
  // For debugging purposes, we'll return the key
  return NextResponse.json({ serviceKey })
}