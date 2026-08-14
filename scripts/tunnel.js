// Cloudflare Tunnel Launcher for Vortex3D Studio
import { spawn } from 'child_process';

console.log('--------------------------------------------------');
console.log('🚀 Launching Cloudflare Tunnel for Vortex3D Studio');
console.log('   Exposing local server on port 3000 to public HTTPS');
console.log('--------------------------------------------------\n');

const tunnelProcess = spawn('npx', ['--yes', 'cloudflared', 'tunnel', '--url', 'http://localhost:3000'], {
  shell: true,
  stdio: 'pipe'
});

tunnelProcess.stdout.on('data', (data) => {
  const msg = data.toString();
  console.log(msg);
  findTunnelUrl(msg);
});

tunnelProcess.stderr.on('data', (data) => {
  const msg = data.toString();
  findTunnelUrl(msg);
});

function findTunnelUrl(output) {
  const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match) {
    console.log('\n==================================================');
    console.log('🎉 PUBLIC TUNNEL ONLINE!');
    console.log(`🌐 SHARE URL: ${match[0]}`);
    console.log('==================================================\n');
  }
}

tunnelProcess.on('close', (code) => {
  console.log(`Tunnel process exited with code ${code}`);
});
