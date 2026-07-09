import { supabase } from './src/lib/supabase';

async function main() {
  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email: 'admin@cipicung.com',
    password: 'kader123'
  });
  
  if (error) {
    console.error("Login failed:", error);
    return;
  }
  
  const token = signInData.session.access_token;
  const res = await fetch('http://localhost:3000/api/v1/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  console.log("getMe response:", data);
}

main();
