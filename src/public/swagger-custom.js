let lastToken = '';

// Intercept fetch to capture the token
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  const clonedRes = response.clone();
  
  if (args[0] && args[0].includes('/auth/login') && args[1] && args[1].method === 'POST') {
    clonedRes.json().then(data => {
      if (data && data.data && data.data.session && data.data.session.access_token) {
        lastToken = data.data.session.access_token;
        
        // Also auto-authorize them for convenience!
        if (window.ui && window.ui.authActions) {
          window.ui.authActions.authorize({
            BearerAuth: {
              name: 'BearerAuth',
              schema: { type: 'http', in: 'header', name: 'Authorization' },
              value: lastToken
            }
          });
        }
      }
    }).catch(e => console.error(e));
  }
  
  return response;
};

// Observer to inject the copy button
const observer = new MutationObserver((mutations) => {
  if (!lastToken) return;
  
  // Look for the responses table of the login endpoint
  const loginResponses = document.querySelectorAll('.opblock-post[id^="operations-Authentication-post_auth_login"] .responses-wrapper');
  
  loginResponses.forEach(wrapper => {
    // Check if we already added the button
    if (!wrapper.querySelector('.copy-token-btn')) {
      const btn = document.createElement('button');
      btn.className = 'copy-token-btn btn';
      btn.style.marginTop = '10px';
      btn.style.marginBottom = '10px';
      btn.style.backgroundColor = '#4990e2';
      btn.style.color = 'white';
      btn.innerText = 'Copy Bearer Token';
      
      btn.onclick = () => {
        navigator.clipboard.writeText(lastToken).then(() => {
          const originalText = btn.innerText;
          btn.innerText = 'Copied!';
          setTimeout(() => { btn.innerText = originalText; }, 2000);
        });
      };
      
      wrapper.prepend(btn);
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  observer.observe(document.body, { childList: true, subtree: true });
});
