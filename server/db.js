import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageDir = path.join(__dirname, '..', '.storage');
const diskDbPath = path.join(storageDir, 'db.json');

// Ensure local disk storage folder exists
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// Local disk fallback database structure
function getDiskDb() {
  if (!fs.existsSync(diskDbPath)) {
    const initialDb = { users: [], games: [], sessions: [] };
    fs.writeFileSync(diskDbPath, JSON.stringify(initialDb, null, 2));
    return initialDb;
  }
  try {
    const content = fs.readFileSync(diskDbPath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return { users: [], games: [], sessions: [] };
  }
}

function saveDiskDb(data) {
  try {
    fs.writeFileSync(diskDbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    if (err.code !== 'EROFS') {
      console.warn('Failed to save local disk db:', err.message);
    }
  }
}

// PostgreSQL Connection Pool Configuration
const connectionString = process.env.DATABASE_URL || process.env.PGURI;
let pool = null;
let usePostgres = false;

if (connectionString || process.env.PGHOST) {
  try {
    pool = new Pool({
      connectionString: connectionString || undefined,
      host: process.env.PGHOST,
      port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
    });
    usePostgres = true;
    console.log('PostgreSQL Connection Pool initialized.');
  } catch (err) {
    console.warn('PostgreSQL pool creation warning, defaulting to local disk storage:', err.message);
    usePostgres = false;
  }
} else {
  console.log('No PostgreSQL connection string found. Operating with persistent local disk storage (.storage/db.json).');
}

// Initialize Tables on Startup
export async function initDb() {
  if (usePostgres && pool) {
    try {
      const client = await pool.connect();
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          username VARCHAR(64) UNIQUE NOT NULL,
          email VARCHAR(128) UNIQUE NOT NULL,
          password_hash VARCHAR(256) NOT NULL,
          skin_colors JSONB,
          hat_type VARCHAR(64),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS games (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) REFERENCES users(id),
          title VARCHAR(128) NOT NULL,
          description TEXT,
          thumbnail_url TEXT,
          tunnel_url TEXT,
          scene_data JSONB,
          plays INT DEFAULT 0,
          likes INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sessions (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) REFERENCES users(id),
          session_token VARCHAR(256) NOT NULL,
          tunnel_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      try {
        await client.query('ALTER TABLE users ADD COLUMN phryco_id VARCHAR(64) UNIQUE');
      } catch(e) {}
      
      try {
        await client.query('ALTER TABLE users ADD COLUMN vorbucks INT DEFAULT 500');
      } catch(e) {}
      
      try {
        // Just in case we need to migrate existing phrybucks
        await client.query('UPDATE users SET vorbucks = phrybucks WHERE phrybucks IS NOT NULL');
      } catch(e) {}

      try {
        await client.query('ALTER TABLE users ADD COLUMN inventory JSONB DEFAULT \'[]\'');
      } catch(e) {}

      try {
        await client.query('ALTER TABLE users ADD COLUMN equipped JSONB DEFAULT \'{}\'');
      } catch(e) {}

      try {
        await client.query('ALTER TABLE users ALTER COLUMN email DROP NOT NULL');
      } catch(e) {}
      try {
        await client.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key');
      } catch(e) {}
      client.release();
      console.log('PostgreSQL Database Schema initialized successfully.');
    } catch (err) {
      console.warn('Failed PostgreSQL query execution, falling back to local disk storage:', err.message);
      usePostgres = false;
    }
  }
}

// User Operations
export async function createUser(user) {
  if (usePostgres && pool) {
    try {
      const res = await pool.query(
        `INSERT INTO users (id, username, password_hash, skin_colors, hat_type, vorbucks, inventory, equipped)
         VALUES ($1, $2, $3, $4, $5, 500, '[]', '{}') RETURNING id, username, skin_colors, hat_type, created_at, vorbucks, inventory, equipped`,
        [user.id, user.username, user.passwordHash, JSON.stringify(user.skinColors || {}), user.hatType || 'fedora']
      );
      return res.rows[0];
    } catch (err) {
      throw err;
    }
  }

  const db = getDiskDb();
  const newUser = {
    ...user,
    vorbucks: 500,
    inventory: [],
    equipped: {},
    created_at: new Date().toISOString()
  };
  db.users.push(newUser);
  saveDiskDb(db);
  return { id: user.id, username: user.username, skinColors: user.skinColors, hatType: user.hatType, vorbucks: 500, inventory: [], equipped: {} };
}

export async function findUserByUsername(username) {
  if (usePostgres && pool) {
    try {
      const res = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
      if (res.rows.length > 0) return res.rows[0];
    } catch (err) {
      throw err;
    }
  }

  const db = getDiskDb();
  let user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (user) {
    if (user.vorbucks === undefined) user.vorbucks = 500;
    if (!user.inventory) user.inventory = [];
    if (!user.equipped) user.equipped = {};
  }
  return user || null;
}

export async function findUserById(id) {
  if (usePostgres && pool) {
    try {
      const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (res.rows.length > 0) return res.rows[0];
    } catch (err) {
      throw err;
    }
  }

  const db = getDiskDb();
  let user = db.users.find(u => u.id === id);
  if (user) {
    if (user.vorbucks === undefined) user.vorbucks = 500;
    if (!user.inventory) user.inventory = [];
    if (!user.equipped) user.equipped = {};
  }
  return user || null;
}

export async function upsertPhrycoUser(profile) {
  const phrycoId = profile.id;
  
  if (usePostgres && pool) {
    try {
      const res = await pool.query('SELECT * FROM users WHERE phryco_id = $1', [phrycoId]);
      if (res.rows.length > 0) {
        return res.rows[0];
      }
      
      const emailRes = await pool.query('SELECT * FROM users WHERE email = $1', [profile.email]);
      if (emailRes.rows.length > 0) {
        const updated = await pool.query(
          'UPDATE users SET phryco_id = $1 WHERE email = $2 RETURNING *',
          [phrycoId, profile.email]
        );
        return updated.rows[0];
      }
      
      const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
      const newUser = await pool.query(
        `INSERT INTO users (id, username, email, password_hash, phryco_id, vorbucks, inventory, equipped)
         VALUES ($1, $2, $3, $4, $5, 500, '[]', '{}') RETURNING *`,
        [userId, profile.username, profile.email, 'sso_user', phrycoId]
      );
      return newUser.rows[0];
    } catch (err) {
      throw err;
    }
  }

  const db = getDiskDb();
  let user = db.users.find(u => u.phryco_id === phrycoId) || db.users.find(u => u.email === profile.email);
  if (user) {
    user.phryco_id = phrycoId;
    user.username = profile.username;
    
    let updated = true;
    if (user.vorbucks === undefined) { user.vorbucks = 500; }
    if (!user.inventory) { user.inventory = []; }
    if (!user.equipped) { user.equipped = {}; }
  } else {
    user = {
      id: 'usr_' + crypto.randomBytes(8).toString('hex'),
      username: profile.username,
      email: profile.email,
      passwordHash: 'sso_user',
      phryco_id: phrycoId,
      vorbucks: 500,
      inventory: [],
      equipped: {},
      created_at: new Date().toISOString()
    };
    db.users.push(user);
  }
  saveDiskDb(db);
  return user;
}

// Games Operations
export async function saveGame(game) {
  if (usePostgres && pool) {
    try {
      const res = await pool.query(
        `INSERT INTO games (id, user_id, title, description, thumbnail_url, tunnel_url, scene_data, plays, likes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, tunnel_url = EXCLUDED.tunnel_url, scene_data = EXCLUDED.scene_data
         RETURNING *`,
        [game.id, game.userId, game.title, game.description, game.thumbnailUrl, game.tunnelUrl, JSON.stringify(game.sceneData || {}), game.plays || 0, game.likes || 0]
      );
      return res.rows[0];
    } catch (err) {
      console.warn('PG saveGame error, saving to disk fallback:', err.message);
    }
  }

  const disk = getDiskDb();
  const idx = disk.games.findIndex(g => g.id === game.id);
  if (idx >= 0) {
    disk.games[idx] = game;
  } else {
    disk.games.push(game);
  }
  saveDiskDb(disk);
  return game;
}

export async function deleteGame(gameId, userId) {
  if (usePostgres && pool) {
    try {
      const res = await pool.query('DELETE FROM games WHERE id = $1 AND user_id = $2 RETURNING id', [gameId, userId]);
      return res.rowCount > 0;
    } catch (err) {
      console.warn('PG deleteGame error:', err.message);
    }
  }

  const disk = getDiskDb();
  const initialLength = disk.games.length;
  disk.games = disk.games.filter(g => !(g.id === gameId && (g.userId === userId || g.user_id === userId)));
  if (disk.games.length < initialLength) {
    saveDiskDb(disk);
    return true;
  }
  return false;
}

export async function getGames() {
  if (usePostgres && pool) {
    try {
      const res = await pool.query(`
        SELECT g.*, u.username as creator_name
        FROM games g
        LEFT JOIN users u ON g.user_id = u.id
        ORDER BY g.created_at DESC
      `);
      return res.rows;
    } catch (err) {
      console.warn('PG getGames error:', err.message);
    }
  }

  const disk = getDiskDb();
  return disk.games.map(g => {
    const u = disk.users.find(user => user.id === g.userId || user.id === g.user_id);
    return { ...g, creator_name: u ? u.username : 'Unknown' };
  });
}

export async function getGamesByUserId(userId) {
  if (usePostgres && pool) {
    try {
      const res = await pool.query(`
        SELECT g.*, u.username as creator_name
        FROM games g
        LEFT JOIN users u ON g.user_id = u.id
        WHERE g.user_id = $1
        ORDER BY g.created_at DESC
      `, [userId]);
      return res.rows;
    } catch (err) {
      console.warn('PG getGamesByUserId error:', err.message);
    }
  }

  const disk = getDiskDb();
  return disk.games.filter(g => g.userId === userId || g.user_id === userId).map(g => {
    const u = disk.users.find(user => user.id === g.userId || user.id === g.user_id);
    return { ...g, creator_name: u ? u.username : 'Unknown' };
  });
}

// Session Tracking
export async function createSession(session) {
  if (usePostgres && pool) {
    try {
      await pool.query(
        `INSERT INTO sessions (id, user_id, session_token, tunnel_url) VALUES ($1, $2, $3, $4)`,
        [session.id, session.userId, session.token, session.tunnelUrl]
      );
    } catch (err) {
      console.warn('PG createSession error:', err.message);
    }
  }

  const disk = getDiskDb();
  disk.sessions.push(session);
  saveDiskDb(disk);
}

export async function findSessionByToken(token) {
  if (usePostgres && pool) {
    try {
      const res = await pool.query('SELECT * FROM sessions WHERE session_token = $1', [token]);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return { id: row.id, userId: row.user_id, token: row.session_token, tunnelUrl: row.tunnel_url };
      }
    } catch (err) {
      console.warn('PG findSessionByToken error:', err.message);
    }
  }

  const disk = getDiskDb();
  return disk.sessions.find(s => s.token === token) || null;
}

export async function saveUser(user) {
  if (usePostgres && pool) {
    try {
      await pool.query(
        'UPDATE users SET vorbucks = $1, inventory = $2, equipped = $3 WHERE id = $4',
        [user.vorbucks, JSON.stringify(user.inventory), JSON.stringify(user.equipped), user.id]
      );
    } catch (err) {
      throw err;
    }
  } else {
    const db = getDiskDb();
    const idx = db.users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      db.users[idx] = user;
      saveDiskDb(db);
    }
  }
}
