import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { spaceId, increment } = await request.json();
    
    console.log('Updating follower count for space:', spaceId, 'increment:', increment);
    
    // First, get the current follower count
    const { data: spaceData, error: fetchError } = await supabase
      .from('spaces')
      .select('followers_count')
      .eq('id', spaceId)
      .single();
      
    if (fetchError) {
      console.error('Error fetching space:', fetchError);
      return NextResponse.json({ 
        success: false, 
        error: fetchError.message 
      }, { status: 500 });
    }
    
    // Calculate new count
    const currentCount = spaceData.followers_count || 0;
    const newCount = increment ? currentCount + 1 : Math.max(0, currentCount - 1);
    
    console.log('Current count:', currentCount, 'New count:', newCount);
    
    // Update the follower count
    const { error: updateError } = await supabase
      .from('spaces')
      .update({ followers_count: newCount })
      .eq('id', spaceId);
      
    if (updateError) {
      console.error('Error updating followers_count:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: updateError.message 
      }, { status: 500 });
    }
    
    console.log('Successfully updated followers_count to:', newCount);
    
    return NextResponse.json({ 
      success: true, 
      newCount,
      message: 'Follower count updated successfully'
    });
  } catch (error: any) {
    console.error('Error in update-follower API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}