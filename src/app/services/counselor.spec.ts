import { TestBed } from '@angular/core/testing';
import { STARTUPS } from '../core/mock-data';
import { CancelledError, DemoSettings } from './demo';
import {
  CounselorApi, CounselorError, CounselorHistory, IdeaSnapshot, MockCounselorApi, REVIEW_STEPS, buildReview, ideaDiff, snapshotOf,
} from './counselor';

const weakIdea: IdeaSnapshot = {
  name: 'Fikra', industry: 'SaaS', stage: 'Idea',
  tagline: 'An AI-powered platform for everyone',
  problem: 'Businesses struggle.',
  solution: 'A seamless innovative solution.',
  businessModel: '', market: 'Huge market', traction: '', hasRevenue: false,
};

describe('Counselor review (pure)', () => {
  const agrix = snapshotOf(STARTUPS.find(s => s.id === 's_agrix')!);

  it('returns the full structured shape', () => {
    const r = buildReview(agrix);
    expect(r.scores.map(s => s.key)).toEqual(['problem', 'market', 'feasibility', 'differentiation']);
    for (const s of r.scores) { expect(s.score).toBeGreaterThanOrEqual(1); expect(s.score).toBeLessThanOrEqual(10); expect(s.reason.length).toBeGreaterThan(10); }
    expect(r.nextSteps.length).toBe(3);
    expect(r.assumptions.length).toBeGreaterThan(0);
    expect(r.verdictLabel).toBeTruthy();
  });

  it('always includes at least one genuinely critical point', () => {
    for (const idea of [agrix, weakIdea, ...STARTUPS.map(snapshotOf)]) {
      expect(buildReview(idea).risks.some(r => r.severity === 'critical')).withContext(idea.name).toBeTrue();
    }
  });

  it('is candid about a weak, generic, unpaid idea', () => {
    const r = buildReview(weakIdea);
    expect(r.verdict).not.toBe('promising');
    expect(r.risks[0].text).toMatch(/paid/i);
    expect(r.scores.find(s => s.key === 'differentiation')!.reason).toMatch(/generic/i);
  });

  it('is deterministic for the same idea', () => {
    const now = new Date('2026-09-01T10:00:00Z');
    expect(buildReview(agrix, now)).toEqual(buildReview(agrix, now));
  });

  it('reports which idea fields changed between versions', () => {
    const edited = { ...weakIdea, problem: 'Shops lose 6% of revenue to stockouts every month.' };
    expect(ideaDiff(weakIdea, edited).map(d => d.field)).toEqual(['problem']);
  });
});

describe('MockCounselorApi', () => {
  let api: CounselorApi;
  let demo: DemoSettings;
  beforeEach(() => {
    demo = TestBed.inject(DemoSettings);
    demo.speed.set(0);
    api = TestBed.inject(CounselorApi);
  });

  it('is the default CounselorApi implementation', () => {
    expect(api instanceof MockCounselorApi).toBeTrue();
  });

  it('reports progress through every named step', async () => {
    const seen: number[] = [];
    await api.review(weakIdea, p => seen.push(p.step));
    expect(seen).toEqual([0, 1, 2, 3, REVIEW_STEPS.length]);
  });

  it('fails once when a demo failure is armed, then succeeds', async () => {
    demo.failNext('counselor');
    await expectAsync(api.review(weakIdea)).toBeRejectedWithError(CounselorError);
    await expectAsync(api.review(weakIdea)).toBeResolved();
  });

  it('can be cancelled', async () => {
    const ctrl = new AbortController();
    demo.speed.set(1);
    const p = api.review(weakIdea, undefined, ctrl.signal);
    ctrl.abort();
    await expectAsync(p).toBeRejectedWith(jasmine.any(CancelledError));
  });
});

describe('CounselorHistory', () => {
  const KEY = 'nawa.counselor.v1';
  beforeEach(() => localStorage.removeItem(KEY));
  afterEach(() => localStorage.removeItem(KEY));

  it('numbers versions per startup and lists newest first', () => {
    const h = TestBed.inject(CounselorHistory);
    const r = buildReview(weakIdea);
    h.add('s_a', weakIdea, r);
    h.add('s_a', weakIdea, r);
    h.add('s_b', weakIdea, r);
    expect(h.versionsOf('s_a').map(v => v.version)).toEqual([2, 1]);
    expect(h.latest('s_b')!.version).toBe(1);
    expect(h.byId(h.latest('s_a')!.id)).toBeTruthy();
  });

  it('persists across service instances', () => {
    TestBed.inject(CounselorHistory).add('s_a', weakIdea, buildReview(weakIdea));
    TestBed.resetTestingModule();
    expect(TestBed.inject(CounselorHistory).versionsOf('s_a').length).toBe(1);
  });
});
