import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('Checking post_reactions table structure...');
    
    // Try to fetch a few records from post_reactions table
    const { data, error } = await supabase
      .from('post_reactions')
      .select('*')
      .limit(3);
      
    if (error) {
      console.error('Error fetching post_reactions:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        code: error.code
      }, { status: 500 });
    }
    
    console.log('Post reactions data:', data);
    
    // Also check the table structure
    const { data: tableData, error: tableError } = await supabase
      .from('post_reactions')
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
      message: 'Post reactions table check completed'
    });
  } catch (error: any) {
    console.error('Error in check-reactions API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}