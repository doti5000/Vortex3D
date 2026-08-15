import { initDb, getGamesByUserId, findSessionByToken } from '../../server/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await initDb();

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization token provided.' });

    const token = authHeader.replace('Bearer ', '');
    const session = await findSessionByToken(token);
    if (!session) return res.status(401).json({ error: 'Session expired or invalid.' });

    const games = await getGamesByUserId(session.userId || session.user_id);
    return res.status(200).json(games);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load user games.' });
  }
}
