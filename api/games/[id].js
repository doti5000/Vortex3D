import { initDb, deleteGame, findSessionByToken } from '../../server/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await initDb();
    
    if (req.method === 'DELETE') {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'You must be logged in to delete games.' });

      const token = authHeader.replace('Bearer ', '');
      const session = await findSessionByToken(token);
      if (!session) return res.status(401).json({ error: 'Session expired or invalid.' });

      const gameId = req.query.id;
      if (!gameId) return res.status(400).json({ error: 'Game ID is required.' });

      const userId = session.userId || session.user_id;
      const success = await deleteGame(gameId, userId);
      
      if (success) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(404).json({ error: 'Game not found or unauthorized.' });
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed.' });
    }
  } catch (e) {
    console.error('API /games/[id] Error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
