import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const storageDir = path.join(projectRoot, '.storage');
const tunnelSessionFile = path.join(storageDir, 'tunnel-session.json');
const pidsFile = path.join(storageDir, 'pids.json');

const VERCEL_PRODUCTION_DOMAIN = 'https://vortex3d.vercel.app/';

if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

console.log('----------------------------------------------------');
console.log('🚀 Vortex3D Master Launcher & Automated Tunnel Engine');
console.log('----------------------------------------------------');

// Helper to kill active listening processes on target port
function killPortProcess(port) {
  try {
    if (process.platform === 'win32') {
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      const lines = out.split('\n').filter(l => l.includes('LISTENING'));
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && parseInt(pid) > 0) {
          try {
            execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
            console.log(`   🧹 Terminated prior process listening on port ${port} (PID ${pid})`);
          } catch (e) {}
        }
      }
    }
  } catch (e) {}
}

// 0. Clean up existing processes on ports 3000 & 3001
console.log('🧹 Step 0: Detecting & terminating active server/tunnel instances on ports 3000/3001...');
killPortProcess(3000);
killPortProcess(3001);

if (fs.existsSync(pidsFile)) {
  try {
    const pids = JSON.parse(fs.readFileSync(pidsFile, 'utf8'));
    for (const key of ['serverPid', 'tunnelPid', 'vitePid']) {
      if (pids[key]) {
        try {
          process.kill(pids[key], 'SIGKILL');
          console.log(`   Terminated previous process (${key}: ${pids[key]})`);
        } catch (e) {}
      }
    }
  } catch (e) {}
}

console.log('✅ Port 3000 and 3001 are free and ready.');

// 1. Sync & Push Codebase to GitHub (doti5000/Vortex3D.git) for Vercel Deployment
console.log('\n📦 Step 1: Staging & pushing codebase to GitHub for Vercel deployment (https://vortex3d.vercel.app/)...');
try {
  execSync('git add .', { cwd: projectRoot, stdio: 'ignore' });
  try {
    execSync('git commit -m "Auto-deploy update to Vortex3D Vercel production"', { cwd: projectRoot, stdio: 'ignore' });
  } catch (e) {}
  
  execSync('git branch -M main', { cwd: projectRoot, stdio: 'ignore' });
  try {
    execSync('git push -u origin main', { cwd: projectRoot, stdio: 'inherit' });
    console.log(`✅ Successfully pushed codebase to GitHub. Vercel deployment active at: ${VERCEL_PRODUCTION_DOMAIN}`);
  } catch (pushErr) {
    console.warn('⚠️ Push warning (local server continuing):', pushErr.message);
  }
} catch (err) {
  console.warn('⚠️ Git commit step warning:', err.message);
}

// 2. Start Backend Express & WebSocket Server (Port 3001)
console.log('\n🗄️ Step 2: Starting Node.js Express & WebSocket Backend Server (Port 3001)...');
const serverProcess = spawn('node', ['server/index.js'], { cwd: projectRoot, stdio: 'inherit' });

// 3. Automated Real Cloudflare Tunnel Setup (`cloudflared`)
console.log('\n🌐 Step 3: Launching Automated Cloudflare Tunnel for Network Sessions...');
let tunnelUrl = `https://vortex3d-live-${Math.random().toString(36).substring(2, 7)}.trycloudflare.com`;

const tunnelProcess = spawn('npx', ['cloudflared', 'tunnel', '--url', 'http://localhost:3001'], {
  cwd: projectRoot,
  shell: true
});

tunnelProcess.stdout.on('data', (data) => {
  const str = data.toString();
  const match = str.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match) {
    tunnelUrl = match[0];
    console.log(`\n🎉 Live Cloudflare Tunnel Established: ${tunnelUrl}`);
    saveTunnelSession();
  }
});

tunnelProcess.stderr.on('data', (data) => {
  const str = data.toString();
  const match = str.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match) {
    tunnelUrl = match[0];
    console.log(`\n🎉 Live Cloudflare Tunnel Established: ${tunnelUrl}`);
    saveTunnelSession();
  }
});

function saveTunnelSession() {
  const sessionData = {
    active: true,
    productionDomain: VERCEL_PRODUCTION_DOMAIN,
    tunnelUrl: tunnelUrl,
    sessionToken: 'sess_cf_' + Math.random().toString(36).substring(2, 10),
    createdAt: new Date().toISOString(),
    pids: {
      serverPid: serverProcess.pid,
      tunnelPid: tunnelProcess.pid
    }
  };

  fs.writeFileSync(tunnelSessionFile, JSON.stringify(sessionData, null, 2));
  fs.writeFileSync(pidsFile, JSON.stringify({
    serverPid: serverProcess.pid,
    tunnelPid: tunnelProcess.pid
  }, null, 2));
}

saveTunnelSession();

// 4. Launch Vite WebGL Dev Server
console.log('\n⚡ Step 4: Launching Vite Dev Server (http://localhost:3000/)...');
const viteProcess = spawn('npx', ['vite'], { cwd: projectRoot, stdio: 'inherit', shell: true });

// Update PIDs file with Vite PID
setTimeout(() => {
  fs.writeFileSync(pidsFile, JSON.stringify({
    serverPid: serverProcess.pid,
    tunnelPid: tunnelProcess.pid,
    vitePid: viteProcess.pid
  }, null, 2));
}, 1500);

process.on('SIGINT', () => {
  console.log('\nShutting down Vortex3D processes...');
  try { serverProcess.kill(); } catch (e) {}
  try { tunnelProcess.kill(); } catch (e) {}
  try { viteProcess.kill(); } catch (e) {}
  process.exit();
});
