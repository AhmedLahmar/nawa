/* ============================================================
   NAWA — domain model
   ============================================================ */

export type Role = 'founder' | 'supporter' | 'expert' | 'incubator';

export type Industry =
  | 'FinTech' | 'AgriTech' | 'AI' | 'SaaS' | 'EdTech'
  | 'HealthTech' | 'ClimateTech' | 'E-commerce' | 'Logistics';

export type StageKey =
  | 'idea' | 'validation' | 'mvp' | 'customers' | 'revenue' | 'fundraising';

export interface Stage {
  key: StageKey;
  label: string;
  status: 'done' | 'active' | 'todo';
  /** 0-100, only meaningful for the active stage */
  pct: number;
}

export interface ScoreFactor {
  label: string;
  /** points earned */
  value: number;
  /** points available */
  max: number;
  hint: string;
}

export interface Achievement {
  emoji: string;
  label: string;
  detail?: string;
  verified?: boolean;
}

export interface Person {
  id: string;
  name: string;
  handle: string;
  role: Role;
  title: string;
  city: string;
  country: string;
  bio: string;
  followers: number;
  following: number;
  verified: boolean;
  founderScore: number;
  scoreFactors: ScoreFactor[];
  daysBuilding: number;
  startupIds: string[];
  achievements: Achievement[];
  skills: string[];
  looking?: string;
  joined: string;
  previously?: string[];
}

export interface Kpi {
  label: string;
  value: string;
  delta?: string;
  trend?: number[];
  tone?: 'seed' | 'brand' | 'amber' | 'rose';
}

export interface JourneyNode {
  day: number;
  label: string;
  detail?: string;
  status: 'done' | 'now' | 'next';
  emoji?: string;
}

export interface Endorsement {
  expertId: string;
  quote: string;
  at: string;
}

export interface Startup {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  gradient: string;
  tagline: string;
  description: string;
  problem: string;
  solution: string;
  industry: Industry;
  city: string;
  country: string;
  day: number;
  buildInPublic: boolean;
  stages: Stage[];
  kpis: Kpi[];
  journey: JourneyNode[];
  founderId: string;
  team: { name: string; role: string; personId?: string }[];
  followers: number;
  supporters: number;
  endorsements: Endorsement[];
  campaignId?: string;
  incubatorId?: string;
  cohortId?: string;
  mentorId?: string;
  health?: 'ok' | 'warn' | 'risk';
  roadmapId?: string;
  createdByUser?: boolean;
  businessModel?: string;
  market?: string;
}

export type PostType =
  | 'progress' | 'build' | 'question' | 'failure'
  | 'achievement' | 'help' | 'funding' | 'educational';

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  at: string;
  supports: number;
  expert?: boolean;
}

export interface PostMedia {
  kind: 'image' | 'video' | 'chart';
  emoji: string;
  caption: string;
  gradient: string;
  duration?: string;
  /** for chart media */
  series?: number[];
  seriesLabel?: string;
}

export interface PollOption {
  label: string;
  votes: number;
}

export interface Post {
  id: string;
  authorId: string;
  startupId?: string;
  type: PostType;
  text: string;
  at: string;
  ts: number;
  media?: PostMedia;
  day?: number;
  milestone?: { label: string; pct: number };
  kpiChip?: { label: string; value: string };
  poll?: { question: string; options: PollOption[] };
  ask?: { label: string; value: string }[];
  supports: number;
  shares: number;
  comments: Comment[];
  reason?: string;
  pinned?: boolean;
}

export interface StoryItem {
  id: string;
  kind: 'video' | 'image' | 'text';
  emoji: string;
  caption: string;
  gradient: string;
  milestoneTag?: string;
  quote?: string;
}

export interface StoryGroup {
  id: string;
  authorId: string;
  startupId?: string;
  label: string;
  items: StoryItem[];
  at: string;
}

export interface Video {
  id: string;
  authorId: string;
  startupId?: string;
  title: string;
  caption: string;
  duration: string;
  views: number;
  supports: number;
  comments: number;
  category: string;
  milestone?: string;
  emoji: string;
  gradient: string;
}

export interface FundSlice { label: string; pct: number; color: string; }

export interface Reward {
  id: string;
  title: string;
  amount: number;
  desc: string;
  claimed: number;
  limit?: number;
  perks: string[];
}

export interface Campaign {
  id: string;
  startupId: string;
  headline: string;
  pitch: string;
  goal: number;
  raised: number;
  currency: string;
  backers: number;
  daysLeft: number;
  status: 'live' | 'upcoming' | 'funded';
  useOfFunds: FundSlice[];
  rewards: Reward[];
  faqs: { q: string; a: string }[];
  risks: string[];
  why: string[];
  milestones: { label: string; amount: number; done: boolean }[];
  updatePostIds: string[];
  trending?: boolean;
  isNew?: boolean;
}

export interface ExpertProfile {
  id: string;
  personId: string;
  headline: string;
  categories: string[];
  industries: string[];
  years: number;
  rating: number;
  reviews: number;
  sessions: number;
  price30: number;
  price60: number;
  packagePrice: number;
  packageDesc: string;
  availability: string[];
  languages: string[];
  answers: number;
  responseTime: string;
  gradient: string;
  topAnswer?: { q: string; a: string };
}

export interface Cohort {
  id: string;
  name: string;
  incubatorId: string;
  window: string;
  startupIds: string[];
  progress: number;
  mentorIds: string[];
  milestones: { label: string; due: string; doneCount: number }[];
  demoDay: string;
}

export interface Incubator {
  id: string;
  slug: string;
  name: string;
  logoText: string;
  gradient: string;
  city: string;
  country: string;
  about: string;
  focus: Industry[];
  cohorts: Cohort[];
  mentorIds: string[];
  stats: { label: string; value: string }[];
  perks: string[];
  applyDeadline: string;
  openCall: boolean;
}

export interface Challenge {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  emoji: string;
  gradient: string;
  window: string;
  daysLeft: number;
  participants: number;
  joined: boolean;
  reward: string;
  milestones: { label: string; day: number; done: boolean }[];
  leaderboard: { personId: string; startupId?: string; points: number; streak: number }[];
  rules: string[];
}

export type NotifKind =
  | 'follow' | 'support' | 'comment' | 'milestone'
  | 'funding' | 'expert' | 'challenge' | 'incubator';

export interface Notification {
  id: string;
  kind: NotifKind;
  actorId: string;
  text: string;
  at: string;
  unread: boolean;
  link?: string;
  meta?: string;
}

export interface ChatMessage {
  id: string;
  fromId: string;
  text: string;
  at: string;
}

export interface Thread {
  id: string;
  withId: string;
  context: string;
  messages: ChatMessage[];
  unread: number;
}

export interface RoadmapTask {
  id: string;
  label: string;
  done: boolean;
  hint?: string;
  owner?: string;
}

export interface RoadmapPhase {
  id: string;
  name: string;
  goal: string;
  weeks: string;
  tasks: RoadmapTask[];
  locked?: boolean;
}

export interface Roadmap {
  id: string;
  startupId: string;
  source: 'ai' | 'incubator';
  sourceLabel: string;
  phases: RoadmapPhase[];
}

export interface IdeaAnalysis {
  idea: string;
  name: string;
  tagline: string;
  industry: Industry;
  emoji: string;
  opportunityScore: number;
  marketPotential: 'Low' | 'Medium' | 'High';
  competition: 'Low' | 'Medium' | 'High';
  risk: 'Low' | 'Medium' | 'High';
  timing: string;
  marketSize: { label: string; value: string; note: string }[];
  competitors: { name: string; note: string; kind: string }[];
  strengths: string[];
  risks: string[];
  nextStep: string;
  mvp: { label: string; why: string }[];
  pricing: string;
  segments: string[];
}
