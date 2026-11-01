/* ============================================================
   NAWA — demo runtime shared by the mock services
   Simulated latency, one-shot failure injection and small
   localStorage helpers. Real implementations don't need this.
   ============================================================ */

import { Injectable, signal } from '@angular/core';

export type DemoFailure = 'counselor' | 'connect' | 'generate';

@Injectable({ providedIn: 'root' })
export class DemoSettings {
  /** Multiplier for every simulated delay. Tests set this to 0. */
  readonly speed = signal(1);
  private readonly failures = signal<DemoFailure[]>([]);

  /** Make the next call of this kind fail once (used by "simulate an error" demo controls). */
  failNext(kind: DemoFailure): void {
    this.failures.update(f => (f.includes(kind) ? f : [...f, kind]));
  }

  /** Consumes a pending failure; returns true if the caller should fail now. */
  consumeFailure(kind: DemoFailure): boolean {
    if (!this.failures().includes(kind)) return false;
    this.failures.update(f => f.filter(k => k !== kind));
    return true;
  }

  isArmed = (kind: DemoFailure) => this.failures().includes(kind);
}

/** Error thrown when an AbortSignal cancels a simulated operation. */
export class CancelledError extends Error {
  constructor() { super('Cancelled'); this.name = 'CancelledError'; }
}

/** Promise-based delay that honours an AbortSignal. */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new CancelledError()); return; }
    const t = setTimeout(() => { signal?.removeEventListener('abort', onAbort); resolve(); }, ms);
    const onAbort = () => { clearTimeout(t); reject(new CancelledError()); };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** Tiny deterministic hash — the same input always yields the same mock output. */
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

export function writeJson(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable — keep in memory */ }
}

export const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
