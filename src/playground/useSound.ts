import { reactive, ref, watch, onMounted, onUnmounted } from "vue";
import {
  SoundEngine,
  DEFAULT_MIXER,
  type AudioMetrics,
  type MixerSettings,
} from "./sound-engine";
import type { PhysicsMetrics } from "./double-pendulum";

export type { MixerSettings, WaveformName } from "./sound-engine";

export function useSound() {
  const engine = ref<SoundEngine | null>(null);
  const isPlaying = ref(false);
  const mixer = reactive<MixerSettings>({ ...DEFAULT_MIXER });

  onMounted(() => {
    try {
      engine.value = new SoundEngine();
      engine.value.applyMixer(mixer);
    } catch {
      engine.value = null;
    }
  });

  onUnmounted(() => {
    if (engine.value) {
      engine.value.stop();
    }
  });

  watch(
    mixer,
    (settings) => {
      if (!engine.value) return;
      try {
        engine.value.applyMixer(settings);
      } catch {
        // ignore
      }
    },
    { deep: true },
  );

  function play(): void {
    if (!engine.value || isPlaying.value) return;
    try {
      engine.value.start();
      engine.value.applyMixer(mixer);
    } catch {
      return;
    }
    isPlaying.value = true;
  }

  function stop(): void {
    if (!engine.value || !isPlaying.value) return;
    try {
      engine.value.stop();
    } catch {
      // ignore
    }
    isPlaying.value = false;
  }

  function toggle(): void {
    if (isPlaying.value) {
      stop();
    } else {
      play();
    }
  }

  function update(metrics: PhysicsMetrics & { L1: number; L2: number }): void {
    if (!engine.value || !isPlaying.value) return;

    const audioMetrics: AudioMetrics = {
      theta1: metrics.phase1.theta,
      theta2: metrics.phase2.theta,
      omega1: metrics.phase1.omega,
      omega2: metrics.phase2.omega,
      energy: metrics.totalEnergy,
      distance: metrics.distance,
      kineticEnergy: metrics.kineticEnergy,
      potentialEnergy: metrics.potentialEnergy,
      L1: metrics.L1,
      L2: metrics.L2,
    };

    try {
      engine.value.update(audioMetrics);
    } catch {
      // never let audio block the simulation.
    }
  }

  function setVolume(v: number): void {
    mixer.volume = v;
    if (engine.value) {
      try {
        engine.value.setVolume(v);
      } catch {
        // ignore
      }
    }
  }

  return {
    mixer,
    isPlaying,
    play,
    stop,
    toggle,
    update,
    setVolume,
  };
}
