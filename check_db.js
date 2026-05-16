require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkDatabase() {
  console.log('🔍 Checking Database Connectivity...');
  
  // 1. Check if 'profiles' table exists and is readable
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  
  if (error) {
    console.error('❌ Database Error:', error.message);
    if (error.message.includes('relation "profiles" does not exist')) {
      console.error('👉 ACTION: The "profiles" table is missing! Please run the SQL script.');
    }
  } else {
    console.log('✅ Profiles table is accessible.');
    console.log('Current row count:', data.length);
  }

  // 2. Check extensions
  const { data: ext, error: extErr } = await supabase.rpc('version');
  if (extErr) {
    console.log('⚠️ Note: Could not check extensions, but database is reachable.');
  } else {
    console.log('✅ Supabase Engine:', ext);
  }
}

checkDatabase();
