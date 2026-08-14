import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { title, description, sceneData, thumbnailUrl, tunnelUrl, userId } = req.body || {};
    const gameId = 'game_' + Math.random().toString(36).substring(2, 9);
    const newGame = {
      id: gameId,
      user_id: userId || 'usr_guest',
      creator_name: userId || 'Vortex3D Builder',
      title: title || 'New WASM Game',
      description: description || 'User-created Vortex3D game',
      thumbnail_url: thumbnailUrl || '',
      tunnel_url: tunnelUrl || '',
      scene_data: sceneData || {},
      plays: 1,
      likes: 0,
      created_at: new Date().toISOString()
    };
    return res.status(200).json({ success: true, game: newGame });
  }

  // Default Games List for Vercel Serverless
  const defaultGames = [
    {
      id: 'game_r6_arena',
      user_id: 'usr_vortex',
      creator_name: 'Vortex3D Team',
      title: 'Classic R6 Avatar Arena',
      description: 'Multiplayer blocky avatar playground with obstacle ramps, classic face customization, and physics trampolines!',
      thumbnail_url: '',
      tunnel_url: 'https://vortex3d-live.trycloudflare.com?room=arena1',
      plays: 1420,
      likes: 89,
      created_at: new Date().toISOString()
    },
    {
      id: 'game_sandbox_destruction',
      user_id: 'usr_physics',
      creator_name: 'WASM Physics Lab',
      title: 'WASM Physics Destruction Spawner',
      description: 'Stack towers of physics boxes, trigger anti-gravity fields with Luau scripts, and launch wrecking balls!',
      thumbnail_url: '',
      tunnel_url: 'https://vortex3d-live.trycloudflare.com?room=sandbox1',
      plays: 980,
      likes: 64,
      created_at: new Date().toISOString()
    },
    {
      id: 'game_vehicle_rush',
      user_id: 'usr_racer',
      creator_name: 'Speedster',
      title: '3D Luau Vehicle Highway Rush',
      description: 'Drive high-speed cars controlled by Luau scripts, launch over mega ramps, and smash obstacles.',
      thumbnail_url: '',
      tunnel_url: 'https://vortex3d-live.trycloudflare.com?room=highway1',
      plays: 750,
      likes: 42,
      created_at: new Date().toISOString()
    }
  ];

  return res.status(200).json(defaultGames);
}
