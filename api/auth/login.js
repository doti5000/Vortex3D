import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const userId = 'usr_' + crypto.randomBytes(6).toString('hex');
  const token = 'tok_' + crypto.randomBytes(12).toString('hex');

  return res.status(200).json({
    success: true,
    token,
    user: {
      id: userId,
      username,
      email: `${username}@vortex3d.vercel.app`
    }
  });
}
