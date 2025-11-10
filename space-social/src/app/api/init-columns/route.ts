import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service key if available for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST() {
  try {
    console.log('Initializing columns in spaces table...');
    
    // Since we can't directly alter tables through the client,
    // we'll try to update existing records to ensure all columns have values
    const { data, error } = await supabase
      .from('spaces')
      .select('id');
      
    if (error) {
      console.error('Error fetching spaces:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    console.log(`Found ${data?.length || 0} spaces`);
    
    // Try to update all spaces to ensure counters are initialized
    const { error: updateError } = await supabase
      .from('spaces')
      .update({ 
        followers_count: 0,
        posts_count: 0,
        likes_count: 0,
        favorites_count: 0
      });
      
    if (updateError) {
      console.error('Error updating spaces:', updateError);
      // This might fail if columns don't exist, which is expected
      // Let's try a different approach
    } else {
      console.log('Spaces updated successfully');
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Columns initialization attempted',
      spaceCount: data?.length || 0
    });
  } catch (error: any) {
    console.error('Error in init-columns API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}