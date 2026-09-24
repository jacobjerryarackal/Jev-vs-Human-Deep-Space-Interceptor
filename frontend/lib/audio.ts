/**
 * Zero-dependency Web Audio API synthesizer for Deep Space Interceptor.
 * Synthesizes crisp procedural sound effects:
 * - Laser pulses (snappy FM chirp)
 * - Shield absorbs (warm resonant low-pass)
 * - Powerup pickups (bright dual arpeggio)
 * - Explosion rumbles (filtered white noise decay)
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.25, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.25, this.ctx.currentTime);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Snappy laser pulse with frequency exponential sweep
   */
  public playLaser(frequencyOrIsJev: number | boolean = false, duration: number = 0.07) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const isJev = typeof frequencyOrIsJev === "boolean" ? frequencyOrIsJev : false;
      const startFreq = typeof frequencyOrIsJev === "number" ? frequencyOrIsJev : (isJev ? 880 : 660);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isJev ? "square" : "sawtooth";
      osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.045, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio fallback silent ignore
    }
  }

  /**
   * Resonant shield harmonic deflection
   */
  public playShield() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(640, this.ctx.currentTime + 0.08);
      osc.frequency.exponentialRampToValueAtTime(160, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {
      // ignore
    }
  }

  /**
   * Bright arpeggiated powerup core collection
   */
  public playPowerup() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const startTime = this.ctx.currentTime + idx * 0.045;
        const duration = 0.12;

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.35, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Filtered white noise procedural explosion rumble
   */
  public playExplosion(intensity: "small" | "large" = "small") {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const duration = intensity === "large" ? 0.45 : 0.25;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-3 * (i / bufferSize));
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(intensity === "large" ? 400 : 750, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(intensity === "large" ? 0.7 : 0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noiseSource.start();
      noiseSource.stop(this.ctx.currentTime + duration);
    } catch {
      // ignore
    }
  }

  /**
   * Resonant EMP shockwave blast
   */
  public playEmp() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(920, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(75, this.ctx.currentTime + 0.38);

      gain.gain.setValueAtTime(0.16, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 0.38);
    } catch {
      // ignore
    }
  }

  /**
   * High-pitch shield deflection
   */
  public playShieldHit() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(280, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {
      // ignore
    }
  }
}

export const sound = new SoundSynthesizer();
