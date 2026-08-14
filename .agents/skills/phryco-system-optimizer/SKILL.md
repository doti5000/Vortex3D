---
name: phryco-system-optimizer
description: System resource optimization skill for freeing memory, resetting sockets, clearing stale PIDs, and prepping environment prior to running multi-service dev launchers.
---

# Phryco System Optimizer Skill

Pre-flight resource optimization protocol ported from Phryco LLC (`optimize_memory.ps1`, `optimize_network.ps1`, `optimize_cpu.ps1`, `optimize_disks.ps1`).

## Pre-flight Checklist

1. **Process & Port Cleanup**:
   - Kill stale process trees on ports `3000` (Vite) and `3001` (Node/Express).
   - Terminate lingering `cloudflared.exe` or `redis-server.exe` PIDs.

2. **Memory & Cache Reset**:
   - Clear temporary storage buffers in `.storage/` and redirect system `TEMP` paths.

3. **Socket Reuse**:
   - Ensure TCP ports are freed immediately without `TIME_WAIT` locks (`EADDRINUSE` protection).
