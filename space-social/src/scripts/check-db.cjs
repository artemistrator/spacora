const { createClient } = require('@supabase/supabase-js');

async function checkDatabase() {
  const supabase = createClient(
    'https://pwpfwkjlpoimhzsjoexg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3cGZ3a2pscG9pbWh6c2pvZXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzEwOTIsImV4cCI6MjA3NTQwNzA5Mn0.d-q2M-Ql8RnI5O5LV7rrWIQKJW9L0awAPIoIOf63n4s'
  );

  console.log('Checking spaces...');
  const { data: spaces, error: spacesError } = await supabase
    .from('spaces')
    .select('*')
    .limit(5);
  
  console.log('Spaces:', spaces);
  console.log('Spaces error:', spacesError);

  console.log('\nChecking user identities...');
  const { data: userIdentities, error: userIdentitiesError } = await supabase
    .from('user_identities')
    .select('*');
  
  console.log('User identities:', userIdentities);
  console.log('User identities error:', userIdentitiesError);

  console.log('\nChecking specific user identity...');
  const { data: specificIdentity, error: specificIdentityError } = await supabase
    .from('user_identities')
    .select('*')
    .eq('clerk_id', 'user_33jxvpJJNsyAgXvDHwYql5YPDkD');
  
  console.log('Specific identity:', specificIdentity);
  console.log('Specific identity error:', specificIdentityError);
}

checkDatabase();