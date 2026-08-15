import { getApiBaseUrl } from '../network/api.js';

export class StudioDashboard {
  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'studio-dashboard';
    this.container.style.cssText = `
      width: 100%;
      height: 100vh;
      background: #0f172a;
      color: white;
      font-family: 'Inter', sans-serif;
      overflow-y: auto;
      padding: 40px;
      box-sizing: border-box;
    `;
    this.init();
  }

  async init() {
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '40px';

    const title = document.createElement('h1');
    title.textContent = 'My Workspaces';
    title.style.margin = '0';
    title.style.fontSize = '32px';
    title.style.fontWeight = '800';
    title.style.background = 'linear-gradient(to right, #38bdf8, #818cf8)';
    title.style.webkitBackgroundClip = 'text';
    title.style.webkitTextFillColor = 'transparent';

    const navButtons = document.createElement('div');
    navButtons.style.display = 'flex';
    navButtons.style.gap = '16px';

    const backBtn = document.createElement('button');
    backBtn.textContent = '← Back to Discover';
    backBtn.style.cssText = `
      background: transparent;
      color: #94a3b8;
      border: 1px solid #334155;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    `;
    backBtn.onmouseover = () => { backBtn.style.color = 'white'; backBtn.style.border = '1px solid #475569'; };
    backBtn.onmouseout = () => { backBtn.style.color = '#94a3b8'; backBtn.style.border = '1px solid #334155'; };
    backBtn.onclick = () => {
      window.location.href = '/?mode=discover';
    };

    const newBtn = document.createElement('button');
    newBtn.textContent = '+ Create New Workspace';
    newBtn.style.cssText = `
      background: #3b82f6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    `;
    newBtn.onmouseover = () => newBtn.style.background = '#2563eb';
    newBtn.onmouseout = () => newBtn.style.background = '#3b82f6';
    newBtn.onclick = () => {
      window.location.href = '/?mode=editor';
    };

    navButtons.appendChild(backBtn);
    navButtons.appendChild(newBtn);

    header.appendChild(title);
    header.appendChild(navButtons);
    this.container.appendChild(header);

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
    grid.style.gap = '24px';
    this.container.appendChild(grid);

    const token = localStorage.getItem('vortex3d_token');
    if (!token) {
      grid.innerHTML = '<p style="color:#94a3b8;">You must be signed in to view your workspaces.</p>';
      return;
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/games/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch workspaces');
      }

      const games = await res.json();
      
      if (games.length === 0) {
        grid.innerHTML = '<p style="color:#94a3b8;">You haven\'t published any workspaces yet.</p>';
      } else {
        games.forEach(game => {
          const card = document.createElement('div');
          card.style.cssText = `
            background: #1e293b;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #334155;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            position: relative;
          `;
          card.onmouseover = () => {
            card.style.transform = 'translateY(-4px)';
            card.style.boxShadow = '0 12px 24px rgba(0,0,0,0.4)';
            card.style.border = '1px solid #3b82f6';
          };
          card.onmouseout = () => {
            card.style.transform = 'none';
            card.style.boxShadow = 'none';
            card.style.border = '1px solid #334155';
          };

          card.onclick = () => {
            window.location.href = `/?mode=editor&gameId=${game.id}`;
          };

          const thumb = document.createElement('div');
          thumb.style.height = '160px';
          thumb.style.background = `url(${game.thumbnail_url || game.thumbnailUrl}) center/cover`;
          
          const content = document.createElement('div');
          content.style.padding = '16px';
          
          const name = document.createElement('h3');
          name.textContent = game.title;
          name.style.margin = '0 0 8px 0';
          name.style.fontSize = '18px';
          
          const desc = document.createElement('p');
          desc.textContent = game.description || 'No description';
          desc.style.margin = '0';
          desc.style.fontSize = '12px';
          desc.style.color = '#94a3b8';
          
          content.appendChild(name);
          content.appendChild(desc);
          
          const deleteBtn = document.createElement('button');
          deleteBtn.innerHTML = '🗑️ Delete';
          deleteBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(220, 38, 38, 0.9);
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 12px;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.2s, background 0.2s;
          `;
          deleteBtn.onmouseover = () => deleteBtn.style.background = 'rgba(239, 68, 68, 1)';
          deleteBtn.onmouseout = () => deleteBtn.style.background = 'rgba(220, 38, 38, 0.9)';
          deleteBtn.onclick = async (e) => {
            e.stopPropagation(); // Prevent opening the editor
            const confirmDelete = confirm(`Are you sure you want to delete and unpublish "${game.title}"? This action cannot be undone.`);
            if (!confirmDelete) return;
            
            try {
              const delRes = await fetch(`${getApiBaseUrl()}/api/games/${game.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (delRes.ok) {
                card.remove(); // Remove from UI instantly
              } else {
                alert('Failed to delete workspace. Please try again.');
              }
            } catch (err) {
              alert('Error deleting workspace.');
            }
          };
          
          card.appendChild(thumb);
          card.appendChild(content);
          card.appendChild(deleteBtn);
          
          // Show delete button on hover
          card.addEventListener('mouseover', () => deleteBtn.style.opacity = '1');
          card.addEventListener('mouseout', () => deleteBtn.style.opacity = '0');
          
          grid.appendChild(card);
        });
      }
    } catch (e) {
      grid.innerHTML = '<p style="color:#ef4444;">Error loading workspaces.</p>';
    }
  }
}
