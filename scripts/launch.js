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

const PHRYCO_ROOT = 'G:\\phryco';
const PHRYCO_CLOUDFLARED_BIN = path.join(PHRYCO_ROOT, 'cloudflared.exe');
const PHRYCO_CF_LOG = path.join(PHRYCO_ROOT, 'cf.log');
const VERCEL_PRODUCTION_DOMAIN = 'https://vortex3d.vercel.app/';

if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

console.log('----------------------------------------------------');
console.log('🚀 Vortex3D & Phryco LLC Linked Master Launcher');
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

// 0. Pre-flight Process Tree Cleanup
console.log('🧹 Step 0: Pre-flight process cleanup on ports 3000 & 3001...');
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

console.log('✅ Ports 3000 & 3001 cleared.');

// 1. Sync & Push Codebase to GitHub (doti5000/Vortex3D.git) for Vercel Deployment
console.log('\n📦 Step 1: Staging & pushing codebase to GitHub for Vercel deployment (https://vortex3d.vercel.app/)...');
try {
  execSync('git add .', { cwd: projectRoot, stdio: 'ignore' });
  try {
    execSync('git commit -m "Expose Vite dev server on all network interfaces (0.0.0.0:3000)"', { cwd: projectRoot, stdio: 'ignore' });
  } catch (e) {}
  
  execSync('git branch -M main', { cwd: projectRoot, stdio: 'ignore' });
  try {
    execSync('git push -u origin main', { cwd: projectRoot, stdio: 'inherit' });
    console.log(`✅ Successfully pushed to GitHub. Vercel active at: ${VERCEL_PRODUCTION_DOMAIN}`);
  } catch (pushErr) {
    console.warn('⚠️ Push warning (local server continuing):', pushErr.message);
  }
} catch (err) {
  console.warn('⚠️ Git commit step warning:', err.message);
}

// 2. Start Backend Express & WebSocket Server (Port 3001)
console.log('\n🗄️ Step 2: Starting Node.js Express & WebSocket Backend Server (Port 3001)...');
const serverProcess = spawn('node', ['server/index.js'], { cwd: projectRoot, stdio: 'inherit' });

// 3. Automated Cloudflare Tunnel Synchronization between Phryco & Vortex3D
console.log('\n🌐 Step 3: Synchronizing Cloudflare Tunnel Network URL...');
let tunnelUrl = null;

if (fs.existsSync(PHRYCO_CF_LOG)) {
  try {
    const phrycoLogContent = fs.readFileSync(PHRYCO_CF_LOG, 'utf8');
    const match = phrycoLogContent.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match) {
      tunnelUrl = match[0];
      console.log(`   🔗 Linked with active Phryco Cloudflare Tunnel: ${tunnelUrl}`);
    }
  } catch (e) {}
}

let tunnelProcess = null;

if (!tunnelUrl) {
  tunnelUrl = `https://vortex3d-live-${Math.random().toString(36).substring(2, 7)}.trycloudflare.com`;

  const usePhrycoBin = fs.existsSync(PHRYCO_CLOUDFLARED_BIN);
  const tunnelCmd = usePhrycoBin ? PHRYCO_CLOUDFLARED_BIN : 'npx';
  const tunnelArgs = usePhrycoBin ? ['tunnel', '--url', 'http://localhost:3001'] : ['cloudflared', 'tunnel', '--url', 'http://localhost:3001'];

  if (usePhrycoBin) {
    console.log(`   ⚡ Spawning native Phryco Cloudflare binary: ${PHRYCO_CLOUDFLARED_BIN}`);
  } else {
    console.log(`   🌐 Spawning npx cloudflared fallback...`);
  }

  tunnelProcess = spawn(tunnelCmd, tunnelArgs, { cwd: projectRoot, shell: true });

  const onTunnelData = (data) => {
    const str = data.toString();
    const match = str.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match) {
      tunnelUrl = match[0];
      console.log(`\n🎉 Established Linked Tunnel URL: ${tunnelUrl}`);
      updateAllProjectFiles(tunnelUrl);
    }
  };

  tunnelProcess.stdout.on('data', onTunnelData);
  tunnelProcess.stderr.on('data', onTunnelData);
}

function updateAllProjectFiles(url) {
  const sessionData = {
    active: true,
    productionDomain: VERCEL_PRODUCTION_DOMAIN,
    tunnelUrl: url,
    sessionToken: 'sess_cf_' + Math.random().toString(36).substring(2, 10),
    createdAt: new Date().toISOString(),
    pids: {
      serverPid: serverProcess.pid,
      tunnelPid: tunnelProcess ? tunnelProcess.pid : null
    }
  };

  fs.writeFileSync(tunnelSessionFile, JSON.stringify(sessionData, null, 2));
  fs.writeFileSync(pidsFile, JSON.stringify({
    serverPid: serverProcess.pid,
    tunnelPid: tunnelProcess ? tunnelProcess.pid : null
  }, null, 2));

  try {
    fs.writeFileSync(PHRYCO_CF_LOG, `[Vortex3D-Linked] Active Cloudflare Tunnel: ${url}\nDate: ${new Date().toISOString()}`);
  } catch (e) {}

  const filesToSync = [
    path.join(PHRYCO_ROOT, 'example_sso_client', 'index.html'),
    path.join(PHRYCO_ROOT, 'frontend', 'js', 'utils', 'config.js'),
    path.join(projectRoot, 'api', 'tunnel', 'session.js'),
    path.join(projectRoot, 'api', 'games.js'),
    path.join(projectRoot, 'src', 'ui', 'Components', 'AuthModal.js')
  ];

  for (const f of filesToSync) {
    if (fs.existsSync(f)) {
      try {
        const content = fs.readFileSync(f, 'utf8');
        const updated = content.replace(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/g, url);
        if (updated !== content) {
          fs.writeFileSync(f, updated, 'utf8');
          console.log(`   ✅ Synchronized ${path.basename(f)} with dynamic tunnel URL: ${url}`);
        }
      } catch (e) {}
    }
  }
}

updateAllProjectFiles(tunnelUrl);

// 4. Launch Vite WebGL Dev Server (Exposed on 0.0.0.0:3000)
console.log('\n⚡ Step 4: Launching Network-Exposed Vite Dev Server (http://0.0.0.0:3000/)...');
const viteProcess = spawn('npx', ['vite', '--host', '0.0.0.0'], { cwd: projectRoot, stdio: 'inherit', shell: true });

setTimeout(() => {
  fs.writeFileSync(pidsFile, JSON.stringify({
    serverPid: serverProcess.pid,
    tunnelPid: tunnelProcess ? tunnelProcess.pid : null,
    vitePid: viteProcess.pid
  }, null, 2));
}, 1500);

process.on('SIGINT', () => {
  console.log('\nShutting down Vortex3D & Phryco processes...');
  try { serverProcess.kill(); } catch (e) {}
  if (tunnelProcess) { try { tunnelProcess.kill(); } catch (e) {} }
  try { viteProcess.kill(); } catch (e) {}
  process.exit();
});
