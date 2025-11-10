import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test listing files from the post-images bucket
    const { data, error } = await supabase.storage
      .from('post-images')
      .list('', {
        limit: 10,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) {
      console.error('Storage test error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Storage is working correctly'
    })
  } catch (error: any) {
    console.error('Storage test failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    // Create a simple test file
    const testContent = 'This is a test file for storage verification'
    const file = new File([testContent], 'api-test.txt', { type: 'text/plain' })
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(`api-test-${Date.now()}.txt`, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'File uploaded successfully'
    })
  } catch (error: any) {
    console.error('Storage upload failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}