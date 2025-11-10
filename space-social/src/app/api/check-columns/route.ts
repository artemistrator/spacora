import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('Checking columns in spaces table...');
    
    // Try to fetch a space to see what columns are available
    const { data, error } = await supabase
      .from('spaces')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Error fetching space:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    console.log('Space data:', data);
    
    // Check if the required columns exist
    const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
    const requiredColumns = ['followers_count', 'posts_count', 'likes_count', 'favorites_count'];
    const missingColumns = requiredColumns.filter(col => !columns.includes(col));
    
    return NextResponse.json({ 
      success: true, 
      columns,
      missingColumns,
      hasAllRequiredColumns: missingColumns.length === 0,
      data: data?.[0] || null
    });
  } catch (error: any) {
    console.error('Error in check-columns API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}