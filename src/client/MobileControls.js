export class MobileControls {
  constructor() {
    this.moveX = 0;
    this.moveZ = 0;
    this.isJumping = false;
    
    this.joystickTouchId = null;
    this.joystickCenter = { x: 0, y: 0 };
    this.joystickMaxRadius = 50; // Max visual displacement
    
    this.onChatToggle = null;

    this.createOverlay();
    this.bindEvents();
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'mobile-controls-layer';

    // Joystick Area
    this.joystickZone = document.createElement('div');
    this.joystickZone.className = 'mobile-joystick-zone';
    
    this.joystickBase = document.createElement('div');
    this.joystickBase.className = 'joystick-base';
    
    this.joystickNub = document.createElement('div');
    this.joystickNub.className = 'joystick-nub';
    
    this.joystickZone.appendChild(this.joystickBase);
    this.joystickZone.appendChild(this.joystickNub);
    this.overlay.appendChild(this.joystickZone);

    // Action Buttons
    this.actionZone = document.createElement('div');
    this.actionZone.className = 'mobile-action-zone';
    
    this.chatBtn = document.createElement('div');
    this.chatBtn.className = 'mobile-btn';
    // Chat icon (Speech bubble)
    this.chatBtn.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    
    this.jumpBtn = document.createElement('div');
    this.jumpBtn.className = 'mobile-btn jump-btn';
    // Jump icon (Arrow up)
    this.jumpBtn.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>';
    
    this.actionZone.appendChild(this.chatBtn);
    this.actionZone.appendChild(this.jumpBtn);
    this.overlay.appendChild(this.actionZone);

    document.body.appendChild(this.overlay);
  }

  bindEvents() {
    // Joystick Touch
    this.joystickZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      if (this.joystickTouchId === null) {
        this.joystickTouchId = touch.identifier;
        const rect = this.joystickZone.getBoundingClientRect();
        
        // Base centered where the user touched inside the zone
        this.joystickCenter = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top
        };
        
        this.joystickBase.style.display = 'block';
        this.joystickNub.style.display = 'block';
        
        this.joystickBase.style.left = `${this.joystickCenter.x - 60}px`;
        this.joystickBase.style.top = `${this.joystickCenter.y - 60}px`;
        
        this.joystickNub.style.left = `${this.joystickCenter.x}px`;
        this.joystickNub.style.top = `${this.joystickCenter.y}px`;
        
        this.updateJoystickVector(touch.clientX - rect.left, touch.clientY - rect.top);
      }
    }, { passive: false });

    this.joystickZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystickTouchId) {
          const rect = this.joystickZone.getBoundingClientRect();
          this.updateJoystickVector(touch.clientX - rect.left, touch.clientY - rect.top);
        }
      }
    }, { passive: false });

    const handleTouchEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystickTouchId) {
          this.joystickTouchId = null;
          this.moveX = 0;
          this.moveZ = 0;
          this.joystickBase.style.display = 'none';
          this.joystickNub.style.display = 'none';
        }
      }
    };

    this.joystickZone.addEventListener('touchend', handleTouchEnd);
    this.joystickZone.addEventListener('touchcancel', handleTouchEnd);

    // Jump Button
    this.jumpBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.isJumping = true;
    }, { passive: false });

    this.jumpBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.isJumping = false;
    }, { passive: false });

    // Chat Button
    this.chatBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.onChatToggle) this.onChatToggle();
    }, { passive: false });
  }

  updateJoystickVector(tx, ty) {
    let dx = tx - this.joystickCenter.x;
    let dy = ty - this.joystickCenter.y;
    
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    // Normalize if beyond max radius
    if (distance > this.joystickMaxRadius) {
      dx = (dx / distance) * this.joystickMaxRadius;
      dy = (dy / distance) * this.joystickMaxRadius;
    }
    
    this.joystickNub.style.left = `${this.joystickCenter.x + dx}px`;
    this.joystickNub.style.top = `${this.joystickCenter.y + dy}px`;
    
    // Convert to -1.0 to 1.0 range
    this.moveX = dx / this.joystickMaxRadius;
    this.moveZ = dy / this.joystickMaxRadius;
  }
}
