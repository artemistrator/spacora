import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('Testing counters...');
    
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
    
    // Try to update a space's followers_count
    if (data && data.length > 0) {
      const spaceId = data[0].id;
      
      const { error: updateError } = await supabase
        .from('spaces')
        .update({ followers_count: (data[0].followers_count || 0) + 1 })
        .eq('id', spaceId);
        
      if (updateError) {
        console.error('Error updating followers_count:', updateError);
      } else {
        console.log('Successfully updated followers_count');
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Counters test completed'
    });
  } catch (error: any) {
    console.error('Error in test-counters API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}