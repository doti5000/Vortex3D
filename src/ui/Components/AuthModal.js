import { getApiBaseUrl } from '../../network/api.js';

export function createAuthModal({ onAuthSuccess }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(7, 11, 25, 0.88); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 9999;';

  const modal = document.createElement('div');
  modal.className = 'modal-container auth-modal';
  modal.style.cssText = 'width: 100%; max-width: 450px; background: #0f172a; border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 14px; box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(14, 165, 233, 0.15); overflow: hidden; font-family: inherit; color: white; animation: modalIn 0.2s ease-out;';

  let activeTab = 'login'; // 'login' | 'register'
  const PHRYCO_SSO_WORKER_URL = 'https://autumn-credit-7767.forbusiness68-8-65-43.workers.dev/';
  const PHRYCO_CLIENT_ID = 'phryco_rHTNGFVGpzdw1Fs0wX5h';

  function render() {
    modal.innerHTML = `
      <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #070b19; border-bottom: 1px solid #1e293b;">
        <div>
          <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #38bdf8; display: flex; align-items: center; gap: 8px;">
            <span>🔐</span> VORTEX3D ACCOUNT AUTHENTICATION
          </h3>
          <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">A Division of <b>Phryco LLC Enterprise Ecosystem</b></span>
        </div>
        <button class="btn-close" id="btn-close-auth" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; padding: 4px 8px; border-radius: 4px;">✕</button>
      </div>

      <div class="modal-body" style="padding: 20px;">
        <!-- Phryco SSO Single Sign-On Option -->
        <button id="btn-phryco-sso" style="width: 100%; padding: 12px; font-weight: 700; font-size: 14px; background: linear-gradient(135deg, #1a73e8, #1557b0); color: white; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 4px 14px rgba(26, 115, 232, 0.4); margin-bottom: 16px; transition: transform 0.1s ease;">
          <span style="font-size: 18px;">🌐</span> Sign in with Phryco Account (SSO)
        </button>

        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="flex: 1; height: 1px; background: #1e293b;"></div>
          <span style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">OR VORTEX3D DIRECT SIGN-IN</span>
          <div style="flex: 1; height: 1px; background: #1e293b;"></div>
        </div>

        <div class="auth-tabs" style="display: flex; gap: 8px; margin-bottom: 18px; background: #070b19; padding: 4px; border-radius: 8px; border: 1px solid #1e293b;">
          <button class="btn-tab ${activeTab === 'login' ? 'active' : ''}" id="tab-login" style="flex: 1; padding: 10px; font-weight: 700; font-size: 13px; background: ${activeTab === 'login' ? '#3b82f6' : 'transparent'}; color: white; border: none; border-radius: 6px; cursor: pointer; transition: all 0.15s ease;">SIGN IN</button>
          <button class="btn-tab ${activeTab === 'register' ? 'active' : ''}" id="tab-register" style="flex: 1; padding: 10px; font-weight: 700; font-size: 13px; background: ${activeTab === 'register' ? '#3b82f6' : 'transparent'}; color: white; border: none; border-radius: 6px; cursor: pointer; transition: all 0.15s ease;">REGISTER ACCOUNT</button>
        </div>

        <div id="auth-error-msg" style="display: none; padding: 10px 14px; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 6px; color: #fca5a5; margin-bottom: 16px; font-size: 13px;"></div>

        <form id="auth-form">
          <div class="form-group" style="margin-bottom: 14px;">
            <label style="display: block; font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 6px;">USERNAME</label>
            <input type="text" id="auth-username" name="username" autocomplete="username" placeholder="e.g. BuilderBob" required style="width: 100%; padding: 11px; background: #070b19; border: 1px solid #1e293b; border-radius: 6px; color: white; font-size: 14px; outline: none; box-sizing: border-box;" />
          </div>

          ${activeTab === 'register' ? `
            <div class="form-group" style="margin-bottom: 14px;">
              <label style="display: block; font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 6px;">EMAIL ADDRESS</label>
              <input type="email" id="auth-email" name="email" autocomplete="email" placeholder="bob@phryco.com" required style="width: 100%; padding: 11px; background: #070b19; border: 1px solid #1e293b; border-radius: 6px; color: white; font-size: 14px; outline: none; box-sizing: border-box;" />
            </div>
          ` : ''}

          <div class="form-group" style="margin-bottom: 20px;">
            <label style="display: block; font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 6px;">PASSWORD</label>
            <input type="password" id="auth-password" name="password" autocomplete="${activeTab === 'login' ? 'current-password' : 'new-password'}" placeholder="••••••••" required style="width: 100%; padding: 11px; background: #070b19; border: 1px solid #1e293b; border-radius: 6px; color: white; font-size: 14px; outline: none; box-sizing: border-box;" />
          </div>

          <button type="submit" id="btn-submit-auth" style="width: 100%; padding: 12px; font-weight: 800; font-size: 14px; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 6px; cursor: pointer; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35); transition: transform 0.1s ease;">
            ${activeTab === 'login' ? '🔑 SIGN IN TO VORTEX3D' : '✨ CREATE VORTEX3D ACCOUNT'}
          </button>
        </form>
      </div>
    `;

    setTimeout(() => {
      const usernameInput = modal.querySelector('#auth-username');
      if (usernameInput) usernameInput.focus();
    }, 50);

    // Event Handlers
    modal.querySelector('#btn-close-auth').addEventListener('click', () => backdrop.remove());
    modal.querySelector('#tab-login').addEventListener('click', () => { activeTab = 'login'; render(); });
    modal.querySelector('#tab-register').addEventListener('click', () => { activeTab = 'register'; render(); });

    // Phryco SSO Button Event Handler
    modal.querySelector('#btn-phryco-sso').addEventListener('click', async () => {
      try {
        const baseUrl = getApiBaseUrl();
        const res = await fetch(`${baseUrl}/api/auth/sso`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: PHRYCO_CLIENT_ID, ssoWorkerUrl: PHRYCO_SSO_WORKER_URL })
        });
        const data = await res.json();
        
        if (data.success) {
          localStorage.setItem('vortex3d_token', data.token);
          localStorage.setItem('vortex3d_user', JSON.stringify(data.user));
          if (onAuthSuccess) onAuthSuccess(data.user);
          backdrop.remove();
          alert(`🎉 Successfully Signed in with Phryco LLC Account!\n\nUser: ${data.user.username}\nProvider: ${data.user.provider}\nClient ID: ${PHRYCO_CLIENT_ID}`);
        } else {
          window.open(PHRYCO_SSO_WORKER_URL, '_blank');
        }
      } catch (err) {
        window.open(PHRYCO_SSO_WORKER_URL, '_blank');
      }
    });

    const form = modal.querySelector('#auth-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errBox = modal.querySelector('#auth-error-msg');
      errBox.style.display = 'none';

      const username = modal.querySelector('#auth-username').value.trim();
      const password = modal.querySelector('#auth-password').value;
      const email = activeTab === 'register' ? modal.querySelector('#auth-email').value.trim() : null;

      const endpoint = activeTab === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload = activeTab === 'register' ? { username, email, password } : { username, password };

      try {
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok || data.error) {
          errBox.textContent = data.error || 'Authentication failed.';
          errBox.style.display = 'block';
          return;
        }

        localStorage.setItem('vortex3d_token', data.token);
        localStorage.setItem('vortex3d_user', JSON.stringify(data.user));

        if (onAuthSuccess) onAuthSuccess(data.user);
        backdrop.remove();
        alert(`🎉 Welcome ${data.user.username}! Account authenticated successfully.`);
      } catch (err) {
        const fallbackUser = {
          id: 'usr_' + Math.random().toString(36).substring(2, 9),
          username: username,
          email: email || `${username}@phryco.com`
        };
        const fallbackToken = 'tok_offline_' + Math.random().toString(36).substring(2, 10);

        localStorage.setItem('vortex3d_token', fallbackToken);
        localStorage.setItem('vortex3d_user', JSON.stringify(fallbackUser));

        if (onAuthSuccess) onAuthSuccess(fallbackUser);
        backdrop.remove();
        alert(`🎉 Welcome ${fallbackUser.username}! Account active in offline local mode.`);
      }
    });
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.remove();
  });

  render();
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}
