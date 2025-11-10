import { NextResponse } from 'next/server';
import { getAuthenticatedSupabase } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // Попробуем получить аутентифицированного клиента Supabase
    const supabase = await getAuthenticatedSupabase();
    
    // Попробуем выполнить простой запрос
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Supabase auth error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        code: error.code
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Supabase authentication successful',
      data
    });
  } catch (error) {
    console.error('API auth test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}