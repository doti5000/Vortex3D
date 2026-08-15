import crypto from 'crypto';
import { initDb, upsertPhrycoUser, createSession } from '../../../server/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await initDb();
    
    const { code, code_verifier, redirect_uri } = req.body || {};
    if (!code || !code_verifier || !redirect_uri) {
      return res.status(400).json({ error: 'Missing PKCE parameters.' });
    }

    const tokenResponse = await fetch('https://autumn-credit-7767.forbusiness68-8-65-43.workers.dev/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: 'phryco_rHTNGFVGpzdw1Fs0wX5h',
        code,
        code_verifier,
        redirect_uri
      })
    });

    if (!tokenResponse.ok) return res.status(401).json({ error: 'Invalid authorization code.' });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const profileResponse = await fetch('https://autumn-credit-7767.forbusiness68-8-65-43.workers.dev/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!profileResponse.ok) return res.status(401).json({ error: 'Failed to fetch user profile.' });
    
    const profileData = await profileResponse.json();
    const localUser = await upsertPhrycoUser(profileData);

    const token = 'tok_' + crypto.randomBytes(16).toString('hex');

    await createSession({
      id: 'sess_' + crypto.randomBytes(8).toString('hex'),
      userId: localUser.id,
      token,
      tunnelUrl: null
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: localUser.id,
        username: localUser.username,
        skinColors: localUser.skin_colors || localUser.skinColors || {},
        hatType: localUser.hat_type || localUser.hatType || 'fedora',
        phrybucks: localUser.phrybucks
      }
    });

  } catch (err) {
    return res.status(500).json({ error: 'Failed to authenticate via SSO.' });
  }
}
