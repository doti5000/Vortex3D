import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const CLIENT_ID = 'phryco_rHTNGFVGpzdw1Fs0wX5h';
  const AUTHORIZED_SSO_URL = 'https://autumn-credit-7767.forbusiness68-8-65-43.workers.dev/';

  if (req.method === 'GET') {
    // Return Phryco SSO Client Config
    return res.status(200).json({
      clientId: CLIENT_ID,
      ssoWorkerUrl: AUTHORIZED_SSO_URL,
      scopes: ['profile', 'email', 'avatar'],
      phrycoApiUrl: 'http://127.0.0.1:8000/api/sso'
    });
  }

  if (req.method === 'POST') {
    const { code, code_verifier } = req.body || {};
    
    // Simulate PKCE token exchange & Phryco user profile fetch
    const userId = 'usr_phryco_' + crypto.randomBytes(4).toString('hex');
    const token = 'tok_phryco_sso_' + crypto.randomBytes(12).toString('hex');

    return res.status(200).json({
      success: true,
      token: token,
      user: {
        id: userId,
        username: 'PhrycoMember_' + userId.substring(11),
        email: `member_${userId.substring(11)}@phryco.com`,
        provider: 'Phryco LLC SSO',
        clientId: CLIENT_ID
      }
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
