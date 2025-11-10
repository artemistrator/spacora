import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('Checking favorites table structure...');
    
    // Try to fetch a few records from favorites table
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .limit(3);
      
    if (error) {
      console.error('Error fetching favorites:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        code: error.code
      }, { status: 500 });
    }
    
    console.log('Favorites data:', data);
    
    // Also check the table structure
    const { data: tableData, error: tableError } = await supabase
      .from('favorites')
      .select('*')
      .limit(1);
      
    if (tableError) {
      console.error('Error checking table structure:', tableError);
    } else {
      console.log('Table structure sample:', tableData);
    }
    
    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Favorites table check completed'
    });
  } catch (error: any) {
    console.error('Error in check-favorites API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}