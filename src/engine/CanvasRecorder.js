export class CanvasRecorder {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.startTime = 0;
    this.onStateChange = null;
  }

  start() {
    if (this.isRecording || !this.canvas) return;

    this.recordedChunks = [];
    const stream = this.canvas.captureStream(60); // 60 FPS Canvas Stream

    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    try {
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5000000 // 5 Mbps High-Quality Gameplay
      });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.downloadVideo();
      };

      this.mediaRecorder.start(100);
      this.isRecording = true;
      this.startTime = performance.now();

      if (this.onStateChange) this.onStateChange(true);
    } catch (err) {
      console.error('Failed to start canvas recording:', err);
    }
  }

  stop() {
    if (!this.isRecording || !this.mediaRecorder) return;
    this.isRecording = false;
    this.mediaRecorder.stop();

    if (this.onStateChange) this.onStateChange(false);
  }

  downloadVideo() {
    if (this.recordedChunks.length === 0) return;

    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vortex3d_gameplay_${timestamp}.webm`;
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}
