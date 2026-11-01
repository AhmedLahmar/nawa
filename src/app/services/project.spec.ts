import { TestBed } from '@angular/core/testing';
import { CancelledError, DemoSettings } from './demo';
import {
  GenerationError, MockRepoApi, ProjectApi, ProjectBrief, ProjectPrefs, RepoAccount, RepoApi, buildPlan, slugify,
} from './project';

const brief: ProjectBrief = { name: 'Ghalla Box', summary: 'Weekly produce boxes from local farms.', audience: 'Restaurants in Tunis', goals: [], features: [] };
const prefs: ProjectPrefs = {
  stack: 'angular-supabase', hosting: 'netlify', destination: 'github', visibility: 'private',
  ci: true, structure: 'feature', envSetup: 'dotenv', license: 'MIT',
};
const gh: RepoAccount = { provider: 'github', handle: 'ahmedbenali', name: 'GitHub', connectedAt: '' };
const ACCOUNT_KEY = 'nawa.repo-account.v1';

describe('RepoApi (mock)', () => {
  let repo: RepoApi;
  let demo: DemoSettings;
  beforeEach(() => {
    localStorage.removeItem(ACCOUNT_KEY);
    demo = TestBed.inject(DemoSettings);
    demo.speed.set(0);
    repo = TestBed.inject(RepoApi);
  });
  afterEach(() => localStorage.removeItem(ACCOUNT_KEY));

  it('is the mock by default and starts disconnected', () => {
    expect(repo instanceof MockRepoApi).toBeTrue();
    expect(repo.account()).toBeNull();
  });

  it('connects an existing account and remembers it', async () => {
    const acc = await repo.connect('github', 'ahmedbenali');
    expect(acc).toEqual(jasmine.objectContaining({ provider: 'github', handle: 'ahmedbenali' }));
    TestBed.resetTestingModule();
    expect(TestBed.inject(RepoApi).account()?.handle).toBe('ahmedbenali');
  });

  it('disconnects', async () => {
    await repo.connect('gitlab', 'x');
    repo.disconnect();
    expect(repo.account()).toBeNull();
  });

  it('leaves no account behind when the connection fails', async () => {
    demo.failNext('connect');
    await expectAsync(repo.connect('github', 'x')).toBeRejected();
    expect(repo.account()).toBeNull();
  });

  it('only offers connect/disconnect — it never creates accounts', () => {
    const methods = Object.getOwnPropertyNames(MockRepoApi.prototype).filter(m => m !== 'constructor');
    expect(methods.sort()).toEqual(['connect', 'disconnect']);
  });
});

describe('buildPlan', () => {
  it('describes a GitHub repo, CI and deploy for Guided', () => {
    const p = buildPlan(brief, prefs, gh, 'guided');
    expect(p.repo?.url).toBe('https://github.com/ahmedbenali/ghalla-box');
    expect(p.ci?.file).toBe('.github/workflows/ci.yml');
    expect(p.deploy?.url).toBe('https://ghalla-box.netlify.app');
    expect(p.branches).toEqual(['main']);
    expect(p.files.map(f => f.path)).toContain('README.md');
  });

  it('uses GitLab CI for GitLab', () => {
    const p = buildPlan(brief, { ...prefs, destination: 'gitlab' }, { ...gh, provider: 'gitlab' }, 'guided');
    expect(p.ci?.file).toBe('.gitlab-ci.yml');
    expect(p.repo?.url).toContain('gitlab.com');
  });

  it('creates nothing remote for ZIP', () => {
    const p = buildPlan(brief, { ...prefs, destination: 'zip' }, null, 'guided');
    expect(p.repo).toBeUndefined();
    expect(p.deploy).toBeUndefined();
    expect(p.branches).toEqual([]);
  });

  it('honours Hands-on options and ignores them otherwise', () => {
    const hands = { ...prefs, ci: false, license: 'Proprietary' as const, envSetup: 'docker' as const };
    const h = buildPlan(brief, hands, gh, 'handson');
    expect(h.ci).toBeUndefined();
    expect(h.files.some(f => f.path === 'LICENSE')).toBeFalse();
    expect(h.files.some(f => f.path === 'docker-compose.yml')).toBeTrue();
    expect(h.branches).toEqual(['main', 'develop']);
    const g = buildPlan(brief, hands, gh, 'guided');
    expect(g.ci).toBeDefined();
    expect(g.license).toBe('MIT');
  });

  it('slugifies names', () => {
    expect(slugify('Sahtek — Santé!')).toBe('sahtek-sante');
    expect(slugify('   ')).toBe('my-project');
  });
});

describe('ProjectApi (mock)', () => {
  let api: ProjectApi;
  let demo: DemoSettings;
  beforeEach(() => {
    demo = TestBed.inject(DemoSettings);
    demo.speed.set(0);
    api = TestBed.inject(ProjectApi);
  });

  it('names the stages for a repository build and for a ZIP', () => {
    expect(api.stagesFor(buildPlan(brief, prefs, gh, 'guided')).map(s => s.key)).toEqual(['repo', 'ci', 'scaffold', 'deploy']);
    expect(api.stagesFor(buildPlan(brief, { ...prefs, destination: 'zip' }, null, 'guided')).map(s => s.key)).toEqual(['scaffold', 'package']);
  });

  it('runs every stage and returns links and next steps', async () => {
    const plan = buildPlan(brief, prefs, gh, 'guided');
    const seen: number[] = [];
    const r = await api.generate(plan, brief, ['Call 5 customers'], i => seen.push(i));
    expect(seen).toEqual([0, 1, 2, 3, 4]);
    expect(r.repoUrl).toBe(plan.repo!.url);
    expect(r.liveUrl).toBe(plan.deploy!.url);
    expect(r.nextSteps[0]).toBe('Call 5 customers');
  });

  it('produces a ZIP name instead of links for ZIP', async () => {
    const r = await api.generate(buildPlan(brief, { ...prefs, destination: 'zip' }, null, 'guided'), brief, [], () => {});
    expect(r.zipName).toBe('ghalla-box.zip');
    expect(r.repoUrl).toBeUndefined();
  });

  it('fails at scaffolding when a demo failure is armed', async () => {
    demo.failNext('generate');
    await expectAsync(api.generate(buildPlan(brief, prefs, gh, 'guided'), brief, [], () => {}))
      .toBeRejectedWith(jasmine.any(GenerationError));
  });

  it('can be cancelled', async () => {
    demo.speed.set(1);
    const ctrl = new AbortController();
    const p = api.generate(buildPlan(brief, prefs, gh, 'guided'), brief, [], () => {}, ctrl.signal);
    ctrl.abort();
    await expectAsync(p).toBeRejectedWith(jasmine.any(CancelledError));
  });
});
