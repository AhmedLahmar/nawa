import { TestBed } from '@angular/core/testing';
import { PEOPLE, STARTUPS } from '../core/mock-data';
import { buildReview, snapshotOf } from './counselor';
import { RepoAccount } from './project';
import {
  WizardDraft, WizardDrafts, autopilotPrefs, blocker, initialDraft, nextStep, prevStep, stepState, suggestStack, visibleSteps,
} from './wizard';

const me = PEOPLE.find(p => p.id === 'u_me')!;
const agrix = STARTUPS.find(s => s.id === 's_agrix')!;
const gh: RepoAccount = { provider: 'github', handle: 'ahmedbenali', name: 'GitHub', connectedAt: '' };
const draft = (patch: Partial<WizardDraft> = {}): WizardDraft => ({ ...initialDraft(me, agrix), ...patch });

describe('Wizard step logic', () => {
  it('skips preferences only in Autopilot', () => {
    expect(visibleSteps('autopilot')).not.toContain('preferences');
    expect(visibleSteps('guided')).toContain('preferences');
    expect(visibleSteps('handson')).toContain('preferences');
    expect(visibleSteps('autopilot')[0]).toBe('control');
    expect(visibleSteps('guided').slice(-3)).toEqual(['plan', 'generating', 'result']);
  });

  it('asks for a control level first', () => {
    expect(blocker('control', draft({ level: null }), null)).toMatch(/control/i);
    expect(blocker('control', draft({ level: 'guided' }), null)).toBeNull();
  });

  it('requires a name and a real summary in the brief', () => {
    const d = draft({ level: 'guided' });
    expect(blocker('brief', d, null)).toBeNull();
    expect(blocker('brief', { ...d, brief: { ...d.brief, name: ' ' } }, null)).toMatch(/name/i);
    expect(blocker('brief', { ...d, brief: { ...d.brief, summary: 'too short' } }, null)).toMatch(/20/);
  });

  it('requires a connected account of the right provider unless downloading a ZIP', () => {
    const d = draft({ level: 'guided' });
    expect(blocker('repository', d, null)).toMatch(/connect/i);
    expect(blocker('repository', d, gh)).toBeNull();
    expect(blocker('repository', { ...d, prefs: { ...d.prefs, destination: 'gitlab' } }, gh)).toMatch(/GitLab/);
    expect(blocker('repository', { ...d, prefs: { ...d.prefs, destination: 'zip' } }, null)).toBeNull();
  });

  it('Autopilot jumps from the brief straight to the plan when already connected', () => {
    const d = draft({ level: 'autopilot', prefs: autopilotPrefs(draft().prefs, me.skills) });
    expect(nextStep('control', d, null)).toBe('brief');
    expect(nextStep('brief', d, null)).toBe('repository');
    expect(nextStep('brief', d, gh)).toBe('plan');
  });

  it('Guided and Hands-on go through preferences', () => {
    expect(nextStep('brief', draft({ level: 'guided' }), gh)).toBe('preferences');
    expect(nextStep('preferences', draft({ level: 'handson' }), gh)).toBe('repository');
  });

  it('goes back one visible step, and back to the plan from generation', () => {
    expect(prevStep('repository', draft({ level: 'autopilot' }))).toBe('brief');
    expect(prevStep('repository', draft({ level: 'guided' }))).toBe('preferences');
    expect(prevStep('brief', draft({ level: 'guided' }))).toBe('control');
    expect(prevStep('generating', draft({ level: 'guided' }))).toBe('plan');
  });

  it('reports progress state per step', () => {
    expect(stepState('control', 'plan', 'autopilot')).toBe('done');
    expect(stepState('plan', 'plan', 'autopilot')).toBe('current');
    expect(stepState('result', 'plan', 'autopilot')).toBe('todo');
  });
});

describe('Wizard prefill', () => {
  it('fills the brief from the startup', () => {
    const d = initialDraft(me, agrix);
    expect(d.level).toBeNull();
    expect(d.step).toBe('control');
    expect(d.brief.name).toBe('AgriX');
    expect(d.brief.summary).toContain(agrix.tagline);
    expect(d.prefs.destination).toBe('github');
  });

  it('uses the counselor review next steps as goals', () => {
    const review = buildReview(snapshotOf(agrix));
    const d = initialDraft(me, agrix, { id: 'rv_1', review });
    expect(d.reviewId).toBe('rv_1');
    expect(d.brief.goals).toEqual(review.nextSteps);
  });

  it('suggests a stack from the profile skills', () => {
    expect(suggestStack(['Flutter', 'UX'])).toBe('flutter');
    expect(suggestStack(['ML', 'Speech'])).toBe('fastapi');
    expect(suggestStack(['Logistics'])).toBe('angular-supabase');
  });
});

describe('WizardDrafts', () => {
  const KEY = 'nawa.generate.v1';
  beforeEach(() => localStorage.removeItem(KEY));
  afterEach(() => localStorage.removeItem(KEY));

  it('saves, resumes and clears progress per startup', () => {
    const store = TestBed.inject(WizardDrafts);
    store.save(draft({ level: 'guided', step: 'preferences' }));
    expect(store.load('s_agrix')?.step).toBe('preferences');
    expect(store.load('s_other')).toBeNull();
    store.clear('s_agrix');
    expect(store.load('s_agrix')).toBeNull();
  });
});
