/* ============================================================
   NAWA — "Ask the Counselor" service layer
   CounselorApi is the contract a real backend would implement
   (e.g. a Supabase Edge Function calling a model). The mock below
   produces a deterministic, candid review from the idea text.
   ============================================================ */

import { Injectable, inject } from '@angular/core';
import { Startup } from '../core/models';
import { DemoSettings, delay, hash } from './demo';
export { CounselorHistory, type ReviewVersion } from './counselor-history';

/* ---------------- contract ---------------- */

/** The part of a startup the counselor reviews. Saved with each version so reviews can be compared. */
export interface IdeaSnapshot {
  name: string;
  industry: string;
  stage: string;
  tagline: string;
  problem: string;
  solution: string;
  businessModel: string;
  market: string;
  /** e.g. "MRR 4,200 TND · Customers 87" — empty if nothing has been published */
  traction: string;
  hasRevenue: boolean;
}

export type Verdict = 'promising' | 'needs-work' | 'rethink';

export interface ScoreItem {
  key: 'problem' | 'market' | 'feasibility' | 'differentiation';
  label: string;
  score: number;      // 1–10
  reason: string;
}

export interface Risk { text: string; severity: 'critical' | 'major' | 'minor'; }

export interface CounselorReview {
  verdict: Verdict;
  verdictLabel: string;
  summary: string;
  scores: ScoreItem[];
  risks: Risk[];
  assumptions: string[];
  nextSteps: string[];   // exactly 3
  generatedAt: string;   // ISO date
}

export interface ReviewProgress { step: number; total: number; label: string; }

export const REVIEW_STEPS = [
  'Reading your idea',
  'Checking the market claim',
  'Stress-testing assumptions',
  'Writing the verdict',
] as const;

export class CounselorError extends Error {
  constructor(message: string) { super(message); this.name = 'CounselorError'; }
}

/**
 * Swap the implementation by changing `useClass` (or by providing CounselorApi in app.config).
 * A real implementation would POST the snapshot to a server-side function.
 */
@Injectable({ providedIn: 'root', useFactory: () => inject(MockCounselorApi) })
export abstract class CounselorApi {
  abstract review(idea: IdeaSnapshot, onProgress?: (p: ReviewProgress) => void, signal?: AbortSignal): Promise<CounselorReview>;
}

/* ---------------- helpers ---------------- */

export function snapshotOf(s: Startup): IdeaSnapshot {
  const revenue = s.kpis.find(k => /mrr|revenue|volume|gmv/i.test(k.label) && !/^0\b|^0 /.test(k.value));
  return {
    name: s.name,
    industry: s.industry,
    stage: s.stages.find(x => x.status === 'active')?.label ?? 'Idea',
    tagline: s.tagline,
    problem: s.problem,
    solution: s.solution,
    businessModel: s.businessModel ?? '',
    market: s.market ?? '',
    traction: s.kpis.slice(0, 3).map(k => `${k.label} ${k.value}`).join(' · '),
    hasRevenue: !!revenue,
  };
}

const clamp = (n: number) => Math.max(1, Math.min(10, Math.round(n)));
const hasNumber = (t: string) => /\d/.test(t);
const GENERIC = /\b(platform|solution|ai[- ]powered|revolutionary|seamless|ecosystem|one[- ]stop|innovative)\b/gi;

/* ---------------- mock ---------------- */

@Injectable({ providedIn: 'root' })
export class MockCounselorApi extends CounselorApi {
  private demo = inject(DemoSettings);

  async review(idea: IdeaSnapshot, onProgress?: (p: ReviewProgress) => void, signal?: AbortSignal): Promise<CounselorReview> {
    const step = 650 * this.demo.speed();
    for (let i = 0; i < REVIEW_STEPS.length; i++) {
      onProgress?.({ step: i, total: REVIEW_STEPS.length, label: REVIEW_STEPS[i] });
      await delay(step, signal);
      if (i === 2 && this.demo.consumeFailure('counselor')) {
        throw new CounselorError('The counselor timed out while stress-testing your assumptions. Your idea was not changed — try again.');
      }
    }
    onProgress?.({ step: REVIEW_STEPS.length, total: REVIEW_STEPS.length, label: 'Done' });
    return buildReview(idea);
  }
}

/** Pure function so the review logic can be tested without timers. */
export function buildReview(idea: IdeaSnapshot, now = new Date()): CounselorReview {
  const text = `${idea.tagline} ${idea.problem} ${idea.solution}`;
  const generic = (text.match(GENERIC) ?? []).length;
  const h = hash(text + idea.market);
  const stageIdx = ['Idea', 'Validation', 'MVP', 'First customers', 'Revenue', 'Fundraising'].indexOf(idea.stage);
  const sourced = /source|according|survey|report|interview/i.test(idea.market);

  const problem = clamp(4 + (idea.problem.length > 80 ? 2 : 0) + (hasNumber(idea.problem) ? 2 : 0) + (h % 2) - (idea.problem.length < 30 ? 2 : 0));
  const market = clamp(4 + (hasNumber(idea.market) ? 2 : 0) + (sourced ? 2 : -1) + (h % 3 === 0 ? 1 : 0) - (idea.market ? 0 : 3));
  const feasibility = clamp(3 + Math.max(0, stageIdx) + (idea.hasRevenue ? 1 : 0) - (idea.solution.length > 260 ? 1 : 0));
  const differentiation = clamp(6 - generic * 1.5 + (/unlike|instead of|only|first/i.test(text) ? 2 : 0) - (idea.solution.length < 40 ? 2 : 0) - 1);

  const scores: ScoreItem[] = [
    { key: 'problem', label: 'Problem clarity', score: problem,
      reason: hasNumber(idea.problem)
        ? 'The problem is stated with a number a customer could repeat. Keep that sentence.'
        : 'The problem has no number attached. Without a cost, it reads as an inconvenience, not a pain.' },
    { key: 'market', label: 'Market potential', score: market,
      reason: !idea.market ? 'There is no market statement at all — you cannot size what you have not described.'
        : sourced ? 'The market claim cites where it comes from, which makes it defensible.'
        : 'The market figure is asserted, not sourced. An investor will ask where it comes from in the first minute.' },
    { key: 'feasibility', label: 'Feasibility', score: feasibility,
      reason: stageIdx >= 3 ? `At the ${idea.stage} stage you have shown you can ship. The open question is repeatability, not building.`
        : `At the ${idea.stage} stage the main risk is execution: nothing has been tested in someone else’s hands yet.` },
    { key: 'differentiation', label: 'Differentiation', score: differentiation,
      reason: generic > 0
        ? `The pitch leans on generic words (${[...new Set((text.match(GENERIC) ?? []).map(w => w.toLowerCase()))].join(', ')}). They describe every startup, so they describe none.`
        : 'You describe a specific mechanism. Make sure a competitor could not copy it by next quarter.' },
  ];

  /* ---- risks: always include at least one genuinely critical point ---- */
  const risks: Risk[] = [];
  if (!idea.hasRevenue) {
    risks.push({ severity: 'critical', text: 'No one has paid yet. Until money changes hands, demand is an opinion — and the most common reason startups at this stage fail.' });
  }
  if (!sourced) {
    risks.push({ severity: idea.hasRevenue ? 'critical' : 'major', text: 'The market size is unsourced. If it is wrong by 10×, so is every plan built on it — including your fundraising ask.' });
  }
  if (generic > 1) risks.push({ severity: 'major', text: 'The positioning is generic enough that a customer cannot repeat it to a colleague.' });
  if (stageIdx >= 4) risks.push({ severity: 'major', text: 'Growth may be founder-led. If the channel depends on you personally, it will not scale with the next hire.' });
  risks.push({ severity: 'minor', text: `${idea.industry} buyers in the region often pay on long cycles — cash flow can break before demand does.` });
  if (!risks.some(r => r.severity === 'critical')) {
    risks.unshift({ severity: 'critical', text: 'Your retention story rests on a short history. One bad season could erase the trend you are showing investors.' });
  }

  const assumptions = [
    `That the people described in “${trim(idea.problem, 60)}” feel this badly enough to change habits.`,
    idea.businessModel ? `That customers accept the price model: “${trim(idea.businessModel, 70)}”.` : 'That someone will pay at all — there is no stated business model.',
    `That the first channel you use to reach customers will keep working after the first 50.`,
  ];

  const nextSteps = [
    idea.hasRevenue
      ? 'Call your last 5 customers who almost churned and ask what nearly made them leave. Write the answers down verbatim.'
      : 'Ask 5 prospects for a small commitment this week — a deposit, a signed pilot or a pre-order. Count yeses, not compliments.',
    sourced
      ? 'Rebuild the market number bottom-up: customers you can name × what they spend today on the workaround.'
      : 'Replace the market claim with a bottom-up estimate and cite where each number comes from.',
    generic > 0
      ? 'Rewrite the one-line pitch without the words “platform” or “solution” and test it on 3 people outside your industry.'
      : 'Publish a Build in Public update with the single metric you will be judged on in 30 days.',
  ];

  const avg = scores.reduce((n, s) => n + s.score, 0) / scores.length;
  const verdict: Verdict = avg >= 7.5 ? 'promising' : avg >= 5 ? 'needs-work' : 'rethink';
  const verdictLabel = verdict === 'promising' ? 'Promising — keep going'
    : verdict === 'needs-work' ? 'Promising, but unproven' : 'Rethink before you build more';
  const weakest = scores.slice().sort((a, b) => a.score - b.score)[0];

  return {
    verdict, verdictLabel,
    summary: `${idea.name} scores ${avg.toFixed(1)}/10 overall. The weakest area is ${weakest.label.toLowerCase()} (${weakest.score}/10): ${weakest.reason}`,
    scores, risks: risks.slice(0, 4), assumptions, nextSteps,
    generatedAt: now.toISOString(),
  };
}

function trim(t: string, n: number): string {
  const s = t.trim().replace(/\s+/g, ' ');
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

/** Fields that changed between two idea snapshots (for the compare view). */
export function ideaDiff(a: IdeaSnapshot, b: IdeaSnapshot): { field: keyof IdeaSnapshot; label: string; before: string; after: string }[] {
  const labels: Partial<Record<keyof IdeaSnapshot, string>> = {
    tagline: 'One-line pitch', problem: 'Problem', solution: 'Solution', businessModel: 'Business model', market: 'Market', stage: 'Stage',
  };
  return (Object.keys(labels) as (keyof IdeaSnapshot)[])
    .filter(k => String(a[k]) !== String(b[k]))
    .map(k => ({ field: k, label: labels[k]!, before: String(a[k]), after: String(b[k]) }));
}
