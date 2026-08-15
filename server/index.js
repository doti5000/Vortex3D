import express from 'express';
import cors from 'cors';
import http from 'http';
import colyseus from 'colyseus';
const { Server, matchMaker } = colyseus;
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDb, createUser, findUserByUsername, findUserById, saveGame, getGames, getGamesByUserId, deleteGame, createSession, findSessionByToken, upsertPhrycoUser, saveUser } from './db.js';
import { VortexRoom } from './rooms/VortexRoom.js';

// Patch removed because we upgraded colyseus.js to v0.17.2 on the client.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));

import { SHOP_ASSETS, getAssetById } from './assets.js';


// In-Memory Token Session Cache removed in favor of findSessionByToken from DB

// Initialize Database Schema
initDb();

// -------------------------
// REST API Endpoints
// -------------------------

// 1. Account Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, skinColors, hatType } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and Password are required.' });
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
      passwordHash,
      skinColors: skinColors || {},
      hatType: hatType || 'fedora'
    });

    const token = 'tok_' + crypto.randomBytes(16).toString('hex');

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

    await createSession({
      id: 'sess_' + crypto.randomBytes(8).toString('hex'),
      userId: user.id,
      token,
      tunnelUrl: null
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        skinColors: user.skin_colors || user.skinColors,
        hatType: user.hat_type || user.hatType,
        vorbucks: user.vorbucks,
        inventory: typeof user.inventory === 'string' ? JSON.parse(user.inventory) : user.inventory,
        equipped: typeof user.equipped === 'string' ? JSON.parse(user.equipped) : user.equipped
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
    const sessionInfo = await findSessionByToken(token);
    const userId = sessionInfo ? sessionInfo.userId : null;
    if (!userId) return res.status(401).json({ error: 'Session expired or invalid.' });

    const user = await findUserById(userId);
    if (!user) return res.status(404).json({ error: 'User profile not found.' });

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      skinColors: user.skin_colors || user.skinColors,
      hatType: user.hat_type || user.hatType,
      vorbucks: user.vorbucks,
      inventory: typeof user.inventory === 'string' ? JSON.parse(user.inventory) : user.inventory,
      equipped: typeof user.equipped === 'string' ? JSON.parse(user.equipped) : user.equipped
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user session.' });
  }
});

// 3.5. Phryco SSO Callback
app.post('/api/auth/sso/callback', async (req, res) => {
  try {
    const { code, code_verifier, redirect_uri } = req.body;
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

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error('SSO Token Error:', errText);
      return res.status(401).json({ error: 'Invalid authorization code.' });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const profileResponse = await fetch('https://autumn-credit-7767.forbusiness68-8-65-43.workers.dev/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!profileResponse.ok) {
      return res.status(401).json({ error: 'Failed to fetch user profile.' });
    }

    const profileData = await profileResponse.json();
    
    // Upsert local user
    const localUser = await upsertPhrycoUser(profileData);

    // Issue local token
    const token = 'tok_' + crypto.randomBytes(16).toString('hex');

    await createSession({
      id: 'sess_' + crypto.randomBytes(8).toString('hex'),
      userId: localUser.id,
      token,
      tunnelUrl: null
    });

    res.json({
      success: true,
      token,
      user: {
        id: localUser.id,
        username: localUser.username,
        email: localUser.email,
        skinColors: localUser.skin_colors || localUser.skinColors || {},
        hatType: localUser.hat_type || localUser.hatType || 'fedora',
        phrybucks: localUser.phrybucks
      }
    });

  } catch (err) {
    console.error('SSO Callback Error:', err);
    res.status(500).json({ error: 'Failed to authenticate via SSO.' });
  }
});

// 4. Shop & Avatar API
app.get('/api/shop/assets', (req, res) => {
  res.json(SHOP_ASSETS);
});

app.post('/api/shop/buy', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization token provided.' });

    const token = authHeader.replace('Bearer ', '');
    const sessionInfo = await findSessionByToken(token);
    if (!sessionInfo) return res.status(401).json({ error: 'Session expired or invalid.' });

    const user = await findUserById(sessionInfo.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const { assetId } = req.body;
    const asset = getAssetById(assetId);
    if (!asset) return res.status(404).json({ error: 'Asset not found.' });

    const inv = typeof user.inventory === 'string' ? JSON.parse(user.inventory) : user.inventory || [];
    if (inv.includes(assetId)) {
      return res.status(400).json({ error: 'You already own this asset.' });
    }

    if (user.vorbucks < asset.price) {
      return res.status(400).json({ error: 'Not enough Vorbucks.' });
    }

    user.vorbucks -= asset.price;
    inv.push(assetId);
    user.inventory = inv;
    
    await saveUser(user);
    res.json({ success: true, vorbucks: user.vorbucks, inventory: user.inventory });
  } catch (err) {
    res.status(500).json({ error: 'Failed to purchase item.' });
  }
});

app.post('/api/avatar/equip', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization token provided.' });

    const token = authHeader.replace('Bearer ', '');
    const sessionInfo = await findSessionByToken(token);
    if (!sessionInfo) return res.status(401).json({ error: 'Session expired or invalid.' });

    const user = await findUserById(sessionInfo.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const { assetId, type, unequip } = req.body;
    
    const inv = typeof user.inventory === 'string' ? JSON.parse(user.inventory) : user.inventory || [];
    const equipped = typeof user.equipped === 'string' ? JSON.parse(user.equipped) : user.equipped || {};

    if (!unequip && !inv.includes(assetId)) {
      return res.status(403).json({ error: 'You do not own this asset.' });
    }

    if (unequip) {
      delete equipped[type];
    } else {
      equipped[type] = assetId;
    }
    user.equipped = equipped;
    
    await saveUser(user);
    res.json({ success: true, equipped: user.equipped });
  } catch (err) {
    res.status(500).json({ error: 'Failed to equip item.' });
  }
});

// 5. Game Data (/api/games)
app.get('/api/games', async (req, res) => {
  try {
    const games = await getGames();
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load games list.' });
  }
});

// 4.5 Fetch User Games List
app.get('/api/games/my', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization token provided.' });

    const token = authHeader.replace('Bearer ', '');
    const sessionInfo = await findSessionByToken(token);
    const userId = sessionInfo ? sessionInfo.userId : null;
    if (!userId) return res.status(401).json({ error: 'Session expired or invalid.' });

    const games = await getGamesByUserId(userId);
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load user games.' });
  }
});

// 5. Publish Game Endpoint
app.post('/api/games/publish', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'You must be logged in to publish games.' });

    const token = authHeader.replace('Bearer ', '');
    const sessionInfo = await findSessionByToken(token);
    const userId = sessionInfo ? sessionInfo.userId : null;
    if (!userId) return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });

    const { id, title, description, sceneData, thumbnailUrl, tunnelUrl } = req.body;
    if (!title) return res.status(400).json({ error: 'Game title is required.' });

    const gameId = id || ('game_' + crypto.randomBytes(8).toString('hex'));
    const newGame = {
      id: gameId,
      userId: userId,
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

// 5.5 Delete Game Endpoint
app.delete('/api/games/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'You must be logged in to delete games.' });

    const token = authHeader.replace('Bearer ', '');
    const sessionInfo = await findSessionByToken(token);
    const userId = sessionInfo ? sessionInfo.userId : null;
    if (!userId) return res.status(401).json({ error: 'Session expired or invalid.' });

    const gameId = req.params.id;
    const success = await deleteGame(gameId, userId);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Game not found or unauthorized.' });
    }
  } catch (err) {
    console.error('Delete Error:', err);
    res.status(500).json({ error: 'Failed to delete game.' });
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
  server: server,
  cors: {
    origin: true,
    credentials: true
  }
});

// Register the Room and filter by gameId
const roomType = gameServer.define("vortex_room", VortexRoom).filterBy(['gameId']);
console.log("Room defined in Colyseus:", !!roomType);

gameServer.listen(PORT, () => {
  console.log(`🚀 Vortex3D Server & WebSocket Engine listening on port ${PORT}`);
});
