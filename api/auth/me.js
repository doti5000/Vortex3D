import { initDb, findSessionByToken, findUserById } from '../../server/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await initDb();
    
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization token provided.' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const session = await findSessionByToken(token);
    if (!session) return res.status(401).json({ error: 'Session expired or invalid.' });
    
    const user = await findUserById(session.userId || session.user_id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    return res.status(200).json({
      id: user.id,
      username: user.username,
      skinColors: user.skin_colors || user.skinColors,
      hatType: user.hat_type || user.hatType
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to authenticate session.' });
  }
}
