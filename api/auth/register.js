import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { initDb, createUser, createSession } from '../../server/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await initDb();
    
    const { username, password, skinColors, hatType } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
    const token = 'tok_' + crypto.randomBytes(16).toString('hex');

    const newUser = await createUser({
      id: userId,
      username,
      passwordHash,
      skinColors: skinColors || {},
      hatType: hatType || 'fedora'
    });

    await createSession({
      id: 'sess_' + crypto.randomBytes(8).toString('hex'),
      userId,
      token,
      tunnelUrl: null
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        skinColors: newUser.skinColors || skinColors,
        hatType: newUser.hatType || hatType
      }
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to register account.' });
  }
}
