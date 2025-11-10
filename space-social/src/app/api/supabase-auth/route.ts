import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { userId, sessionId, getToken } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get the Supabase token
    const supabaseToken = await getToken({ template: 'supabase' });
    
    return NextResponse.json({
      userId,
      sessionId,
      hasSupabaseToken: !!supabaseToken,
      supabaseToken: supabaseToken ? supabaseToken.substring(0, 20) + '...' : null
    });
  } catch (error) {
    console.error('Error getting token:', error);
    return NextResponse.json({ error: 'Failed to get token' }, { status: 500 });
  }
}