export const PX_PER_M = 100;
export const EARTH_G = 9.81 * PX_PER_M;
export const FRICTION_COEFF = 0.25;
export const DRIVE_COEFF = 0.35;
export const MIN_N = 2;
export const MAX_N = 8;
export const OMEGA_CLAMP = 25;
export const DEFAULT_THETA1 = Math.PI / 3;
export const DEFAULT_THETA2 = Math.PI / 2;

export const DEFAULT_LENGTHS = [120, 100, 90, 90, 90, 80, 80, 70];
export const DEFAULT_MASSES = [1, 1, 1, 1, 1, 1, 1, 1];
export const DEFAULT_THETAS = [
  DEFAULT_THETA1,
  DEFAULT_THETA2,
  (2 * Math.PI) / 3,
  Math.PI / 4,
  (3 * Math.PI) / 4,
  Math.PI / 5,
  (2 * Math.PI) / 5,
  (4 * Math.PI) / 5,
];
export const DEFAULT_OMEGAS = [0, 0, 0, 0, 0, 0, 0, 0];

export interface DoublePendulumParams {
  n: number;
  L: number[];
  m: number[];
  theta: number[];
  omega: number[];
  g: number;
}

export interface PhysicsMetrics {
  distance: number;
  kineticEnergy: number;
  potentialEnergy: number;
  totalEnergy: number;
  phase1: { theta: number; omega: number };
  phase2: { theta: number; omega: number };
}

export interface BobPosition {
  x: number;
  y: number;
}

function clampN(n: number): number {
  return Math.min(MAX_N, Math.max(MIN_N, Math.round(n)));
}

function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let k = 0; k < n; k++) {
    let piv = k;
    for (let i = k + 1; i < n; i++) {
      if (Math.abs(M[i][k]) > Math.abs(M[piv][k])) piv = i;
    }
    const swap = M[k];
    M[k] = M[piv];
    M[piv] = swap;
    const diag = M[k][k] === 0 ? 1e-12 : M[k][k];
    for (let i = k + 1; i < n; i++) {
      const f = M[i][k] / diag;
      for (let j = k; j <= n; j++) {
        M[i][j] -= f * M[k][j];
      }
    }
  }

  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n];
    for (let j = i + 1; j < n; j++) {
      s -= M[i][j] * x[j];
    }
    const diag = M[i][i] === 0 ? 1e-12 : M[i][i];
    x[i] = s / diag;
  }
  return x;
}

export class DoublePendulum {
  n: number;
  L: number[];
  m: number[];
  theta: number[];
  omega: number[];
  g: number;

  frictionEnabled: boolean = true;
  driveEnabled: boolean = false;
  frictionCoeff: number = FRICTION_COEFF;
  driveCoeff: number = DRIVE_COEFF;
  energyTarget: number | null = null;

  time: number = 0;
  history: PhysicsMetrics[] = [];

  constructor(params: DoublePendulumParams) {
    this.n = clampN(params.n);
    this.L = padArray(params.L, DEFAULT_LENGTHS);
    this.m = padArray(params.m, DEFAULT_MASSES);
    this.theta = padArray(params.theta, DEFAULT_THETAS);
    this.omega = padArray(params.omega, DEFAULT_OMEGAS);
    this.g = params.g;
  }

  setN(next: number): void {
    this.n = clampN(next);
    for (let i = 0; i < MAX_N; i++) {
      if (this.L[i] == null) this.L[i] = DEFAULT_LENGTHS[i];
      if (this.m[i] == null) this.m[i] = DEFAULT_MASSES[i];
      if (this.theta[i] == null) this.theta[i] = DEFAULT_THETAS[i];
      if (this.omega[i] == null) this.omega[i] = 0;
    }
  }

  getPositions(): BobPosition[] {
    return this.positionsOf(this.theta);
  }

  getMetrics(): PhysicsMetrics {
    return this.metricsOf(this.theta, this.omega);
  }

  raisedRestEnergy(): number {
    return this.metricsOf(DEFAULT_THETAS, DEFAULT_OMEGAS).totalEnergy;
  }

  captureEnergyTarget(floorRaised = false): void {
    const current = this.getMetrics().totalEnergy;
    this.energyTarget = floorRaised
      ? Math.max(current, this.raisedRestEnergy())
      : current;
  }

  totalLength(): number {
    let sum = 0;
    for (let i = 0; i < this.n; i++) sum += this.L[i];
    return sum;
  }

  private positionsOf(theta: number[]): BobPosition[] {
    const out: BobPosition[] = [];
    let x = 0;
    let y = 0;
    for (let i = 0; i < this.n; i++) {
      x += this.L[i] * Math.sin(theta[i]);
      y -= this.L[i] * Math.cos(theta[i]);
      out.push({ x, y });
    }
    return out;
  }

  private metricsOf(theta: number[], omega: number[]): PhysicsMetrics {
    const pos = this.positionsOf(theta);
    let vx = 0;
    let vy = 0;
    let KE = 0;
    let PE = 0;

    for (let i = 0; i < this.n; i++) {
      vx += this.L[i] * omega[i] * Math.cos(theta[i]);
      vy += this.L[i] * omega[i] * Math.sin(theta[i]);
      KE += 0.5 * this.m[i] * (vx * vx + vy * vy);
      PE += this.m[i] * this.g * pos[i].y;
    }

    const tip = pos[this.n - 1];
    const distance = Math.hypot(tip.x, tip.y);
    const last = this.n - 1;

    return {
      distance,
      kineticEnergy: KE,
      potentialEnergy: PE,
      totalEnergy: KE + PE,
      phase1: { theta: theta[0], omega: omega[0] },
      phase2: { theta: theta[last], omega: omega[last] },
    };
  }

  private massAbove(index: number): number {
    let sum = 0;
    for (let k = index; k < this.n; k++) sum += this.m[k];
    return sum;
  }

  private accelerations(theta: number[], omega: number[]): number[] {
    const n = this.n;
    const M: number[][] = [];
    const rhs: number[] = [];

    for (let i = 0; i < n; i++) {
      M[i] = [];
      let c = 0;
      for (let j = 0; j < n; j++) {
        const mu = this.massAbove(Math.max(i, j));
        M[i][j] = mu * this.L[i] * this.L[j] * Math.cos(theta[i] - theta[j]);
        c +=
          mu *
          this.L[i] *
          this.L[j] *
          Math.sin(theta[i] - theta[j]) *
          omega[j] *
          omega[j];
      }
      const gravity = this.g * this.massAbove(i) * this.L[i] * Math.sin(theta[i]);
      let q = 0;
      const friction = this.frictionEnabled ? this.frictionCoeff : 0;
      q -= friction * omega[i];
      rhs[i] = -c - gravity + q;
    }

    if (this.driveEnabled && this.energyTarget !== null) {
      const energy = this.metricsOf(theta, omega).totalEnergy;
      if (energy < this.energyTarget) {
        let moving = 0;
        for (let i = 0; i < n; i++) {
          rhs[i] += this.driveCoeff * omega[i];
          moving += Math.abs(omega[i]);
        }
        if (moving < 0.05) rhs[0] += 1.2;
      }
    }

    const alpha = solveLinearSystem(M, rhs);
    for (let i = 0; i < n; i++) {
      if (!Number.isFinite(alpha[i])) alpha[i] = 0;
    }
    return alpha;
  }

  private computeDerivatives(state: number[]): number[] {
    const n = this.n;
    const theta: number[] = [];
    const omega: number[] = [];
    for (let i = 0; i < n; i++) {
      theta[i] = state[2 * i];
      omega[i] = state[2 * i + 1];
    }
    const alpha = this.accelerations(theta, omega);
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
      out.push(omega[i], alpha[i]);
    }
    return out;
  }

  stepRK4(dt: number): void {
    const n = this.n;
    const state: number[] = [];
    for (let i = 0; i < n; i++) {
      state.push(this.theta[i], this.omega[i]);
    }

    const k1 = this.computeDerivatives(state);
    const k2 = this.computeDerivatives(
      state.map((s, i) => s + 0.5 * dt * k1[i]),
    );
    const k3 = this.computeDerivatives(
      state.map((s, i) => s + 0.5 * dt * k2[i]),
    );
    const k4 = this.computeDerivatives(state.map((s, i) => s + dt * k3[i]));

    for (let i = 0; i < state.length; i++) {
      state[i] += (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    }

    for (let i = 0; i < n; i++) {
      this.theta[i] = state[2 * i];
      this.omega[i] = Math.max(
        -OMEGA_CLAMP,
        Math.min(OMEGA_CLAMP, state[2 * i + 1]),
      );
    }
    this.time += dt;

    const metrics = this.getMetrics();
    this.history.push(metrics);
    if (this.history.length > 10000) this.history.shift();
  }

  reset(): void {
    this.time = 0;
    this.history = [];
  }

  getEnergyDrift(): number {
    if (this.history.length < 2) return 0;
    const initial = this.history[0].totalEnergy;
    const current = this.history[this.history.length - 1].totalEnergy;
    return Math.abs(current - initial);
  }
}

function padArray(values: number[], fallback: number[]): number[] {
  const out = fallback.slice();
  for (let i = 0; i < Math.min(values.length, MAX_N); i++) {
    out[i] = values[i];
  }
  return out;
}
