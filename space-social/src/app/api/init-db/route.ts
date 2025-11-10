import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('Initializing database...');
    
    // Просто возвращаем успех, так как таблицы должны быть созданы в Supabase Dashboard
    // или через миграции
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database initialization endpoint ready. Please create tables through Supabase Dashboard.' 
    });
  } catch (error) {
    console.error('Init DB error:', error);
    return NextResponse.json({ error: 'Database initialization failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Database Initialization Endpoint',
    instructions: 'Use POST request to initialize database tables'
  });
}
