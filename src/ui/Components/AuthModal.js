import { getApiBaseUrl } from '../../network/api.js';

export function createAuthModal({ onAuthSuccess }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const modal = document.createElement('div');
  modal.className = 'modal-container auth-modal';

  let activeTab = 'login'; // 'login' | 'register'

  function render() {
    modal.innerHTML = `
      <div class="modal-header">
        <h3>🔐 VORTEX3D ACCOUNT AUTHENTICATION</h3>
        <button class="btn-close" id="btn-close-auth">✕</button>
      </div>

      <div class="modal-body">
        <div class="auth-tabs" style="display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 1px solid #334155; padding-bottom: 8px;">
          <button class="btn-tab ${activeTab === 'login' ? 'active' : ''}" id="tab-login" style="flex: 1; padding: 10px; font-weight: 700; background: ${activeTab === 'login' ? '#3b82f6' : '#1e293b'}; color: white; border: none; border-radius: 6px; cursor: pointer;">SIGN IN</button>
          <button class="btn-tab ${activeTab === 'register' ? 'active' : ''}" id="tab-register" style="flex: 1; padding: 10px; font-weight: 700; background: ${activeTab === 'register' ? '#3b82f6' : '#1e293b'}; color: white; border: none; border-radius: 6px; cursor: pointer;">REGISTER ACCOUNT</button>
        </div>

        <div id="auth-error-msg" style="display: none; padding: 10px; background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; border-radius: 6px; color: #fca5a5; margin-bottom: 14px; font-size: 13px;"></div>

        <form id="auth-form">
          <div class="form-group" style="margin-bottom: 12px;">
            <label style="display: block; font-size: 12px; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">USERNAME</label>
            <input type="text" id="auth-username" placeholder="e.g. BuilderBob" required style="width: 100%; padding: 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: white; font-size: 14px;" />
          </div>

          ${activeTab === 'register' ? `
            <div class="form-group" style="margin-bottom: 12px;">
              <label style="display: block; font-size: 12px; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">EMAIL ADDRESS</label>
              <input type="email" id="auth-email" placeholder="bob@vortex3d.com" required style="width: 100%; padding: 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: white; font-size: 14px;" />
            </div>
          ` : ''}

          <div class="form-group" style="margin-bottom: 18px;">
            <label style="display: block; font-size: 12px; font-weight: 600; color: #94a3b8; margin-bottom: 4px;">PASSWORD</label>
            <input type="password" id="auth-password" placeholder="••••••••" required style="width: 100%; padding: 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: white; font-size: 14px;" />
          </div>

          <button type="submit" id="btn-submit-auth" style="width: 100%; padding: 12px; font-weight: 700; font-size: 15px; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 6px; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
            ${activeTab === 'login' ? '🔑 SIGN IN TO VORTEX3D' : '✨ CREATE VORTEX3D ACCOUNT'}
          </button>
        </form>
      </div>
    `;

    // Event Handlers
    modal.querySelector('#btn-close-auth').addEventListener('click', () => backdrop.remove());
    modal.querySelector('#tab-login').addEventListener('click', () => { activeTab = 'login'; render(); });
    modal.querySelector('#tab-register').addEventListener('click', () => { activeTab = 'register'; render(); });

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

        // Save Auth Token & User Object to localStorage
        localStorage.setItem('vortex3d_token', data.token);
        localStorage.setItem('vortex3d_user', JSON.stringify(data.user));

        if (onAuthSuccess) onAuthSuccess(data.user);
        backdrop.remove();
        alert(`🎉 Welcome ${data.user.username}! Account active on PostgreSQL / Local Storage.`);
      } catch (err) {
        errBox.textContent = 'Backend server connection error. Make sure server is running.';
        errBox.style.display = 'block';
      }
    });
  }

  render();
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}
