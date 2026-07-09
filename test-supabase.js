const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.auth.signUp({
    email: 'admin2@cipicung.com',
    password: 'kader123'
  });
  console.log('Error:', error);
}
test();
