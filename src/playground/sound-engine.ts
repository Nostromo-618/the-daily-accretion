export interface AudioMetrics {
  theta1: number;
  theta2: number;
  omega1: number;
  omega2: number;
  energy: number;
  distance: number;
  kineticEnergy: number;
  potentialEnergy: number;
  L1: number;
  L2: number;
}

export type WaveformName = "sine" | "square" | "sawtooth" | "triangle";

export interface MixerSettings {
  volume: number;
  muted: boolean;
  waveform: WaveformName;
  cutoff: number;
  q: number;
  delayTime: number;
  delayFeedback: number;
  drive: number;
  followMotion: boolean;
  pitch: number;
  lfoRate: number;
  lfoDepth: number;
}

export const DEFAULT_MIXER: MixerSettings = {
  volume: 0.2,
  muted: false,
  waveform: "sine",
  cutoff: 1000,
  q: 3,
  delayTime: 0,
  delayFeedback: 0.25,
  drive: 0.15,
  followMotion: true,
  pitch: 300,
  lfoRate: 5,
  lfoDepth: 0.08,
};

function makeDriveCurve(amount: number): Float32Array<ArrayBuffer> {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const k = Math.max(0, amount) * 80;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = k === 0 ? x : ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}

export class SoundEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volumeGain: GainNode | null = null;
  private muteGain: GainNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private amplitudeGain: GainNode | null = null;
  private drive: WaveShaperNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private delay: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private delayWet: GainNode | null = null;
  private lfoOscillator: OscillatorNode | null = null;
  private modGain: GainNode | null = null;

  private isPlaying: boolean = false;
  private settings: MixerSettings = { ...DEFAULT_MIXER };

  constructor() {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!Ctor) return;

    try {
      this.audioContext = new Ctor();
      this.masterGain = this.audioContext.createGain();
      this.volumeGain = this.audioContext.createGain();
      this.muteGain = this.audioContext.createGain();

      this.masterGain.gain.value = 1;
      this.volumeGain.gain.value = this.settings.volume;
      this.muteGain.gain.value = this.settings.muted ? 0 : 1;

      this.masterGain.connect(this.volumeGain);
      this.volumeGain.connect(this.muteGain);
      this.muteGain.connect(this.audioContext.destination);

      this.ensureEffects();
    } catch {
      this.audioContext = null;
      this.masterGain = null;
      this.volumeGain = null;
      this.muteGain = null;
    }
  }

  applyMixer(settings: MixerSettings): void {
    this.settings = { ...settings };
    if (!this.audioContext) return;

    const live = this.settings;
    const now = this.audioContext.currentTime;

    if (this.volumeGain) {
      this.volumeGain.gain.setValueAtTime(
        Math.max(0, Math.min(1, live.volume)),
        now,
      );
    }
    if (this.muteGain) {
      this.muteGain.gain.setValueAtTime(live.muted ? 0 : 1, now);
    }
    if (this.oscillator) {
      this.oscillator.type = live.waveform;
      if (!live.followMotion) {
        this.oscillator.frequency.setValueAtTime(live.pitch, now);
      }
    }
    if (this.filter) {
      this.filter.Q.setValueAtTime(live.q, now);
      if (!live.followMotion) {
        this.filter.frequency.setValueAtTime(live.cutoff, now);
      }
    }
    if (this.delay) {
      this.delay.delayTime.setValueAtTime(
        Math.max(0, Math.min(1, live.delayTime)),
        now,
      );
    }
    if (this.delayFeedback) {
      this.delayFeedback.gain.setValueAtTime(
        Math.max(0, Math.min(0.9, live.delayFeedback)),
        now,
      );
    }
    if (this.delayWet) {
      this.delayWet.gain.setValueAtTime(
        live.delayTime > 0.001 ? 0.7 : 0,
        now,
      );
    }
    if (this.drive) {
      this.drive.curve = makeDriveCurve(live.drive);
    }
    if (!live.followMotion) {
      if (this.lfoOscillator) {
        this.lfoOscillator.frequency.setValueAtTime(live.lfoRate, now);
      }
      if (this.modGain) {
        this.modGain.gain.setValueAtTime(live.lfoDepth, now);
      }
    }
  }

  start(): void {
    if (!this.audioContext) return;
    this.isPlaying = true;
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume().catch(() => {});
    }
  }

  stop(): void {
    this.isPlaying = false;
    try {
      if (this.oscillator) {
        this.oscillator.stop();
        this.oscillator.disconnect();
      }
      if (this.amplitudeGain) {
        this.amplitudeGain.disconnect();
      }
      if (this.lfoOscillator) {
        this.lfoOscillator.stop();
        this.lfoOscillator.disconnect();
      }
      if (this.modGain) {
        this.modGain.disconnect();
      }
    } catch {
      // nodes may already be stopped; ignore.
    }
    this.oscillator = null;
    this.amplitudeGain = null;
    this.lfoOscillator = null;
    this.modGain = null;
  }

  private ensureEffects(): boolean {
    if (!this.audioContext || !this.masterGain) return false;
    if (
      this.drive &&
      this.filter &&
      this.delay &&
      this.delayFeedback &&
      this.delayWet
    ) {
      return true;
    }

    try {
      const live = this.settings;
      this.drive = this.audioContext.createWaveShaper();
      this.drive.curve = makeDriveCurve(live.drive);
      this.drive.oversample = "2x";

      this.filter = this.audioContext.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.value = live.cutoff;
      this.filter.Q.value = live.q;

      this.delay = this.audioContext.createDelay(1);
      this.delay.delayTime.value = live.delayTime;

      this.delayFeedback = this.audioContext.createGain();
      this.delayFeedback.gain.value = live.delayFeedback;

      this.delayWet = this.audioContext.createGain();
      this.delayWet.gain.value = live.delayTime > 0.001 ? 0.7 : 0;

      this.drive.connect(this.filter);
      this.filter.connect(this.masterGain);
      this.filter.connect(this.delay);
      this.delay.connect(this.delayWet);
      this.delayWet.connect(this.masterGain);
      this.delay.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delay);

      return true;
    } catch {
      this.drive = null;
      this.filter = null;
      this.delay = null;
      this.delayFeedback = null;
      this.delayWet = null;
      return false;
    }
  }

  private getOrCreateOscillator(): OscillatorNode | null {
    if (!this.audioContext || !this.ensureEffects() || !this.drive) return null;

    if (!this.oscillator) {
      try {
        const live = this.settings;
        this.oscillator = this.audioContext.createOscillator();
        this.oscillator.type = live.waveform;
        this.oscillator.frequency.value = live.pitch;

        this.amplitudeGain = this.audioContext.createGain();
        this.amplitudeGain.gain.value = 0;

        this.oscillator.connect(this.amplitudeGain);
        this.amplitudeGain.connect(this.drive);
        this.oscillator.start();
      } catch {
        this.oscillator = null;
        this.amplitudeGain = null;
        return null;
      }
    }

    return this.oscillator;
  }

  private getOrCreateLFO(): OscillatorNode | null {
    if (!this.audioContext || !this.masterGain) return null;

    if (!this.lfoOscillator) {
      try {
        const live = this.settings;
        this.lfoOscillator = this.audioContext.createOscillator();
        this.lfoOscillator.type = "sine";
        this.lfoOscillator.frequency.value = live.lfoRate;

        this.modGain = this.audioContext.createGain();
        this.modGain.gain.value = live.followMotion ? 0 : live.lfoDepth;

        this.lfoOscillator.connect(this.modGain);
        this.modGain.connect(this.masterGain.gain);

        this.lfoOscillator.start();
      } catch {
        this.lfoOscillator = null;
        this.modGain = null;
        return null;
      }
    }

    return this.lfoOscillator;
  }

  update(m: AudioMetrics): void {
    if (!this.isPlaying || !this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;
    const live = this.settings;
    const follow = live.followMotion;

    const osc = this.getOrCreateOscillator();
    if (osc) {
      if (follow) {
        const normTheta =
          ((m.theta2 % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const freq = 150 + (normTheta / (2 * Math.PI)) * 600;
        osc.frequency.setValueAtTime(freq, now);
      } else {
        osc.frequency.setValueAtTime(live.pitch, now);
      }

      const normOmega = Math.abs(m.omega1 + m.omega2) / 30;
      const amp = Math.max(0.1, Math.min(0.8, normOmega));
      if (this.amplitudeGain) {
        this.amplitudeGain.gain.setValueAtTime(amp, now);
      }
    }

    if (this.filter) {
      this.filter.Q.setValueAtTime(live.q, now);
      if (follow) {
        const normEnergy = Math.abs(m.energy) / 50;
        const cutoff = Math.min(8000, 300 + normEnergy * 1500);
        this.filter.frequency.setValueAtTime(cutoff, now);
      } else {
        this.filter.frequency.setValueAtTime(live.cutoff, now);
      }
    }

    const lfo = this.getOrCreateLFO();
    if (lfo) {
      if (follow) {
        const maxDist = m.L1 + m.L2;
        const proximity = 1 - m.distance / (maxDist || 1);
        const modFreq = 1 + proximity * 20;
        lfo.frequency.setValueAtTime(modFreq, now);
        if (this.modGain) {
          this.modGain.gain.setValueAtTime(proximity * 0.15, now);
        }
      } else {
        lfo.frequency.setValueAtTime(live.lfoRate, now);
        if (this.modGain) {
          this.modGain.gain.setValueAtTime(live.lfoDepth, now);
        }
      }
    }
  }

  setVolume(volume: number): void {
    this.settings.volume = volume;
    if (this.volumeGain && this.audioContext) {
      this.volumeGain.gain.setValueAtTime(
        Math.max(0, Math.min(1, volume)),
        this.audioContext.currentTime,
      );
    }
  }
}
