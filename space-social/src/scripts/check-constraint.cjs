const { createClient } = require('@supabase/supabase-js');

async function checkConstraint() {
  const supabase = createClient(
    'https://pwpfwkjlpoimhzsjoexg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3cGZ3a2pscG9pbWh6c2pvZXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzEwOTIsImV4cCI6MjA3NTQwNzA5Mn0.d-q2M-Ql8RnI5O5LV7rrWIQKJW9L0awAPIoIOf63n4s'
  );

  // Check if the supabase_id exists in auth.users
  console.log('Checking if supabase_id exists in auth.users...');
  const { data: userExists, error: userExistsError } = await supabase
    .from('users')
    .select('*')
    .eq('id', '4f49bb4b-aaba-445b-bae3-57d8e1c7a259')
    .maybeSingle();
  
  console.log('User exists:', userExists);
  console.log('User exists error:', userExistsError);

  // Check if the clerk_id exists in auth.users
  console.log('\nChecking if clerk_id exists in auth.users...');
  const { data: clerkUserExists, error: clerkUserExistsError } = await supabase
    .from('users')
    .select('*')
    .eq('id', 'user_33jxvpJJNsyAgXvDHwYql5YPDkD')
    .maybeSingle();
  
  console.log('Clerk user exists:', clerkUserExists);
  console.log('Clerk user exists error:', clerkUserExistsError);
}

checkConstraint();