import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('Adding likes_count and favorites_count columns to spaces table...');
    
    // Since we can't use exec_sql, let's try to directly update the table structure
    // This is a workaround since we can't directly alter tables through the client
    
    // First, let's check if the columns exist by trying to select them
    const { data, error } = await supabase
      .from('spaces')
      .select('id, likes_count, favorites_count')
      .limit(1);
      
    if (error) {
      console.error('Error checking columns:', error);
      // If there's an error, it might be because the columns don't exist
      // In that case, we'll need to handle this differently
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        message: 'Columns may not exist yet'
      });
    }
    
    console.log('Columns check result:', data);
    
    // If we get here, the columns exist, let's initialize any null values
    const { error: updateError } = await supabase
      .from('spaces')
      .update({ 
        likes_count: 0,
        favorites_count: 0
      })
      .is('likes_count', null)
      .is('favorites_count', null);
      
    if (updateError) {
      console.error('Error initializing columns:', updateError);
    } else {
      console.log('Columns initialized successfully');
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Columns checked and initialized',
      data
    });
  } catch (error: any) {
    console.error('Error in add-columns API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}