<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import {
  VdButton,
  VdSelect,
  VdSlider,
  VdSwitch,
  useTooltips,
} from '@vanduo-oss/vd3'
import {
  DoublePendulum,
  DEFAULT_LENGTHS,
  DEFAULT_MASSES,
  DEFAULT_OMEGAS,
  DEFAULT_THETAS,
  EARTH_G,
  MAX_N,
  MIN_N,
  type DoublePendulumParams,
} from '@/playground/double-pendulum'
import { useSound, type WaveformName } from '@/playground/useSound'
import { useThemeColors } from '@/playground/useThemeColors'

const pgRoot = ref<HTMLElement | null>(null)
useTooltips(pgRoot, { showDelay: 100 })

const canvasRef = ref<HTMLCanvasElement | null>(null)
const animationFrame = ref<number>(0)
const isRunning = ref(false)
const dragTarget = ref<number | null>(null)
const hoverTarget = ref<number | null>(null)
const frictionEnabled = ref(true)
const driveEnabled = ref(false)
const motionFx = ref(false)
const gravityScale = ref(1)

const waveforms: { value: WaveformName; label: string }[] = [
  { value: 'sine', label: 'Sine' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'sawtooth', label: 'Saw' },
  { value: 'square', label: 'Square' },
]

interface DragSample {
  t: number
  theta: number[]
}

const dragSamples = ref<DragSample[]>([])

const params = ref<DoublePendulumParams>({
  n: 2,
  L: [...DEFAULT_LENGTHS],
  m: [...DEFAULT_MASSES],
  theta: [...DEFAULT_THETAS],
  omega: [...DEFAULT_OMEGAS],
  g: EARTH_G,
})

interface TrailPoint {
  x: number
  y: number
  born: number
}

function emptyTrails(): TrailPoint[][] {
  return Array.from({ length: MAX_N }, () => [])
}

const pendulum = ref<DoublePendulum | null>(null)
const trails = ref<TrailPoint[][]>(emptyTrails())

const { play, stop, update, mixer } = useSound()
const { colors } = useThemeColors()

const dt = 1 / 60
const MIN_ANGLE = -Math.PI
const MAX_ANGLE = Math.PI
const TRAIL_LENGTH = 200
const TRAIL_LIFE_MS = 1200
const GHOST_ALPHA = 0.18
const LEN_MIN = 50
const LEN_MAX = 200
const PIVOT_R = 6
const HIT_PX = 20
const FIT_PADDING = 24
const SAMPLE_WINDOW_MS = 80
const THROW_OMEGA_MAX = 12
const REST_NUDGE = 1.2

const BOB_COLOR_KEYS = [
  'primary',
  'warning',
  'success',
  'secondary',
  'danger',
] as const

interface CanvasTransform {
  originX: number
  originY: number
  scale: number
  width: number
  height: number
}

const deg = (r: number): string => `${((r * 180) / Math.PI).toFixed(1)}°`

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function bobRadius(i: number): number {
  return 10 + i
}

function parseRgb(color: string): { r: number; g: number; b: number } | null {
  const hex = color.trim()
  if (hex.startsWith('#')) {
    const raw = hex.slice(1)
    const full =
      raw.length === 3
        ? raw
            .split('')
            .map((c) => c + c)
            .join('')
        : raw
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    }
  }
  const rgb = hex.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)/,
  )
  if (rgb) {
    return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) }
  }
  return null
}

function mixRgb(a: string, b: string, t: number): string {
  const A = parseRgb(a)
  const B = parseRgb(b)
  if (!A || !B) return a
  const m = (x: number, y: number) => Math.round(x + (y - x) * t)
  return `rgb(${m(A.r, B.r)}, ${m(A.g, B.g)}, ${m(A.b, B.b)})`
}

function bobColor(i: number): string {
  const c = colors.value
  if (i < BOB_COLOR_KEYS.length) return c[BOB_COLOR_KEYS[i]]
  const extras = [
    mixRgb(c.primary, c.success, 0.5),
    mixRgb(c.warning, c.secondary, 0.5),
    mixRgb(c.danger, c.primary, 0.55),
  ]
  return extras[(i - BOB_COLOR_KEYS.length) % extras.length]
}

function withAlpha(color: string, alpha: number): string {
  const rgb = parseRgb(color)
  if (!rgb) return color
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

function hardClearCanvas(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function wipeTrail(): void {
  trails.value = emptyTrails()
  hardClearCanvas()
}

function fitCanvas(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = canvas.clientWidth || 600
  canvas.height = canvas.clientHeight || 400
}

function getTransform(canvas: HTMLCanvasElement): CanvasTransform {
  const width = canvas.width
  const height = canvas.height
  const n = params.value.n
  let maxReach = bobRadius(n - 1)
  for (let i = 0; i < n; i++) maxReach += params.value.L[i]
  const available = Math.min(width, height) / 2 - FIT_PADDING
  const scale = maxReach > 0 ? Math.min(1, available / maxReach) : 1
  return {
    originX: width / 2,
    originY: height / 2,
    scale,
    width,
    height,
  }
}

function worldToScreen(
  x: number,
  y: number,
  t: CanvasTransform,
): { x: number; y: number } {
  return {
    x: t.originX + x * t.scale,
    y: t.originY - y * t.scale,
  }
}

function pointerToWorld(
  event: PointerEvent,
  canvas: HTMLCanvasElement,
  t: CanvasTransform,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  const sx = canvas.width / rect.width
  const sy = canvas.height / rect.height
  const cx = (event.clientX - rect.left) * sx
  const cy = (event.clientY - rect.top) * sy
  return {
    x: (cx - t.originX) / t.scale,
    y: -(cy - t.originY) / t.scale,
  }
}

function hitTest(
  world: { x: number; y: number },
  t: CanvasTransform,
): number | null {
  const pos = pendulum.value?.getPositions()
  if (!pos) return null
  const r = HIT_PX / t.scale
  let best: number | null = null
  let bestD = r
  for (let i = pos.length - 1; i >= 0; i--) {
    const d = Math.hypot(world.x - pos[i].x, world.y - pos[i].y)
    if (d <= r && (best === null || d <= bestD)) {
      best = i
      bestD = d
    }
  }
  return best
}

function wrapAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a))
}

function syncPhysicsFlags(): void {
  const p = pendulum.value
  if (!p) return
  const n = Math.min(MAX_N, Math.max(MIN_N, Math.round(params.value.n)))
  params.value.n = n
  p.setN(params.value.n)
  p.frictionEnabled = frictionEnabled.value
  p.driveEnabled = driveEnabled.value
  p.g = params.value.g
  for (let i = 0; i < MAX_N; i++) {
    p.L[i] = params.value.L[i]
    p.m[i] = params.value.m[i]
    p.theta[i] = params.value.theta[i]
  }
}

function initPendulum(): void {
  params.value.g = EARTH_G * gravityScale.value
  pendulum.value = new DoublePendulum({
    ...params.value,
    L: [...params.value.L],
    m: [...params.value.m],
    theta: [...params.value.theta],
    omega: [...params.value.omega],
  })
  syncPhysicsFlags()
  wipeTrail()
  fitCanvas()
}

function recordDragSample(): void {
  const p = pendulum.value
  if (!p) return
  const now = performance.now()
  dragSamples.value.push({ t: now, theta: p.theta.slice(0, p.n) })
  dragSamples.value = dragSamples.value.filter(
    (s) => now - s.t <= SAMPLE_WINDOW_MS,
  )
}

function unwrapDelta(d: number): number {
  while (d > Math.PI) d -= 2 * Math.PI
  while (d < -Math.PI) d += 2 * Math.PI
  return d
}

function throwOmegas(): number[] {
  const samples = dragSamples.value
  const n = params.value.n
  const zeros = new Array<number>(n).fill(0)
  if (samples.length < 2) return zeros
  const first = samples[0]
  const last = samples[samples.length - 1]
  const span = (last.t - first.t) / 1000
  if (span < 0.012) return zeros
  return last.theta.slice(0, n).map((th, i) => {
    const d = unwrapDelta(th - (first.theta[i] ?? th))
    return clamp(d / span, -THROW_OMEGA_MAX, THROW_OMEGA_MAX)
  })
}

function nudgeIfHanging(): void {
  const p = pendulum.value
  if (!p) return
  let moving = 0
  let hanging = true
  for (let i = 0; i < p.n; i++) {
    moving += Math.abs(p.omega[i])
    if (Math.abs(wrapAngle(p.theta[i])) >= 0.15) hanging = false
  }
  if (moving < 0.05 && hanging) {
    p.omega[0] = REST_NUDGE
  }
}

function captureLaunchEnergy(): void {
  pendulum.value?.captureEnergyTarget(false)
}

function draw(): void {
  const pendulumState = pendulum.value
  const canvas = canvasRef.value
  if (!pendulumState || !canvas) return

  const pos = pendulumState.getPositions()
  const m = pendulumState.getMetrics()
  update({
    ...m,
    L1: params.value.L[0],
    L2: pendulumState.totalLength(),
  })

  if (isRunning.value && !dragTarget.value) {
    const now = performance.now()
    for (let i = 0; i < pos.length; i++) {
      const ring = trails.value[i]
      ring.push({ x: pos[i].x, y: pos[i].y, born: now })
      if (motionFx.value) {
        trails.value[i] = ring.filter((p) => now - p.born < TRAIL_LIFE_MS)
      } else if (ring.length > TRAIL_LENGTH) {
        ring.shift()
      }
    }
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const t = getTransform(canvas)

  if (motionFx.value) {
    ctx.fillStyle = withAlpha(colors.value.background, GHOST_ALPHA)
    ctx.fillRect(0, 0, t.width, t.height)
  } else {
    ctx.clearRect(0, 0, t.width, t.height)
  }

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const now = performance.now()
  for (let i = 0; i < pos.length; i++) {
    const ring = trails.value[i]
    const color = bobColor(i)
    if (motionFx.value) {
      for (let k = 1; k < ring.length; k++) {
        const prev = ring[k - 1]
        const p = ring[k]
        const alpha = Math.max(0, 1 - (now - p.born) / TRAIL_LIFE_MS)
        const s0 = worldToScreen(prev.x, prev.y, t)
        const s1 = worldToScreen(p.x, p.y, t)
        ctx.strokeStyle = withAlpha(color, alpha)
        ctx.lineWidth = 1.2 + 5 * alpha
        ctx.beginPath()
        ctx.moveTo(s0.x, s0.y)
        ctx.lineTo(s1.x, s1.y)
        ctx.stroke()
        ctx.fillStyle = withAlpha(color, alpha * 0.75)
        ctx.beginPath()
        ctx.arc(s1.x, s1.y, 1.5 + 4 * alpha, 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (ring.length > 1) {
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ring.forEach((p, k) => {
        const s = worldToScreen(p.x, p.y, t)
        if (k === 0) ctx.moveTo(s.x, s.y)
        else ctx.lineTo(s.x, s.y)
      })
      ctx.stroke()
    }
  }

  const origin = worldToScreen(0, 0, t)
  let prev = origin
  pos.forEach((bob, i) => {
    const s = worldToScreen(bob.x, bob.y, t)
    ctx.strokeStyle = bobColor(i)
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(prev.x, prev.y)
    ctx.lineTo(s.x, s.y)
    ctx.stroke()
    prev = s
  })

  ctx.fillStyle = colors.value.text
  ctx.beginPath()
  ctx.arc(origin.x, origin.y, PIVOT_R, 0, Math.PI * 2)
  ctx.fill()

  pos.forEach((bob, i) => {
    const s = worldToScreen(bob.x, bob.y, t)
    ctx.fillStyle = bobColor(i)
    ctx.beginPath()
    ctx.arc(s.x, s.y, bobRadius(i), 0, Math.PI * 2)
    ctx.fill()
  })

  ctx.restore()
}

function animate(): void {
  if (!isRunning.value || dragTarget.value !== null) return
  try {
    if (pendulum.value) {
      pendulum.value.stepRK4(dt)
      draw()
    }
  } catch {
    // never let a transient frame error halt the loop.
  }
  animationFrame.value = requestAnimationFrame(animate)
}

function start(): void {
  if (!pendulum.value) initPendulum()
  if (isRunning.value) return
  syncPhysicsFlags()
  nudgeIfHanging()
  captureLaunchEnergy()
  isRunning.value = true
  animate()
  play()
}

function pause(): void {
  isRunning.value = false
  stop()
  if (animationFrame.value) cancelAnimationFrame(animationFrame.value)
}

function freezeSim(): void {
  isRunning.value = false
  if (animationFrame.value) cancelAnimationFrame(animationFrame.value)
}

function reset(): void {
  pause()
  params.value.theta = [...DEFAULT_THETAS]
  params.value.omega = [...DEFAULT_OMEGAS]
  initPendulum()
  draw()
}

function applyDrag(world: { x: number; y: number }): void {
  const p = pendulum.value
  const k = dragTarget.value
  if (!p || k === null) return

  const pos = p.getPositions()
  const parent = k === 0 ? { x: 0, y: 0 } : pos[k - 1]
  const dx = world.x - parent.x
  const dy = world.y - parent.y
  const theta = Math.atan2(dx, -dy)

  params.value.theta[k] = theta
  p.theta[k] = theta
  const L = clamp(Math.hypot(dx, dy), LEN_MIN, LEN_MAX)
  params.value.L[k] = L
  p.L[k] = L
  for (let i = 0; i < p.n; i++) p.omega[i] = 0

  wipeTrail()
  recordDragSample()
  draw()
}

function onPointerDown(event: PointerEvent): void {
  const canvas = canvasRef.value
  if (!canvas || !pendulum.value) return
  const t = getTransform(canvas)
  const world = pointerToWorld(event, canvas, t)
  const hit = hitTest(world, t)
  if (hit === null) return

  event.preventDefault()
  canvas.setPointerCapture(event.pointerId)
  dragTarget.value = hit
  dragSamples.value = []
  if (isRunning.value) freezeSim()
  applyDrag(world)
}

function onPointerMove(event: PointerEvent): void {
  const canvas = canvasRef.value
  if (!canvas || !pendulum.value) return
  const t = getTransform(canvas)
  const world = pointerToWorld(event, canvas, t)

  if (dragTarget.value !== null) {
    applyDrag(world)
    return
  }

  hoverTarget.value = hitTest(world, t)
}

function onPointerUp(event: PointerEvent): void {
  const canvas = canvasRef.value
  if (dragTarget.value === null) return
  if (canvas?.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId)
  }

  const p = pendulum.value
  const thrown = throwOmegas()
  if (p) {
    for (let i = 0; i < p.n; i++) {
      p.omega[i] = thrown[i] ?? 0
    }
  }

  dragTarget.value = null
  dragSamples.value = []
  start()
}

function onPointerLeave(): void {
  if (dragTarget.value === null) hoverTarget.value = null
}

function handleResize(): void {
  fitCanvas()
  draw()
}

// ---- watchers ------------------------------------------------------------

watch(
  () => [params.value.n, ...params.value.L, ...params.value.m],
  () => {
    if (!pendulum.value) return
    syncPhysicsFlags()
    if (dragTarget.value === null) wipeTrail()
    if (!isRunning.value) draw()
  },
)

watch(
  () => [...params.value.theta],
  () => {
    if (!pendulum.value || isRunning.value || dragTarget.value !== null) return
    for (let i = 0; i < MAX_N; i++) {
      pendulum.value.theta[i] = params.value.theta[i]
    }
    wipeTrail()
    draw()
  },
)

watch(gravityScale, (scale) => {
  params.value.g = EARTH_G * scale
  if (pendulum.value) pendulum.value.g = params.value.g
  if (!isRunning.value) draw()
})

watch(frictionEnabled, (on) => {
  if (pendulum.value) pendulum.value.frictionEnabled = on
})

watch(driveEnabled, (on) => {
  const p = pendulum.value
  if (!p) return
  p.driveEnabled = on
  if (on) p.captureEnergyTarget(true)
})

watch(motionFx, () => {
  hardClearCanvas()
  if (!isRunning.value) draw()
})

watch(colors, () => {
  if (!isRunning.value) draw()
})

onMounted(() => {
  initPendulum()
  draw()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  cancelAnimationFrame(animationFrame.value)
  stop()
})
</script>

<template>
  <div ref="pgRoot" class="pg">
    <canvas
      ref="canvasRef"
      class="pg-canvas"
      :class="{ 'pg-grab': hoverTarget !== null && dragTarget === null, 'pg-grabbing': dragTarget !== null }"
      aria-label="Interactive pendulum simulation"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerleave="onPointerLeave"
    />

    <div class="pg-toolbar">
      <div class="pg-buttons">
        <VdButton
          variant="primary"
          data-tooltip="Starts and stops the simulation and the sound."
          data-tooltip-placement="bottom"
          @click="isRunning ? pause() : start()"
        >
          {{ isRunning ? 'Pause' : 'Play' }}
        </VdButton>
        <VdButton
          variant="secondary"
          data-tooltip="Returns the pendulum to its starting pose and clears the trails."
          data-tooltip-placement="bottom"
          @click="reset"
        >
          Reset
        </VdButton>
      </div>
      <div class="pg-switches">
        <VdSwitch
          v-model="frictionEnabled"
          label="Friction"
          data-tooltip="Slowly drains the swing's energy, like air resistance. Turn it off for a pendulum that never stops."
          data-tooltip-placement="bottom"
        />
        <VdSwitch
          v-model="driveEnabled"
          label="Keep swinging"
          data-tooltip="Quietly pumps energy back in so the pendulum never settles down."
          data-tooltip-placement="bottom"
        />
        <VdSwitch
          v-model="motionFx"
          label="Motion FX"
          data-tooltip="Turns the trails into soft, fading ghost lines that glow behind each sphere."
          data-tooltip-placement="bottom"
        />
      </div>
    </div>

    <div class="pg-grid">
      <VdSlider
        v-model="params.n"
        :min="MIN_N"
        :max="MAX_N"
        :step="1"
        :label="`Spheres: ${params.n}`"
        data-tooltip="How many arms hang in the chain — from 2 up to 8. Every extra arm multiplies the chaos."
        data-tooltip-placement="top"
      />
      <VdSlider
        v-model="gravityScale"
        :min="0.25"
        :max="2"
        :step="0.05"
        :label="`Gravity: ${gravityScale.toFixed(2)}g`"
        data-tooltip="Strength of gravity as a multiple of Earth's. Lower it to float, raise it to rage."
        data-tooltip-placement="top"
      />
      <template v-for="i in params.n" :key="i">
        <VdSlider
          v-model="params.L[i - 1]"
          :min="LEN_MIN"
          :max="LEN_MAX"
          :step="1"
          :label="`Length ${i}: ${params.L[i - 1].toFixed(0)}px`"
          :data-tooltip="`Length of arm ${i}. You can also grab the sphere itself and stretch or shrink it.`"
          data-tooltip-placement="top"
        />
        <VdSlider
          v-model="params.m[i - 1]"
          :min="0.5"
          :max="3"
          :step="0.1"
          :label="`Mass ${i}: ${params.m[i - 1].toFixed(1)}`"
          :data-tooltip="`Mass of sphere ${i}. Heavier spheres carry more momentum.`"
          data-tooltip-placement="top"
        />
        <VdSlider
          v-model="params.theta[i - 1]"
          :min="MIN_ANGLE"
          :max="MAX_ANGLE"
          :step="0.01"
          :label="`θ${i}: ${deg(params.theta[i - 1])}`"
          :data-tooltip="`Starting angle of arm ${i}, measured from hanging straight down.`"
          data-tooltip-placement="top"
        />
      </template>
    </div>

    <div class="pg-sound">
      <div class="pg-sound-head">
        <span class="pg-title">Sound</span>
        <div class="pg-switches">
          <VdSwitch
            v-model="mixer.muted"
            label="Mute"
            data-tooltip="Silences the synth without stopping the simulation."
            data-tooltip-placement="bottom"
          />
          <VdSwitch
            v-model="mixer.followMotion"
            label="Follow pendulum"
            data-tooltip="The pendulum plays the synth: pitch follows the outer sphere's angle, the filter tracks energy, and tremolo tracks how close the spheres get."
            data-tooltip-placement="bottom"
          />
        </div>
      </div>
      <div class="pg-grid">
        <label
          class="pg-field"
          data-tooltip="Tone shape: sine (soft), triangle (mellow), saw (bright), square (hollow)."
          data-tooltip-placement="top"
        >
          <span class="pg-field-label">Wave</span>
          <VdSelect v-model="mixer.waveform" name="waveform" :options="waveforms" />
        </label>
        <VdSlider
          v-model="mixer.volume"
          :min="0"
          :max="1"
          :step="0.01"
          :label="`Volume: ${mixer.volume.toFixed(2)}`"
          data-tooltip="Master volume of the synth."
          data-tooltip-placement="top"
        />
        <VdSlider
          v-model="mixer.pitch"
          :min="80"
          :max="1200"
          :step="1"
          :disabled="mixer.followMotion"
          :label="`Pitch: ${Math.round(mixer.pitch)} Hz`"
          data-tooltip="Base tone frequency when not following the pendulum."
          data-tooltip-placement="top"
        />
        <VdSlider
          v-model="mixer.cutoff"
          :min="200"
          :max="8000"
          :step="10"
          :disabled="mixer.followMotion"
          :label="`Cutoff: ${Math.round(mixer.cutoff)} Hz`"
          data-tooltip="Low-pass filter cutoff — low sounds muffled, high sounds bright."
          data-tooltip-placement="top"
        />
        <VdSlider
          v-model="mixer.q"
          :min="0.5"
          :max="18"
          :step="0.1"
          :label="`Resonance: ${mixer.q.toFixed(1)}`"
          data-tooltip="How sharply the filter peaks at the cutoff frequency."
          data-tooltip-placement="top"
        />
        <VdSlider
          v-model="mixer.drive"
          :min="0"
          :max="1"
          :step="0.01"
          :label="`Drive: ${mixer.drive.toFixed(2)}`"
          data-tooltip="Warm saturation that adds grit to the tone."
          data-tooltip-placement="top"
        />
        <VdSlider
          v-model="mixer.delayTime"
          :min="0"
          :max="0.8"
          :step="0.01"
          :label="`Delay: ${mixer.delayTime.toFixed(2)}s`"
          data-tooltip="Echo time — the tone repeats after this many seconds."
          data-tooltip-placement="top"
        />
        <VdSlider
          v-model="mixer.delayFeedback"
          :min="0"
          :max="0.85"
          :step="0.01"
          :label="`Feedback: ${mixer.delayFeedback.toFixed(2)}`"
          data-tooltip="How much of the echo feeds back into itself, stacking into layers."
          data-tooltip-placement="top"
        />
        <VdSlider
          v-model="mixer.lfoRate"
          :min="0.1"
          :max="20"
          :step="0.1"
          :disabled="mixer.followMotion"
          :label="`LFO rate: ${mixer.lfoRate.toFixed(1)} Hz`"
          data-tooltip="Tremolo speed — how fast the volume wobbles."
          data-tooltip-placement="top"
        />
        <VdSlider
          v-model="mixer.lfoDepth"
          :min="0"
          :max="0.4"
          :step="0.01"
          :disabled="mixer.followMotion"
          :label="`LFO depth: ${mixer.lfoDepth.toFixed(2)}`"
          data-tooltip="Tremolo strength — how deep the volume wobbles."
          data-tooltip-placement="top"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.pg {
  margin: 2rem 0;
  padding: 1rem;
  border: 1px solid var(--vd-border-color);
  border-radius: var(--vd-border-radius-lg);
  background: var(--vd-bg-primary);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: left;
}

.pg-canvas {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 10;
  min-height: 300px;
  max-height: 480px;
  border: 1px solid var(--vd-border-color);
  border-radius: var(--vd-border-radius);
  background: var(--vd-bg-primary);
  touch-action: none;
}

.pg-canvas.pg-grab {
  cursor: grab;
}

.pg-canvas.pg-grabbing {
  cursor: grabbing;
}

.pg-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}

.pg-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.pg-switches {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  align-items: center;
}

.pg-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem 1.25rem;
}

.pg-sound {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  border-top: 1px solid var(--vd-border-subtle, var(--vd-border-color));
  padding-top: 1rem;
}

.pg-sound-head {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}

.pg-title {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--vd-text-primary);
}

.pg-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.pg-field-label {
  font-size: 0.85rem;
  color: var(--vd-text-secondary);
}

@media (max-width: 767px) {
  .pg-grid {
    grid-template-columns: 1fr;
  }
}
</style>
