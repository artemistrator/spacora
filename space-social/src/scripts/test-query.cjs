const { createClient } = require('@supabase/supabase-js');

async function testQuery() {
  const supabase = createClient(
    'https://pwpfwkjlpoimhzsjoexg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3cGZ3a2pscG9pbWh6c2pvZXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzEwOTIsImV4cCI6MjA3NTQwNzA5Mn0.d-q2M-Ql8RnI5O5LV7rrWIQKJW9L0awAPIoIOf63n4s'
  );

  const clerkUserId = 'user_33jxvpJJNsyAgXvDHwYql5YPDkD';
  const supabaseUserId = '4f49bb4b-aaba-445b-bae3-57d8e1c7a259';

  console.log('Testing query with OR condition...');
  const { data: spaces, error: spacesError } = await supabase
    .from('spaces')
    .select('*')
    .or(`owner_id.eq.${clerkUserId},owner_id.eq.${supabaseUserId}`);
  
  console.log('Spaces found:', spaces);
  console.log('Spaces error:', spacesError);
  
  console.log('\nTesting query with just Clerk ID...');
  const { data: spacesClerk, error: spacesClerkError } = await supabase
    .from('spaces')
    .select('*')
    .eq('owner_id', clerkUserId);
  
  console.log('Spaces with Clerk ID:', spacesClerk);
  console.log('Spaces with Clerk ID error:', spacesClerkError);
}

testQuery();