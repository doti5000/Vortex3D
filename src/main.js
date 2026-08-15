import { StudioApp } from './studio/StudioApp.js';
import { DiscoverApp } from './discover/DiscoverApp.js';
import { GameClient } from './client/GameClient.js';

// Simple URL-based routing to decouple the application
const params = new URLSearchParams(window.location.search);
const mode = params.get('mode') || 'discover';

if (mode === 'studio') {
  console.log("Vortex3D: Launching Studio Editor");
  new StudioApp();
} else if (mode === 'play') {
  console.log("Vortex3D: Launching Live Game Client");
  const gameId = params.get('id');
  const tunnelUrl = params.get('tunnelUrl');
  new GameClient(gameId, tunnelUrl);
} else {
  console.log("Vortex3D: Launching Discover Portal");
  new DiscoverApp();
}
