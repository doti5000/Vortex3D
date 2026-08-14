// Dynamic API Base URL resolver for Localhost & Vercel Production (https://vortex3d.vercel.app)

let cachedTunnelUrl = null;

export function getApiBaseUrl() {
  if (typeof window === 'undefined') return 'http://localhost:3001';

  // If running locally, use port 3001
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }

  // If running on Vercel production (https://vortex3d.vercel.app), use active Cloudflare Tunnel URL or relative path
  if (cachedTunnelUrl) return cachedTunnelUrl;
  return window.location.origin;
}

export function setCachedTunnelUrl(url) {
  if (url) cachedTunnelUrl = url;
}
