import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('Testing Supabase connection from API route...');
    
    // Попробуем получить информацию о таблицах
    const { data, error } = await supabase
      .from('spaces')
      .select('id, name')
      .limit(1);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: JSON.stringify(error)
      }, { status: 500 });
    }

    console.log('Supabase data:', data);
    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Подключение к Supabase успешно установлено'
    });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}