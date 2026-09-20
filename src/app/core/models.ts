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
  | 'funding' | 'expert' | 'challenge' | 'incubator'
  | 'donation' | 'order' | 'sale' | 'live' | 'job' | 'event' | 'message';

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

export interface ChatAttachment {
  kind: 'image' | 'file' | 'link';
  emoji: string;
  label: string;
}

export interface ChatMessage {
  id: string;
  fromId: string;
  text: string;
  at: string;
  /** delivery state for messages the user sent */
  read?: boolean;
  attachment?: ChatAttachment;
  reaction?: string;
}

export interface Thread {
  id: string;
  withId: string;
  context: string;
  messages: ChatMessage[];
  unread: number;
  /** presence, purely simulated */
  online?: boolean;
  lastSeen?: string;
  pinned?: boolean;
  archived?: boolean;
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

/* ============================================================
   MARKETPLACE — products, orders, reviews
   ============================================================ */

export type ProductType = 'physical' | 'digital' | 'service' | 'preorder';

export interface ProductReview {
  id: string;
  authorId: string;
  rating: number;      // 1–5
  text: string;
  at: string;
}

export interface Product {
  id: string;
  startupId: string;
  sellerId: string;    // person id of the founder
  type: ProductType;
  title: string;
  tagline: string;
  description: string;
  price: number;
  currency: string;
  /** optional strike-through price for a discount badge */
  compareAt?: number;
  emoji: string;
  gradient: string;
  category: string;
  /** physical: units in stock; service: slots; digital: undefined (unlimited) */
  stock?: number;
  sold: number;
  rating: number;
  reviews: ProductReview[];
  /** what the buyer gets — bullet points */
  includes: string[];
  /** service-only: available slots */
  slots?: string[];
  /** digital-only: delivery note */
  deliveryNote?: string;
  /** preorder-only: pay now, receive after the startup ships */
  estimatedDelivery?: string;   // e.g. "Ships Q2 2026"
  unitsGoal?: number;           // reservations targeted before production
  unitsReserved?: number;       // reservations so far
  campaignId?: string;          // optional: reservations advance this campaign's total
  tags: string[];
  featured?: boolean;
  createdByUser?: boolean;
}

export type OrderStatus = 'paid' | 'fulfilled' | 'refunded' | 'reserved';

export interface Order {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  qty: number;
  amount: number;
  currency: string;
  status: OrderStatus;
  at: string;
  /** service booking slot, if applicable */
  slot?: string;
}

/* ============================================================
   DONATIONS — direct support ("tip jar"), incl. live gifts
   ============================================================ */

export interface Gift {
  id: string;
  emoji: string;
  label: string;
  amount: number;
}

export type DonationSource = 'profile' | 'startup' | 'live';

export interface Donation {
  id: string;
  fromId: string;
  toStartupId?: string;
  toPersonId?: string;
  amount: number;
  currency: string;
  message?: string;
  giftId?: string;
  source: DonationSource;
  at: string;
  anonymous?: boolean;
}

/* ============================================================
   LIVE — TikTok-style streaming with live chat, reactions, gifts
   ============================================================ */

export interface LiveChatMessage {
  id: string;
  authorId: string;
  text: string;
  /** a gift attached to this chat line */
  giftId?: string;
  amount?: number;
  system?: boolean;
}

export interface LiveStream {
  id: string;
  hostId: string;          // person id
  startupId?: string;
  title: string;
  category: string;
  emoji: string;
  gradient: string;
  status: 'live' | 'upcoming' | 'ended';
  viewers: number;
  /** total simulated support raised during the stream */
  raised: number;
  currency: string;
  hearts: number;
  startedAt?: string;
  scheduledFor?: string;
  tags: string[];
  /** seed chat so a freshly opened stream isn't empty */
  seedChat: LiveChatMessage[];
}

/* ============================================================
   GROUP CHAT — community rooms (per startup / cohort / challenge)
   ============================================================ */

export type RoomKind = 'startup' | 'cohort' | 'challenge' | 'topic';

export interface GroupMessage {
  id: string;
  fromId: string;
  text: string;
  at: string;
  system?: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  kind: RoomKind;
  emoji: string;
  gradient: string;
  topic: string;
  memberIds: string[];
  memberCount: number;
  messages: GroupMessage[];
  joined?: boolean;
  refId?: string;   // startup/cohort/challenge id it belongs to
}

/* ============================================================
   JOBS — talent board
   ============================================================ */

export type JobKind = 'full-time' | 'part-time' | 'contract' | 'co-founder' | 'volunteer';

export interface JobApplication {
  id: string;
  jobId: string;
  applicantId: string;
  note: string;
  at: string;
  status: 'submitted' | 'reviewing' | 'accepted' | 'declined';
}

export interface Job {
  id: string;
  startupId: string;
  posterId: string;
  title: string;
  kind: JobKind;
  location: string;
  remote: boolean;
  skills: string[];
  description: string;
  equity?: string;
  pay?: string;
  postedAt: string;
  applicants: number;
  open: boolean;
}

/* ============================================================
   EVENTS — demo days, AMAs, pitch nights
   ============================================================ */

export type EventKind = 'demo-day' | 'ama' | 'pitch' | 'workshop' | 'meetup';

export interface AppEvent {
  id: string;
  title: string;
  kind: EventKind;
  hostId: string;        // person / org id
  startupId?: string;
  incubatorId?: string;
  emoji: string;
  gradient: string;
  when: string;
  dateSort: number;      // for ordering
  location: string;
  online: boolean;
  description: string;
  attendees: number;
  capacity?: number;
  going?: boolean;
  tags: string[];
}

/* ============================================================
   WALLET — unifies campaign funds, donations, sales, live gifts
   ============================================================ */

export type TxnKind = 'donation' | 'sale' | 'gift' | 'campaign' | 'payout' | 'purchase';

export interface Transaction {
  id: string;
  kind: TxnKind;
  /** positive = money in, negative = money out */
  amount: number;
  currency: string;
  label: string;
  counterpartyId?: string;
  at: string;
  ts: number;
}
