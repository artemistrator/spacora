import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  const { userId, getToken } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get the Supabase token from Clerk
    const supabaseToken = await getToken({ template: 'supabase' });
    
    // Create a new Supabase client with the token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${supabaseToken}`
        }
      }
    });
    
    // Parse the request body
    const body = await request.json();
    
    // Create the space
    const { data, error } = await supabase
      .from('spaces')
      .insert({
        ...body,
        owner_id: userId,
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error creating space:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}