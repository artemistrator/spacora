import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service key if available, otherwise use anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET() {
  try {
    let supabase;
    
    // Use service key if available (bypasses RLS)
    if (supabaseServiceKey) {
      console.log('Using service key')
      supabase = createClient(supabaseUrl, supabaseServiceKey)
    } else {
      console.log('Using anon key')
      supabase = createClient(supabaseUrl, supabaseAnonKey)
    }
    
    // Test listing files
    const { data, error } = await supabase.storage
      .from('post-images')
      .list()

    if (error) {
      console.error('Storage test error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error,
        using: supabaseServiceKey ? 'service-key' : 'anon-key'
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data,
      using: supabaseServiceKey ? 'service-key' : 'anon-key',
      message: 'Storage is working correctly'
    })
  } catch (error: any) {
    console.error('Storage test failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      using: supabaseServiceKey ? 'service-key' : 'anon-key'
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    let supabase;
    
    // Use service key if available (bypasses RLS)
    if (supabaseServiceKey) {
      console.log('Using service key for upload')
      supabase = createClient(supabaseUrl, supabaseServiceKey)
    } else {
      console.log('Using anon key for upload')
      supabase = createClient(supabaseUrl, supabaseAnonKey)
    }
    
    // Create a simple test file
    const testContent = 'This is a test file for storage verification from server'
    // In a real server environment, we would create a Buffer or use a different approach
    // For now, we'll simulate this
    
    // Since we can't easily create a File object on the server, let's try a different approach
    // We'll create a Blob-like object
    const fileData = new TextEncoder().encode(testContent)
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(`server-test-${Date.now()}.txt`, fileData, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'text/plain'
      })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error,
        using: supabaseServiceKey ? 'service-key' : 'anon-key'
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data,
      using: supabaseServiceKey ? 'service-key' : 'anon-key',
      message: 'File uploaded successfully'
    })
  } catch (error: any) {
    console.error('Storage upload failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      using: supabaseServiceKey ? 'service-key' : 'anon-key'
    }, { status: 500 })
  }
}