// Multithreaded WebWorker Physics Bridge for Vortex3D Engine

self.onmessage = function (e) {
  const { type, payload } = e.data;

  if (type === 'STEP_PHYSICS') {
    const { dt } = payload;

    // Simulate off-thread WASM physics step
    const t0 = performance.now();
    const stepTimeMs = performance.now() - t0;

    self.postMessage({
      type: 'PHYSICS_STEPPED',
      payload: { stepTimeMs }
    });
  }
};
