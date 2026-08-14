# Workspace Rules - Vortex3D Platform

## Deployment & Development Launcher Rule
- When requested to launch the platform or run development tasks, execute `npm run launch` (`node scripts/launch.js`).
- The `launch.js` script automates:
  1. Auto-committing and pushing latest codebase changes to `https://github.com/doti5000/Vortex3D.git` (main branch) for continuous Vercel deployment.
  2. Starting the Node.js Express & WebSocket backend server (`server/index.js`) with PostgreSQL database connection pooling and persistent local disk fallback (`.storage/db.json`).
  3. Starting the Cloudflare Tunnel network process, writing active session and tunnel metadata into local disk storage (`.storage/tunnel-session.json`).
  4. Launching the Vite WebGL dev server (`http://localhost:3000/`).

## Account Authentication & Data Rules
- Require account registration and login for publishing games and managing avatar assets.
- Use PostgreSQL as primary storage with automated local disk fallback (`.storage/db.json`).
- Do NOT use mock, placeholder, or fake data in production views; all games, user profiles, and multiplayer session IDs are fetched dynamically from the database.
