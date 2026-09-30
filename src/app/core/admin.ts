/* ============================================================
   NAWA — admin authentication (demo only)
   A lightweight, signal-based "session" persisted in localStorage.
   There is no backend — this simulates an admin login so the demo
   can show a separate admin surface behind a gate.
   ============================================================ */

import { computed, Injectable, signal } from '@angular/core';

const KEY = 'nawa.admin.session.v1';

/**
 * Demo credentials. This is a front-end-only concept demo with no server,
 * so the password lives in the client on purpose. Do not treat this as
 * real security.
 */
const ADMIN_EMAIL = 'admin@nawa.tn';
const ADMIN_PASSWORD = 'nawa-admin';

export interface AdminSession {
  email: string;
  since: number;
}

@Injectable({ providedIn: 'root' })
export class AdminAuth {
  private readonly _session = signal<AdminSession | null>(this.restore());

  readonly session = this._session.asReadonly();
  readonly isAuthed = computed(() => this._session() !== null);

  /** The demo credentials, surfaced so the login page can show a hint. */
  readonly hint = { email: ADMIN_EMAIL, password: ADMIN_PASSWORD };

  /** Attempt a login. Returns null on success, or an error message. */
  login(email: string, password: string): string | null {
    const e = email.trim().toLowerCase();
    if (e !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return 'Wrong email or password. Use the demo credentials shown below.';
    }
    const session: AdminSession = { email: ADMIN_EMAIL, since: Date.now() };
    this._session.set(session);
    this.persist(session);
    return null;
  }

  logout(): void {
    this._session.set(null);
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  }

  private persist(session: AdminSession): void {
    try { localStorage.setItem(KEY, JSON.stringify(session)); } catch { /* ignore */ }
  }

  private restore(): AdminSession | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const s = JSON.parse(raw) as AdminSession;
      return s && s.email === ADMIN_EMAIL ? s : null;
    } catch {
      return null;
    }
  }
}
