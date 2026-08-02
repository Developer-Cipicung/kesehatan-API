const run = async () => {
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'kader-cempaka-2', password: 'password123' })
  });
  const loginData = await loginRes.json();
  if (!loginData.data) {
    console.error('LOGIN FAILED:', loginData);
    return;
  }
  const token = loginData.data.session.access_token;
  const bumilRes = await fetch('http://localhost:3000/api/v1/bumil', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const bumilData = await bumilRes.json();
  console.log('BUMIL RES:', bumilRes.status, bumilData);
};
run();
