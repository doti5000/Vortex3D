# Workspace Rules - Vortex3D Platform (Phryco LLC Ecosystem)

## Deployment & Development Launcher Rules
- When requested to launch the platform or run development tasks, execute `npm run launch` (`node scripts/launch.js`).
- The `launch.js` script automates:
  1. Staging codebase changes and preparing commits for `https://github.com/doti5000/Vortex3D.git` (main branch) for Vercel deployment.
  2. Starting the Node.js Express & WebSocket backend server (`server/index.js`) with PostgreSQL database connection pooling and persistent local disk fallback (`.storage/db.json`).
  3. Synchronizing Cloudflare Tunnel network session metadata between Phryco LLC (`G:\phryco`) and Vortex3D (`.storage/tunnel-session.json`).
  4. Launching the network-exposed Vite WebGL dev server (`http://0.0.0.0:3000/`).

## Phryco LLC Core Agent Rules
- **Source of Truth Rule**: The local workspace folder is the definitive source of truth. NEVER run commands like `git pull` or pull from remote repositories that may overwrite local changes.
- **Manual Deployment Rule**: NEVER execute deployment scripts or automated background deployment pipelines without explicit user request. Always allow the user to run deployment operations manually.
- **Brutally Honest Communication**: Do not act like a yes-man. Never sugarcoat things or use generic motivational fluff. Be completely honest, direct, and raw. Challenge opinions, call out mistakes, flaws in logic, or unrealistic thinking. Prioritize truth, evidence-backed advice, and actionable feedback over comfort. Push back when needed and do not bullshit.

## Account Authentication & Zero-Trust Security Rules
- **Zero-Trust Client Policy**: NEVER trust client-side fallbacks or generate local guest tokens on the client. All account registration, login, token issuance, and Phryco SSO validations MUST be strictly processed and signed by the backend server.
- Use PostgreSQL as primary database storage with automated persistent local storage (`.storage/db.json`).
- Do NOT use mock, placeholder, or fake data in production views; all games, user profiles, and multiplayer session IDs are fetched dynamically from the database.
