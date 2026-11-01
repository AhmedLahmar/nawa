/* ============================================================
   NAWA — "Generate my project" service layer
   RepoApi:    connect an EXISTING GitHub/GitLab account (OAuth in a
               real build). Never creates accounts.
   ProjectApi: turn a draft into a concrete plan, then run it.
   Both are mocked: nothing is created anywhere.
   ============================================================ */

import { Injectable, inject, signal } from '@angular/core';
import { CancelledError, DemoSettings, delay, readJson, writeJson } from './demo';

/* ---------------- shared types ---------------- */

export type ControlLevel = 'autopilot' | 'guided' | 'handson';
export type RepoProvider = 'github' | 'gitlab';
export type Destination = RepoProvider | 'zip';

export interface ProjectBrief {
  name: string;
  summary: string;
  audience: string;
  goals: string[];
  features: string[];
}

export interface ProjectPrefs {
  stack: string;
  hosting: string;
  destination: Destination;
  visibility: 'private' | 'public';
  // Hands-on only
  ci: boolean;
  structure: 'feature' | 'layer' | 'monorepo';
  envSetup: 'dotenv' | 'devcontainer' | 'docker' | 'none';
  license: 'MIT' | 'Apache-2.0' | 'Proprietary';
}

export interface RepoAccount { provider: RepoProvider; handle: string; name: string; connectedAt: string; }

export interface PlanFile { path: string; note: string; }

export interface GenerationPlan {
  destination: Destination;
  repo?: { provider: RepoProvider; owner: string; name: string; visibility: 'private' | 'public'; url: string };
  branches: string[];
  ci?: { file: string; steps: string[] };
  deploy?: { host: string; url: string; trigger: string };
  readme: string[];
  files: PlanFile[];
  stack: string;
  license: string;
}

export interface GenerationStage { key: string; label: string; }
export interface GenerationResult {
  plan: GenerationPlan;
  repoUrl?: string;
  liveUrl?: string;
  zipName?: string;
  generated: string[];
  nextSteps: string[];
  finishedAt: string;
}

export class GenerationError extends Error {
  constructor(message: string, readonly stage: string) { super(message); this.name = 'GenerationError'; }
}

export const STACKS = [
  { id: 'angular-supabase', label: 'Angular + Supabase', plain: 'Web app with accounts and a database' },
  { id: 'next', label: 'Next.js', plain: 'Fast website with pages that load instantly' },
  { id: 'react-node', label: 'React + Node API', plain: 'Web app with your own server' },
  { id: 'flutter', label: 'Flutter', plain: 'Mobile app for Android and iPhone' },
  { id: 'fastapi', label: 'Python FastAPI', plain: 'Backend API, good for data and AI work' },
] as const;

export const HOSTS = [
  { id: 'netlify', label: 'Netlify' },
  { id: 'vercel', label: 'Vercel' },
  { id: 'render', label: 'Render' },
] as const;

/* ---------------- RepoApi ---------------- */

/** Connects an account the user already has. A real build runs the provider's OAuth flow here. */
@Injectable({ providedIn: 'root', useFactory: () => inject(MockRepoApi) })
export abstract class RepoApi {
  abstract readonly account: () => RepoAccount | null;
  abstract connect(provider: RepoProvider, suggestedHandle: string): Promise<RepoAccount>;
  abstract disconnect(): void;
}

const ACCOUNT_KEY = 'nawa.repo-account.v1';

@Injectable({ providedIn: 'root' })
export class MockRepoApi extends RepoApi {
  private demo = inject(DemoSettings);
  private readonly _account = signal<RepoAccount | null>(readJson<RepoAccount | null>(ACCOUNT_KEY, null));
  readonly account = this._account.asReadonly();

  async connect(provider: RepoProvider, suggestedHandle: string): Promise<RepoAccount> {
    await delay(900 * this.demo.speed());
    if (this.demo.consumeFailure('connect')) {
      throw new Error(`${provider === 'github' ? 'GitHub' : 'GitLab'} did not respond. No permissions were granted — try again.`);
    }
    const acc: RepoAccount = {
      provider, handle: suggestedHandle.replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'founder',
      name: provider === 'github' ? 'GitHub' : 'GitLab', connectedAt: new Date().toISOString(),
    };
    this._account.set(acc);
    writeJson(ACCOUNT_KEY, acc);
    return acc;
  }

  disconnect(): void {
    this._account.set(null);
    try { localStorage.removeItem(ACCOUNT_KEY); } catch { /* ignore */ }
  }
}

/* ---------------- ProjectApi ---------------- */

@Injectable({ providedIn: 'root', useFactory: () => inject(MockProjectApi) })
export abstract class ProjectApi {
  abstract stagesFor(plan: GenerationPlan): GenerationStage[];
  abstract generate(plan: GenerationPlan, brief: ProjectBrief, extraNextSteps: string[],
    onStage: (index: number) => void, signal?: AbortSignal): Promise<GenerationResult>;
}

@Injectable({ providedIn: 'root' })
export class MockProjectApi extends ProjectApi {
  private demo = inject(DemoSettings);

  stagesFor(plan: GenerationPlan): GenerationStage[] {
    if (plan.destination === 'zip') {
      return [{ key: 'scaffold', label: 'Scaffolding code' }, { key: 'package', label: 'Packaging ZIP' }];
    }
    return [
      { key: 'repo', label: `Creating repository on ${plan.repo!.provider === 'github' ? 'GitHub' : 'GitLab'}` },
      { key: 'ci', label: 'Configuring CI' },
      { key: 'scaffold', label: 'Scaffolding code' },
      { key: 'deploy', label: `Deploying to ${plan.deploy?.host ?? 'hosting'}` },
    ];
  }

  async generate(plan: GenerationPlan, brief: ProjectBrief, extraNextSteps: string[],
    onStage: (index: number) => void, signal?: AbortSignal): Promise<GenerationResult> {
    const stages = this.stagesFor(plan);
    for (let i = 0; i < stages.length; i++) {
      onStage(i);
      await delay(1100 * this.demo.speed(), signal);
      if (stages[i].key === 'scaffold' && this.demo.consumeFailure('generate')) {
        throw new GenerationError('Scaffolding failed: the starter template could not be fetched. Nothing was pushed.', stages[i].key);
      }
    }
    onStage(stages.length);
    if (signal?.aborted) throw new CancelledError();
    return {
      plan,
      repoUrl: plan.repo?.url,
      liveUrl: plan.deploy?.url,
      zipName: plan.destination === 'zip' ? `${slugify(brief.name)}.zip` : undefined,
      generated: plan.files.map(f => f.path),
      nextSteps: [
        ...extraNextSteps.slice(0, 2),
        plan.destination === 'zip' ? 'Unzip, run the setup command in the README, then push it to your own repository.'
          : 'Open the repository and invite a teammate to review the starter code.',
        'Post a Build in Public update with the live link so your followers can try it.',
      ].slice(0, 4),
      finishedAt: new Date().toISOString(),
    };
  }
}

/* ---------------- plan (pure) ---------------- */

export function slugify(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'my-project';
}

/** Exactly what will be created — computed from the draft so the plan review is honest. */
export function buildPlan(brief: ProjectBrief, prefs: ProjectPrefs, account: RepoAccount | null, level: ControlLevel): GenerationPlan {
  const name = slugify(brief.name);
  const stack = STACKS.find(s => s.id === prefs.stack)?.label ?? prefs.stack;
  const host = HOSTS.find(h => h.id === prefs.hosting)?.label ?? prefs.hosting;
  const zip = prefs.destination === 'zip';
  const ciOn = level !== 'handson' || prefs.ci;
  const provider = zip ? undefined : (prefs.destination as RepoProvider);
  const owner = account?.handle ?? 'you';

  const ciFile = provider === 'gitlab' ? '.gitlab-ci.yml' : '.github/workflows/ci.yml';
  const files: PlanFile[] = [
    { path: 'README.md', note: 'What it is, how to run it, how to deploy' },
    ...starterFiles(prefs.stack, level === 'handson' ? prefs.structure : 'feature'),
  ];
  if (ciOn) files.push({ path: ciFile, note: 'Install, lint, test and build on every push' });
  const env = level === 'handson' ? prefs.envSetup : 'dotenv';
  if (env === 'dotenv' || env === 'devcontainer' || env === 'docker') files.push({ path: '.env.example', note: 'Every setting the app needs, with safe placeholders' });
  if (env === 'devcontainer') files.push({ path: '.devcontainer/devcontainer.json', note: 'One-click dev environment' });
  if (env === 'docker') files.push({ path: 'docker-compose.yml', note: 'Run the app and its services locally' });
  const license = level === 'handson' ? prefs.license : 'MIT';
  if (license !== 'Proprietary') files.push({ path: 'LICENSE', note: `${license} licence` });

  return {
    destination: prefs.destination,
    repo: provider ? {
      provider, owner, name, visibility: prefs.visibility,
      url: `https://${provider}.com/${owner}/${name}`,
    } : undefined,
    branches: zip ? [] : level === 'handson' ? ['main', 'develop'] : ['main'],
    ci: ciOn ? { file: ciFile, steps: ['Install dependencies', 'Lint', 'Run tests', 'Build'] } : undefined,
    deploy: zip ? undefined : { host, url: `https://${name}.${prefs.hosting === 'vercel' ? 'vercel.app' : prefs.hosting === 'render' ? 'onrender.com' : 'netlify.app'}`, trigger: 'Every push to main' },
    readme: [`# ${brief.name}`, brief.summary, `Built for: ${brief.audience}`, 'Getting started · Deploying · Contributing'],
    files,
    stack,
    license,
  };
}

function starterFiles(stack: string, structure: ProjectPrefs['structure']): PlanFile[] {
  const feat = structure === 'layer' ? 'src/components/' : structure === 'monorepo' ? 'apps/web/src/' : 'src/features/';
  switch (stack) {
    case 'flutter': return [
      { path: 'pubspec.yaml', note: 'Dependencies' },
      { path: 'lib/main.dart', note: 'App entry point' },
      { path: 'lib/features/home/home_screen.dart', note: 'First screen' },
      { path: 'test/widget_test.dart', note: 'A first passing test' },
    ];
    case 'fastapi': return [
      { path: 'pyproject.toml', note: 'Dependencies' },
      { path: 'app/main.py', note: 'API entry point with a health check' },
      { path: 'app/routes/items.py', note: 'First endpoint' },
      { path: 'tests/test_health.py', note: 'A first passing test' },
    ];
    default: return [
      { path: 'package.json', note: 'Scripts and dependencies' },
      { path: `${feat}home/`, note: 'First screen, wired to sample data' },
      { path: `${feat}auth/`, note: 'Sign-in screens (connects to your auth provider later)' },
      { path: 'src/app.spec.ts', note: 'A first passing test' },
    ];
  }
}
