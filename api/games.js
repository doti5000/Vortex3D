import crypto from 'crypto';
import { initDb, getGames, saveGame, findSessionByToken } from '../server/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await initDb();
    
    if (req.method === 'GET') {
      const games = await getGames();
      return res.status(200).json(games);
    }

    if (req.method === 'POST') {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'You must be logged in to publish games.' });

      const token = authHeader.replace('Bearer ', '');
      const session = await findSessionByToken(token);
      if (!session) return res.status(401).json({ error: 'Session expired or invalid.' });

      const { id, title, description, sceneData, thumbnailUrl, tunnelUrl } = req.body || {};
      if (!title) return res.status(400).json({ error: 'Game title is required.' });

      const gameId = id || ('game_' + crypto.randomBytes(8).toString('hex'));
      const newGame = {
        id: gameId,
        userId: session.userId || session.user_id,
        title,
        description: description || 'User-created Vortex3D game',
        thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop',
        tunnelUrl: tunnelUrl || '',
        sceneData: sceneData || {},
        plays: 1,
        likes: 0,
        createdAt: new Date().toISOString()
      };

      const saved = await saveGame(newGame);
      return res.status(200).json({ success: true, game: saved });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
}
