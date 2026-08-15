import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { initDb, findUserByUsername, createSession } from '../../server/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await initDb();

    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash || user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = 'tok_' + crypto.randomBytes(16).toString('hex');
    
    await createSession({
      id: 'sess_' + crypto.randomBytes(8).toString('hex'),
      userId: user.id,
      token,
      tunnelUrl: null
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        skinColors: user.skin_colors || user.skinColors,
        hatType: user.hat_type || user.hatType
      }
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to authenticate.' });
  }
}
