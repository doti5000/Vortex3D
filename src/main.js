import { StudioApp } from './studio/StudioApp.js';
import { StudioDashboard } from './studio/StudioDashboard.js';
import { DiscoverApp } from './discover/DiscoverApp.js';
import { GameClient } from './client/GameClient.js';
import { getApiBaseUrl } from './network/api.js';

// Simple URL-based routing to decouple the application
const params = new URLSearchParams(window.location.search);

// Handle OAuth2 PKCE Callback
if (params.has('code')) {
  const code = params.get('code');
  const code_verifier = sessionStorage.getItem('pkce_code_verifier');
  
  if (code && code_verifier) {
    sessionStorage.removeItem('pkce_code_verifier');
    const redirect_uri = window.location.origin + '/';
    
    // Clear the URL parameters without reloading
    window.history.replaceState({}, document.title, window.location.pathname);
    
    fetch(`${getApiBaseUrl()}/api/auth/sso/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, code_verifier, redirect_uri })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        localStorage.setItem('vortex3d_token', data.token);
        localStorage.setItem('vortex3d_user', JSON.stringify(data.user));
        alert(`🎉 Successfully signed in with Phryco SSO!\nWelcome, ${data.user.username}`);
        window.location.reload();
      } else {
        alert('Phryco SSO login failed: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(err => {
      alert('SSO Error: ' + err.message);
    });
  }
}

const mode = params.get('mode') || 'discover';

if (mode === 'studio') {
  console.log("Vortex3D: Launching Studio Dashboard");
  const dashboard = new StudioDashboard();
  const appEl = document.querySelector('#app');
  appEl.innerHTML = '';
  appEl.appendChild(dashboard.container);
} else if (mode === 'editor') {
  console.log("Vortex3D: Launching Studio Editor");
  new StudioApp();
} else if (mode === 'play') {
  console.log("Vortex3D: Launching Live Game Client");
  const gameId = params.get('id');
  const tunnelUrl = params.get('tunnelUrl');
  new GameClient(gameId, tunnelUrl);
} else {
  console.log("Vortex3D: Launching Discover Portal");
  new DiscoverApp();
}
