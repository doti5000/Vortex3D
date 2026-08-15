import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'colyseus';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDb, createUser, findUserByUsername, findUserById, saveGame, getGames, createSession } from './db.js';
import { VortexRoom } from './rooms/VortexRoom.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// In-Memory Token Session Cache
const activeSessions = new Map(); // token -> userId

// Initialize Database Schema
initDb();

// -------------------------
// REST API Endpoints
// -------------------------

// 1. Account Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, skinColors, hatType } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, Email, and Password are required.' });
    }

    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = 'usr_' + crypto.randomBytes(8).toString('hex');

    const newUser = await createUser({
      id: userId,
      username,
      email,
      passwordHash,
      skinColors: skinColors || {},
      hatType: hatType || 'fedora'
    });

    const token = 'tok_' + crypto.randomBytes(16).toString('hex');
    activeSessions.set(token, userId);

    await createSession({
      id: 'sess_' + crypto.randomBytes(8).toString('hex'),
      userId,
      token,
      tunnelUrl: null
    });

    res.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        skinColors: newUser.skinColors || skinColors,
        hatType: newUser.hatType || hatType
      }
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ error: 'Failed to register account.' });
  }
});

// 2. Account Sign In
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
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
    activeSessions.set(token, user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        skinColors: user.skin_colors || user.skinColors,
        hatType: user.hat_type || user.hatType
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Failed to authenticate user.' });
  }
});

// 3. Current User Profile (/api/auth/me)
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization token provided.' });

    const token = authHeader.replace('Bearer ', '');
    const userId = activeSessions.get(token);
    if (!userId) return res.status(401).json({ error: 'Session expired or invalid.' });

    const user = await findUserById(userId);
    if (!user) return res.status(404).json({ error: 'User profile not found.' });

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      skinColors: user.skin_colors || user.skinColors,
      hatType: user.hat_type || user.hatType
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user session.' });
  }
});

// 4. Fetch Real Games List
app.get('/api/games', async (req, res) => {
  try {
    const games = await getGames();
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load games list.' });
  }
});

// 5. Publish Game Endpoint
app.post('/api/games/publish', async (req, res) => {
  try {
    const { title, description, sceneData, thumbnailUrl, tunnelUrl, userId } = req.body;
    if (!title) return res.status(400).json({ error: 'Game title is required.' });

    const gameId = 'game_' + crypto.randomBytes(8).toString('hex');
    const newGame = {
      id: gameId,
      userId: userId || 'usr_guest',
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
    res.json({ success: true, game: saved });
  } catch (err) {
    console.error('Publish Error:', err);
    res.status(500).json({ error: 'Failed to publish game.' });
  }
});

// 6. Cloudflare Tunnel Session Metadata
app.get('/api/tunnel/session', (req, res) => {
  const tunnelPath = path.join(__dirname, '..', '.storage', 'tunnel-session.json');
  if (fs.existsSync(tunnelPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(tunnelPath, 'utf8'));
      return res.json(data);
    } catch (e) {}
  }
  res.json({ active: false, tunnelUrl: null });
});

// -------------------------
// Colyseus Multiplayer Server
// -------------------------

const server = http.createServer(app);
const gameServer = new Server({
  server: server
});

// Register the Room
gameServer.define("vortex_room", VortexRoom);

server.listen(PORT, () => {
  console.log(`🚀 Vortex3D Server & WebSocket Engine listening on port ${PORT}`);
});
