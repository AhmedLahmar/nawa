/* ============================================================
   NAWA - Counselor version history (kept separate from the review
   engine so pages can read history without loading the engine)
   ============================================================ */

import { Injectable, signal } from '@angular/core';
import type { CounselorReview, IdeaSnapshot } from './counselor';
import { newId, readJson, writeJson } from './demo';

/* ---------------- version history ---------------- */

export interface ReviewVersion {
  id: string;
  startupId: string;
  version: number;
  idea: IdeaSnapshot;
  review: CounselorReview;
}

const HISTORY_KEY = 'nawa.counselor.v1';

/** Stores every review per startup so users can compare before/after editing their idea. */
@Injectable({ providedIn: 'root' })
export class CounselorHistory {
  private readonly all = signal<ReviewVersion[]>(readJson<ReviewVersion[]>(HISTORY_KEY, []));

  versionsOf = (startupId: string) =>
    this.all().filter(v => v.startupId === startupId).sort((a, b) => b.version - a.version);

  latest = (startupId: string) => this.versionsOf(startupId)[0];
  byId = (id?: string | null) => (id ? this.all().find(v => v.id === id) : undefined);

  add(startupId: string, idea: IdeaSnapshot, review: CounselorReview): ReviewVersion {
    const version = (this.latest(startupId)?.version ?? 0) + 1;
    const v: ReviewVersion = { id: newId('rv'), startupId, version, idea, review };
    this.all.update(l => [v, ...l]);
    writeJson(HISTORY_KEY, this.all());
    return v;
  }

  clear(startupId: string): void {
    this.all.update(l => l.filter(v => v.startupId !== startupId));
    writeJson(HISTORY_KEY, this.all());
  }
}
