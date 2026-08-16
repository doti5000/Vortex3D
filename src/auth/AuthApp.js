import { getApiBaseUrl } from '../network/api.js';

export class AuthApp {
  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'auth-page';
    this.container.innerHTML = `
      <div class="auth-card">
        <h1 class="auth-title">Vortex3D</h1>
        <p class="auth-subtitle">Sign in to your Phryco account</p>
        
        <div class="auth-tabs">
          <button class="auth-tab active" data-tab="login">Login</button>
          <button class="auth-tab" data-tab="register">Register</button>
        </div>

        <form id="auth-form" class="auth-form">
          <input type="text" id="auth-username" placeholder="Username" required />
          <input type="password" id="auth-password" placeholder="Password" required />
          <div id="register-fields" style="display: none; flex-direction: column; gap: 12px;">
            <input type="email" id="auth-email" placeholder="Email" />
          </div>
          <button type="submit" id="auth-submit" class="btn btn-primary" style="margin-top: 10px; width: 100%;">Sign In</button>
        </form>

        <div class="auth-divider"><span>OR</span></div>
        <button id="sso-btn" class="btn sso-btn">Continue with Phryco SSO</button>
        <p id="auth-error" class="auth-error"></p>
      </div>
    `;

    document.getElementById('app').appendChild(this.container);
    this.init();
  }

  init() {
    let mode = 'login';
    const form = this.container.querySelector('#auth-form');
    const userField = this.container.querySelector('#auth-username');
    const passField = this.container.querySelector('#auth-password');
    const emailField = this.container.querySelector('#auth-email');
    const submitBtn = this.container.querySelector('#auth-submit');
    const errorText = this.container.querySelector('#auth-error');
    const registerFields = this.container.querySelector('#register-fields');

    this.container.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.container.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        mode = e.target.dataset.tab;
        
        if (mode === 'register') {
          registerFields.style.display = 'flex';
          emailField.required = true;
          submitBtn.textContent = 'Create Account';
        } else {
          registerFields.style.display = 'none';
          emailField.required = false;
          submitBtn.textContent = 'Sign In';
        }
        errorText.textContent = '';
      });
    });

    this.container.querySelector('#sso-btn').addEventListener('click', () => {
      const code_verifier = 'test_verifier_' + Math.random().toString(36).substring(7);
      sessionStorage.setItem('pkce_code_verifier', code_verifier);
      const redirect_uri = window.location.origin + '/';
      const ssoUrl = `https://phryco.com/oauth/authorize?client_id=vortex3d&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code&code_challenge=${code_verifier}&code_challenge_method=plain`;
      window.location.href = ssoUrl;
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = 'Working...';
      errorText.textContent = '';

      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = {
        username: userField.value,
        password: passField.value
      };
      
      if (mode === 'register') {
        body.email = emailField.value;
      }

      try {
        const res = await fetch(`${getApiBaseUrl()}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        
        if (data.success) {
          localStorage.setItem('vortex3d_token', data.token);
          localStorage.setItem('vortex3d_user', JSON.stringify(data.user));
          window.location.href = '/?mode=discover'; // Go to games portal
        } else {
          errorText.textContent = data.error || 'Authentication failed';
        }
      } catch (err) {
        errorText.textContent = err.message;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = mode === 'login' ? 'Sign In' : 'Create Account';
      }
    });
  }
}
