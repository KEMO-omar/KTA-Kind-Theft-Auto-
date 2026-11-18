import { RadioStationId, WeaponId } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private radioTimer: number | null = null;
  private radioStep = 0;
  private currentStation: RadioStationId = 'cairo';
  private sirenTimer: number | null = null;
  private sirenActive = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.45;
      this.masterGain.connect(this.ctx.destination);
      this.noiseBuffer = this.buildNoiseBuffer(this.ctx);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private buildNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * 1.2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  public unlock() {
    this.ensureContext();
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.45, this.ctx.currentTime, 0.05);
    }
    if (muted) {
      this.stopEngine();
      this.stopRadioLoop();
      this.setPoliceSiren(false);
    } else if (this.currentStation !== 'off') {
      this.startRadioLoop();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public playIntroTheme() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    // Warm lush GTA-inspired synth brass & sub-bass intro swell
    const freqs = [73.42, 146.83, 220, 261.63, 329.63, 440];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = idx < 2 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.12);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(1800, now + 1.4);
      gain.gain.setValueAtTime(0.001, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.12 + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + idx * 0.12);
      osc.stop(now + 3.3);
    });
  }

  public updateEngine(inVehicle: boolean, speedRatio: number, isBike = false) {
    if (this.muted || !inVehicle) {
      this.stopEngine();
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    if (!this.engineOsc || !this.engineGain || !this.engineSubOsc) {
      this.engineOsc = ctx.createOscillator();
      this.engineSubOsc = ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineSubOsc.type = 'triangle';
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = isBike ? 580 : 290;
      this.engineGain = ctx.createGain();
      this.engineGain.gain.value = 0.035;
      this.engineOsc.connect(filter);
      this.engineSubOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);
      this.engineOsc.start();
      this.engineSubOsc.start();
    }
    const clamped = Math.min(1.5, Math.max(0, speedRatio));
    const base = isBike ? 76 : 44;
    const targetFreq = base + clamped * (isBike ? 140 : 88);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.06);
    this.engineSubOsc.frequency.setTargetAtTime(targetFreq * 0.5, ctx.currentTime, 0.06);
    this.engineGain.gain.setTargetAtTime(0.03 + clamped * 0.045, ctx.currentTime, 0.08);
  }

  public stopEngine() {
    [this.engineOsc, this.engineSubOsc].forEach((osc) => {
      if (osc) {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore
        }
      }
    });
    this.engineOsc = null;
    this.engineSubOsc = null;
    if (this.engineGain) {
      this.engineGain.disconnect();
      this.engineGain = null;
    }
  }

  public setRadioStation(station: RadioStationId) {
    this.currentStation = station;
    this.stopRadioLoop();
    if (station !== 'off' && !this.muted) {
      this.startRadioLoop();
    }
  }

  private stopRadioLoop() {
    if (this.radioTimer !== null) {
      window.clearInterval(this.radioTimer);
      this.radioTimer = null;
    }
  }

  private startRadioLoop() {
    this.stopRadioLoop();
    if (this.currentStation === 'off' || this.muted) return;
    const stepMs = this.currentStation === 'cairo' ? 145 : this.currentStation === 'synthwave' ? 160 : 175;
    this.radioTimer = window.setInterval(() => {
      if (this.muted || this.currentStation === 'off') return;
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain) return;
      this.playRadioStep(ctx, this.masterGain);
      this.radioStep = (this.radioStep + 1) % 32;
    }, stepMs);
  }

  private playRadioStep(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;
    const step = this.radioStep;

    if (this.currentStation === 'cairo') {
      // Cairo Nights Trap / Hijaz Beat: D Hijaz scale (D, Eb, F#, G, A, Bb, C)
      const kickPattern = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0];
      const snarePattern = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1];
      const bassRoot = step < 16 ? 73.42 : step < 24 ? 77.78 : 65.41; // D2 -> Eb2 -> C2
      if (kickPattern[step % 16]) {
        this.trigger808(ctx, dest, now, bassRoot, 0.14);
      }
      if (snarePattern[step % 16]) {
        this.triggerSnare(ctx, dest, now, 0.08);
      }
      // Crisp hi-hat groove with trap rolls
      if (step % 2 === 0 || (step % 16 >= 12 && step % 16 <= 15)) {
        this.triggerHiHat(ctx, dest, now, 0.025);
      }
      // Oud/Synth Hijaz Lead Melody
      const hijazLead = [
        293.66, 0, 311.13, 369.99, 392.0, 0, 369.99, 311.13,
        293.66, 0, 440.0, 466.16, 440.0, 392.0, 369.99, 311.13,
        293.66, 369.99, 392.0, 440.0, 466.16, 0, 440.0, 392.0,
        369.99, 311.13, 293.66, 0, 261.63, 293.66, 311.13, 0,
      ];
      const note = hijazLead[step];
      if (note > 0) {
        this.triggerPluck(ctx, dest, now, note, 'sawtooth', 0.22, 0.045, 2200);
      }
    } else if (this.currentStation === 'synthwave') {
      // Sunset Synth FM: Classic 80s progression Am - F - C - G
      const bar = Math.floor(step / 8);
      const bassRoots = [55, 43.65, 65.41, 49.0];
      const chords = [
        [220, 261.63, 329.63],
        [174.61, 220, 261.63],
        [261.63, 329.63, 392.0],
        [196.0, 246.94, 293.66],
      ];
      // Driving 8th-note synth bass
      if (step % 2 === 0) {
        this.triggerPluck(ctx, dest, now, bassRoots[bar] * (step % 4 === 2 ? 2 : 1), 'sawtooth', 0.14, 0.055, 650);
      }
      // Four-on-the-floor kick + gated snare
      if (step % 4 === 0) this.trigger808(ctx, dest, now, 55, 0.11);
      if (step % 8 === 4) this.triggerSnare(ctx, dest, now, 0.09);
      if (step % 2 === 1) this.triggerHiHat(ctx, dest, now, 0.02);
      // Warm pad on bar change + bright arp
      if (step % 8 === 0) {
        chords[bar].forEach((f) => this.triggerPluck(ctx, dest, now, f, 'triangle', 0.85, 0.022, 1200));
      }
      const chord = chords[bar];
      this.triggerPluck(ctx, dest, now, chord[step % 3] * 2, 'sine', 0.15, 0.025, 2600);
    } else if (this.currentStation === 'funk') {
      // Bay Street Funk: Electric Rhodes + Slap Bass groove
      const bar = Math.floor(step / 8);
      const bass = [82.41, 82.41, 0, 98.0, 110.0, 0, 98.0, 82.41];
      const bNote = bass[step % 8];
      if (bNote > 0) {
        this.triggerPluck(ctx, dest, now, bNote, 'triangle', 0.18, 0.075, 950);
      }
      if (step % 8 === 0 || step % 8 === 5) this.trigger808(ctx, dest, now, 60, 0.1);
      if (step % 8 === 2 || step % 8 === 6) this.triggerSnare(ctx, dest, now, 0.065);
      if (step % 2 === 0) this.triggerHiHat(ctx, dest, now, 0.022);
      if (step % 8 === 0 || step % 8 === 3) {
        const chord = bar % 2 === 0 ? [329.63, 392.0, 493.88, 587.33] : [293.66, 349.23, 440.0, 523.25];
        chord.forEach((f) => this.triggerPluck(ctx, dest, now, f, 'sine', 0.38, 0.024, 1700));
      }
    }
  }

  private triggerPluck(
    ctx: AudioContext,
    dest: AudioNode,
    now: number,
    freq: number,
    type: OscillatorType,
    dur: number,
    vol: number,
    cutoff: number,
  ) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(200, cutoff * 0.35), now + dur);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  private trigger808(ctx: AudioContext, dest: AudioNode, now: number, endFreq: number, vol: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.09);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  private triggerSnare(ctx: AudioContext, dest: AudioNode, now: number, vol: number) {
    if (!this.noiseBuffer) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1850, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start(now);
    src.stop(now + 0.14);
  }

  private triggerHiHat(ctx: AudioContext, dest: AudioNode, now: number, vol: number) {
    if (!this.noiseBuffer) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.045);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start(now);
    src.stop(now + 0.05);
  }

  public playWeaponFire(weapon: WeaponId) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    if (weapon === 'melee') {
      this.triggerSnare(ctx, this.masterGain, now, 0.09);
      return;
    }

    const dur = weapon === 'shotgun' ? 0.22 : weapon === 'rpg' ? 0.42 : 0.1;
    const vol = weapon === 'shotgun' ? 0.22 : weapon === 'rpg' ? 0.26 : weapon === 'rifle' ? 0.16 : 0.12;
    const cutoff = weapon === 'smg' ? 2800 : weapon === 'pistol' ? 2200 : weapon === 'rifle' ? 2500 : 1200;

    if (this.noiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(cutoff, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      src.start(now);
      src.stop(now + dur + 0.02);
    }

    this.trigger808(ctx, this.masterGain, now, weapon === 'shotgun' || weapon === 'rpg' ? 36 : 58, vol * 0.8);
  }

  public playExplosion() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    if (this.noiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(750, now);
      filter.frequency.exponentialRampToValueAtTime(110, now + 0.75);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      src.start(now);
      src.stop(now + 0.82);
    }
    this.trigger808(ctx, this.masterGain, now, 28, 0.28);
  }

  public playHorn(isPolice = false) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    if (isPolice) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(640, now);
      osc.frequency.linearRampToValueAtTime(920, now + 0.2);
      osc.frequency.linearRampToValueAtTime(640, now + 0.4);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.45);
      return;
    }
    [340, 425].forEach((f) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 0.27);
    });
  }

  public setPoliceSiren(active: boolean) {
    if (active === this.sirenActive) return;
    this.sirenActive = active;
    if (this.sirenTimer !== null) {
      window.clearInterval(this.sirenTimer);
      this.sirenTimer = null;
    }
    if (active && !this.muted) {
      this.sirenTimer = window.setInterval(() => {
        if (!this.sirenActive || this.muted) return;
        const ctx = this.ensureContext();
        if (!ctx || !this.masterGain) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.35);
        osc.frequency.linearRampToValueAtTime(620, now + 0.7);
        gain.gain.setValueAtTime(0.032, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.75);
      }, 950);
    }
  }

  public playAction(kind: 'pickup' | 'mission' | 'crash' | 'repair' | 'door') {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    if (kind === 'pickup' || kind === 'repair') {
      const seq = kind === 'repair' ? [440, 554.37, 659.25] : [587.33, 880];
      seq.forEach((f, i) => {
        this.triggerPluck(ctx, this.masterGain!, now + i * 0.06, f, 'triangle', 0.16, 0.09, 2400);
      });
    } else if (kind === 'mission') {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        this.triggerPluck(ctx, this.masterGain!, now + i * 0.09, f, 'triangle', 0.35, 0.11, 2600);
      });
    } else if (kind === 'crash') {
      this.trigger808(ctx, this.masterGain, now, 34, 0.18);
      this.triggerSnare(ctx, this.masterGain, now, 0.08);
    } else if (kind === 'door') {
      this.triggerPluck(ctx, this.masterGain, now, 190, 'triangle', 0.08, 0.07, 700);
    }
  }
}

export const soundEngine = new SoundEngine();
