/* ============================================================
   NAWA — Generate-my-project wizard: pure step logic + drafts
   Everything here is framework-free so it can be unit tested.
   ============================================================ */

import { Injectable } from '@angular/core';
import { Person, Startup } from '../core/models';
import { CounselorReview } from './counselor';
import { readJson, writeJson } from './demo';
import { ControlLevel, ProjectBrief, ProjectPrefs, RepoAccount } from './project';

export type StepId = 'control' | 'brief' | 'preferences' | 'repository' | 'plan' | 'generating' | 'result';

export const STEP_LABELS: Record<StepId, string> = {
  control: 'Control level',
  brief: 'Project brief',
  preferences: 'Preferences',
  repository: 'Repository',
  plan: 'Plan review',
  generating: 'Generation',
  result: 'Result',
};

export interface WizardDraft {
  startupId: string;
  reviewId?: string;
  level: ControlLevel | null;
  step: StepId;
  brief: ProjectBrief;
  prefs: ProjectPrefs;
  updatedAt: string;
}

/** Steps shown for a control level. Autopilot skips preferences entirely. */
export function visibleSteps(level: ControlLevel | null): StepId[] {
  const all: StepId[] = ['control', 'brief', 'preferences', 'repository', 'plan', 'generating', 'result'];
  return level === 'autopilot' ? all.filter(s => s !== 'preferences') : all;
}

/** Why the user cannot continue from a step yet, or null when they can. */
export function blocker(step: StepId, d: WizardDraft, account: RepoAccount | null): string | null {
  switch (step) {
    case 'control': return d.level ? null : 'Choose how much control you want.';
    case 'brief':
      if (!d.brief.name.trim()) return 'Give the project a name.';
      if (d.brief.summary.trim().length < 20) return 'Describe what we will build in at least a sentence (20+ characters).';
      return null;
    case 'preferences':
      if (!d.prefs.stack) return 'Pick what to build it with.';
      if (d.prefs.destination !== 'zip' && !d.prefs.hosting) return 'Pick where it will be hosted.';
      return null;
    case 'repository':
      if (d.prefs.destination === 'zip') return null;
      if (!account) return `Connect your ${d.prefs.destination === 'gitlab' ? 'GitLab' : 'GitHub'} account, or choose Download as ZIP.`;
      if (account.provider !== d.prefs.destination) return `You are connected to ${account.name}, but the destination is ${d.prefs.destination === 'gitlab' ? 'GitLab' : 'GitHub'}.`;
      return null;
    default: return null;
  }
}

export const canAdvance = (step: StepId, d: WizardDraft, account: RepoAccount | null) => blocker(step, d, account) === null;

/**
 * Next step. Autopilot skips the repository step when the right account is
 * already connected, so it reaches the plan review in as few clicks as possible.
 */
export function nextStep(step: StepId, d: WizardDraft, account: RepoAccount | null): StepId {
  const steps = visibleSteps(d.level);
  let i = steps.indexOf(step);
  if (i < 0) i = 0;
  let next = steps[Math.min(i + 1, steps.length - 1)];
  if (next === 'repository' && d.level === 'autopilot' && canAdvance('repository', d, account)) next = 'plan';
  return next;
}

export function prevStep(step: StepId, d: WizardDraft): StepId {
  const steps = visibleSteps(d.level);
  const i = steps.indexOf(step);
  if (step === 'generating' || step === 'result') return 'plan';
  return steps[Math.max(0, i - 1)];
}

/** Which steps the progress indicator should show as done. */
export function stepState(step: StepId, current: StepId, level: ControlLevel | null): 'done' | 'current' | 'todo' {
  const steps = visibleSteps(level);
  const a = steps.indexOf(step), b = steps.indexOf(current);
  return a < b ? 'done' : a === b ? 'current' : 'todo';
}

/** Sensible defaults for Autopilot: we decide, the user approves on the plan review. */
export function autopilotPrefs(prefs: ProjectPrefs, skills: string[]): ProjectPrefs {
  return { ...prefs, stack: suggestStack(skills), hosting: 'netlify', destination: prefs.destination === 'zip' ? 'zip' : 'github',
    visibility: 'private', ci: true, structure: 'feature', envSetup: 'dotenv', license: 'MIT' };
}

export function suggestStack(skills: string[]): string {
  const s = skills.join(' ').toLowerCase();
  if (/flutter|mobile/.test(s)) return 'flutter';
  if (/python|ml|nlp|data/.test(s)) return 'fastapi';
  return 'angular-supabase';
}

/** Prefill a draft from the user's profile, their startup and (optionally) a counselor review. */
export function initialDraft(me: Person, s: Startup, review?: { id: string; review: CounselorReview }): WizardDraft {
  const features = s.solution.split(/[·.;\n]/).map(x => x.trim()).filter(x => x.length > 6).slice(0, 4);
  return {
    startupId: s.id,
    reviewId: review?.id,
    level: null,
    step: 'control',
    brief: {
      name: s.name,
      summary: `${s.tagline} ${firstSentence(s.solution)}`.trim(),
      audience: firstSentence(s.problem),
      goals: review ? review.review.nextSteps.slice() : ['Get the first version in front of 5 real users', 'Measure the one metric that proves value'],
      features: features.length ? features : ['Sign up and sign in', 'Core workflow', 'Simple dashboard'],
    },
    prefs: {
      stack: suggestStack(me.skills), hosting: 'netlify', destination: 'github', visibility: 'private',
      ci: true, structure: 'feature', envSetup: 'dotenv', license: 'MIT',
    },
    updatedAt: new Date().toISOString(),
  };
}

function firstSentence(t: string): string {
  const m = t.trim().match(/^[^.!?]+[.!?]?/);
  return (m ? m[0] : t).trim();
}

/* ---------------- draft storage ---------------- */

const DRAFT_KEY = 'nawa.generate.v1';

@Injectable({ providedIn: 'root' })
export class WizardDrafts {
  load(startupId: string): WizardDraft | null {
    return readJson<Record<string, WizardDraft>>(DRAFT_KEY, {})[startupId] ?? null;
  }
  save(d: WizardDraft): void {
    const all = readJson<Record<string, WizardDraft>>(DRAFT_KEY, {});
    all[d.startupId] = { ...d, updatedAt: new Date().toISOString() };
    writeJson(DRAFT_KEY, all);
  }
  clear(startupId: string): void {
    const all = readJson<Record<string, WizardDraft>>(DRAFT_KEY, {});
    delete all[startupId];
    writeJson(DRAFT_KEY, all);
  }
}
