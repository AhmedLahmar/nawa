/* ============================================================
   NAWA — application store (signals + localStorage persistence)
   All "backend" behaviour is simulated in the browser.
   ============================================================ */

import { computed, Injectable, signal } from '@angular/core';
import {
  AppEvent, Campaign, Challenge, ChatRoom, Comment, Donation, ExpertProfile, FundSlice, Gift,
  GroupMessage, IdeaAnalysis, Incubator, Job, JobApplication, LiveChatMessage, LiveStream,
  Notification, Order, Person, Post, PostType, Product, ProductType, Reward, Roadmap, Startup,
  StoryGroup, Thread, Transaction, Video,
} from './models';
import {
  CAMPAIGNS, CHALLENGES, CURRENCY, DONATIONS, EVENTS, EXPERTS, GIFTS, INCUBATORS, JOBS, LIVES,
  ME_ID, NOTIFICATIONS, PEOPLE, POSTS, PRODUCTS, ROADMAPS, ROOMS, STARTUPS, STORIES, THREADS,
  TRANSACTIONS, VIDEOS, stages,
} from './mock-data';
import { CopilotAnswer, generateRoadmap } from './ai';

const KEY = 'nawa.demo.v1';
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export interface Booking {
  id: string; expertId: string; kind: string; slot: string; price: number; at: string;
}
export interface ScoreEvent { label: string; points: number; at: string; }
export interface CopilotTurn {
  id: string; mine: boolean; text: string; title?: string;
  followUps?: string[]; action?: { label: string; route: string };
}
export interface Toast { id: number; text: string; emoji: string; }

export interface NextStep {
  title: string;
  why: string;
  cta: string;
  route: string;
  emoji: string;
  tone: 'brand' | 'seed' | 'amber';
}

@Injectable({ providedIn: 'root' })
export class Store {
  /* ---------------- collections ---------------- */
  readonly people = signal<Person[]>(clone(PEOPLE));
  readonly startups = signal<Startup[]>(clone(STARTUPS));
  readonly posts = signal<Post[]>(clone(POSTS));
  readonly stories = signal<StoryGroup[]>(clone(STORIES));
  readonly videos = signal<Video[]>(clone(VIDEOS));
  readonly campaigns = signal<Campaign[]>(clone(CAMPAIGNS));
  readonly experts = signal<ExpertProfile[]>(clone(EXPERTS));
  readonly incubators = signal<Incubator[]>(clone(INCUBATORS));
  readonly challenges = signal<Challenge[]>(clone(CHALLENGES));
  readonly notifications = signal<Notification[]>(clone(NOTIFICATIONS));
  readonly threads = signal<Thread[]>(clone(THREADS));
  readonly roadmaps = signal<Roadmap[]>(clone(ROADMAPS));
  readonly products = signal<Product[]>(clone(PRODUCTS));
  readonly livestreams = signal<LiveStream[]>(clone(LIVES));
  readonly rooms = signal<ChatRoom[]>(clone(ROOMS));
  readonly jobs = signal<Job[]>(clone(JOBS));
  readonly events = signal<AppEvent[]>(clone(EVENTS));
  readonly gifts = GIFTS;

  /* ---------------- session state ---------------- */
  readonly activeStartupId = signal<string>('s_agrix');
  readonly follows = signal<string[]>(['p_nour', 'p_yassine', 'p_omar', 'org_orbit', 's_sanad', 's_darija', 'e_karim']);
  readonly supported = signal<string[]>([]);
  readonly seenStories = signal<string[]>([]);
  readonly backed = signal<{ campaignId: string; amount: number; reward?: string }[]>([]);
  readonly bookings = signal<Booking[]>([]);
  readonly joinedChallenges = signal<string[]>(['ch_mvp']);
  readonly scoreEvents = signal<ScoreEvent[]>([]);
  readonly copilot = signal<CopilotTurn[]>([]);
  readonly analyses = signal<IdeaAnalysis[]>([]);
  readonly onboarded = signal<boolean>(false);
  readonly currency = CURRENCY;

  /* new-feature state */
  readonly orders = signal<Order[]>([]);
  readonly donations = signal<Donation[]>(clone(DONATIONS));
  readonly transactions = signal<Transaction[]>(clone(TRANSACTIONS));
  readonly applications = signal<JobApplication[]>([]);

  readonly toasts = signal<Toast[]>([]);
  private toastSeq = 0;
  private seq = 0;

  constructor() { this.restore(); }

  /* ---------------- lookups ---------------- */
  person = (id: string) => this.people().find(p => p.id === id);
  personByHandle = (h: string) => this.people().find(p => p.handle === h);
  startup = (id?: string) => (id ? this.startups().find(s => s.id === id) : undefined);
  startupBySlug = (slug: string) => this.startups().find(s => s.slug === slug);
  campaign = (id?: string) => (id ? this.campaigns().find(c => c.id === id) : undefined);
  campaignOf = (startupId: string) => this.campaigns().find(c => c.startupId === startupId);
  expert = (id: string) => this.experts().find(e => e.id === id);
  expertByPerson = (personId: string) => this.experts().find(e => e.personId === personId);
  incubator = (slug: string) => this.incubators().find(i => i.slug === slug);
  incubatorById = (id?: string) => this.incubators().find(i => i.id === id);
  challenge = (slug: string) => this.challenges().find(c => c.slug === slug);
  roadmapOf = (startupId?: string) => this.roadmaps().find(r => r.startupId === startupId);
  postsOf = (startupId: string) => this.posts().filter(p => p.startupId === startupId).sort((a, b) => a.ts - b.ts);
  postsBy = (personId: string) => this.posts().filter(p => p.authorId === personId).sort((a, b) => a.ts - b.ts);
  videosOf = (startupId: string) => this.videos().filter(v => v.startupId === startupId);
  storiesOf = (personId: string) => this.stories().filter(s => s.authorId === personId);
  cohortOf = (startup: Startup) =>
    this.incubatorById(startup.incubatorId)?.cohorts.find(c => c.id === startup.cohortId);
  product = (id?: string) => (id ? this.products().find(p => p.id === id) : undefined);
  productsOfStartup = (startupId: string) => this.products().filter(p => p.startupId === startupId);
  productsBySeller = (personId: string) => this.products().filter(p => p.sellerId === personId);
  livestream = (id?: string) => (id ? this.livestreams().find(l => l.id === id) : undefined);
  room = (id?: string) => (id ? this.rooms().find(r => r.id === id) : undefined);
  job = (id?: string) => (id ? this.jobs().find(j => j.id === id) : undefined);
  jobsOfStartup = (startupId: string) => this.jobs().filter(j => j.startupId === startupId);
  appEvent = (id?: string) => (id ? this.events().find(e => e.id === id) : undefined);
  gift = (id?: string) => (id ? this.gifts.find(g => g.id === id) : undefined);
  hasApplied = (jobId: string) => this.applications().some(a => a.jobId === jobId && a.applicantId === ME_ID);

  /* ---------------- me ---------------- */
  readonly me = computed<Person>(() => this.people().find(p => p.id === ME_ID)!);
  readonly myStartups = computed(() => this.startups().filter(s => s.founderId === ME_ID));
  readonly activeStartup = computed(() => this.startup(this.activeStartupId()) ?? this.myStartups()[0]);
  readonly myScore = computed(() => {
    const base = this.me().founderScore;
    const boost = this.scoreEvents().reduce((n, e) => n + e.points, 0);
    return Math.min(100, base + boost);
  });
  readonly unreadNotifs = computed(() => this.notifications().filter(n => n.unread).length);
  readonly unreadMsgs = computed(() => this.threads().reduce((n, t) => n + t.unread, 0));

  /* ---------------- new-feature computed ---------------- */
  readonly liveNow = computed(() => this.livestreams().filter(l => l.status === 'live'));
  readonly upcomingLives = computed(() => this.livestreams().filter(l => l.status === 'upcoming'));
  readonly featuredProducts = computed(() => this.products().filter(p => p.featured));
  readonly myRooms = computed(() => this.rooms().filter(r => r.joined));
  readonly openJobs = computed(() => this.jobs().filter(j => j.open));
  readonly upcomingEvents = computed(() =>
    this.events().slice().sort((a, b) => a.dateSort - b.dateSort));

  /** Wallet balance = everything that came in minus what went out. */
  readonly walletBalance = computed(() =>
    this.transactions().reduce((n, t) => n + t.amount, 0));
  readonly earningsIn = computed(() =>
    this.transactions().filter(t => t.amount > 0).reduce((n, t) => n + t.amount, 0));
  readonly myOrders = computed(() => this.orders().filter(o => o.buyerId === ME_ID));

  /* ---------------- feed ---------------- */
  /** Home feed: followed founders + followed startups + trending + regional + recommended. */
  readonly feed = computed(() => {
    const f = this.follows();
    return this.posts()
      .slice()
      .sort((a, b) => a.ts - b.ts)
      .map(p => {
        let weight = 40;
        if (p.authorId === ME_ID) weight = 10;
        else if (f.includes(p.authorId) || (p.startupId && f.includes(p.startupId))) weight = 20;
        else if (p.type === 'failure' || p.type === 'educational') weight = 30;
        return { p, k: weight + p.ts };
      })
      .sort((a, b) => a.k - b.k)
      .map(x => x.p);
  });

  readonly liveCampaigns = computed(() => this.campaigns().filter(c => c.status === 'live'));

  readonly trendingStartups = computed(() =>
    this.startups().slice().sort((a, b) => b.followers - a.followers).slice(0, 5));

  /** "What's your next step?" — the guidance engine. */
  readonly nextSteps = computed<NextStep[]>(() => {
    const s = this.activeStartup();
    const out: NextStep[] = [];
    if (!s) {
      return [{
        title: 'Tell us about your idea', why: 'Copilot will validate it and build your roadmap in about a minute.',
        cta: 'Start', route: '/onboarding', emoji: '💡', tone: 'brand',
      }];
    }
    const rm = this.roadmapOf(s.id);
    const phase = rm?.phases.find(p => p.tasks.some(t => !t.done));
    const task = phase?.tasks.find(t => !t.done);
    if (task) {
      out.push({
        title: task.label,
        why: `${phase!.name} · ${phase!.goal}. ${task.hint ?? 'The next open task on your roadmap.'}`,
        cta: 'Open roadmap', route: '/build/roadmap', emoji: '🎯', tone: 'brand',
      });
    }
    const lastMine = this.posts().filter(p => p.startupId === s.id).sort((a, b) => a.ts - b.ts)[0];
    if (!lastMine || lastMine.ts > 24) {
      out.push({
        title: 'Publish your Build in Public update',
        why: lastMine
          ? `Your last update was ${lastMine.at} ago. Consistency is 20 points of your Founder Score.`
          : `Day ${s.day} and nothing published yet. Your first update is what starts the community loop.`,
        cta: 'Write update', route: '/build', emoji: '📣', tone: 'seed',
      });
    }
    if (s.endorsements.length === 0) {
      out.push({
        title: 'Get your first expert endorsement',
        why: 'Endorsements lift campaign conversion more than any design change. One session is usually enough.',
        cta: 'Browse experts', route: '/experts', emoji: '🎓', tone: 'amber',
      });
    }
    const camp = this.campaignOf(s.id);
    if (camp && camp.status === 'live') {
      const pct = Math.round((camp.raised / camp.goal) * 100);
      out.push({
        title: `Your campaign is at ${pct}% — ${camp.daysLeft} days left`,
        why: 'Campaigns are won by the founders who post updates during them, not before them.',
        cta: 'Open campaign', route: '/fund/' + camp.id, emoji: '💰', tone: 'amber',
      });
    } else if (!camp && s.stages.filter(x => x.status === 'done').length >= 4) {
      out.push({
        title: 'You are ready to build a campaign',
        why: `${s.followers} followers and ${s.day} days of public journey. That is the proof supporters look for.`,
        cta: 'Open builder', route: '/build/campaign', emoji: '💰', tone: 'amber',
      });
    }
    if (out.length < 3) {
      out.push({
        title: 'Join the “Validate Your Idea in 14 Days” challenge',
        why: '218 founders are running it. Challenges add structure and put you on the leaderboard.',
        cta: 'See challenge', route: '/challenges/validate-14-days', emoji: '🏁', tone: 'brand',
      });
    }
    return out.slice(0, 3);
  });

  /* ---------------- social actions ---------------- */
  isFollowing = (id: string) => this.follows().includes(id);

  toggleFollow(id: string, label?: string): void {
    const on = this.isFollowing(id);
    this.follows.update(f => (on ? f.filter(x => x !== id) : [...f, id]));
    if (!on) {
      this.startups.update(list => list.map(s => (s.id === id ? { ...s, followers: s.followers + 1 } : s)));
      this.people.update(list => list.map(p => (p.id === id ? { ...p, followers: p.followers + 1 } : p)));
    } else {
      this.startups.update(list => list.map(s => (s.id === id ? { ...s, followers: Math.max(0, s.followers - 1) } : s)));
      this.people.update(list => list.map(p => (p.id === id ? { ...p, followers: Math.max(0, p.followers - 1) } : p)));
    }
    this.toast(on ? `Unfollowed ${label ?? ''}`.trim() : `Following ${label ?? ''}`.trim(), on ? '👋' : '✅');
    this.save();
  }

  isSupported = (postId: string) => this.supported().includes(postId);

  toggleSupport(postId: string): void {
    const on = this.isSupported(postId);
    this.supported.update(s => (on ? s.filter(x => x !== postId) : [...s, postId]));
    this.posts.update(list => list.map(p => (p.id === postId ? { ...p, supports: p.supports + (on ? -1 : 1) } : p)));
    if (!on) this.toast('Supported 🚀 — the founder is notified', '🚀');
    this.save();
  }

  addComment(postId: string, text: string): void {
    const c: Comment = { id: 'c_' + ++this.seq, authorId: ME_ID, text, at: 'now', supports: 0 };
    this.posts.update(list => list.map(p => (p.id === postId ? { ...p, comments: [...p.comments, c] } : p)));
    this.toast('Feedback posted', '💬');
    this.addScore('Community contribution', 1);
    this.save();
  }

  sharePost(postId: string): void {
    this.posts.update(list => list.map(p => (p.id === postId ? { ...p, shares: p.shares + 1 } : p)));
    this.toast('Shared to your followers', '🔁');
    this.save();
  }

  markStorySeen(groupId: string): void {
    if (!this.seenStories().includes(groupId)) {
      this.seenStories.update(s => [...s, groupId]);
      this.save();
    }
  }
  isStorySeen = (groupId: string) => this.seenStories().includes(groupId);

  /* ---------------- publishing ---------------- */
  publish(input: {
    type: PostType; text: string; startupId?: string;
    media?: Post['media']; poll?: Post['poll']; withDay?: boolean;
  }): Post {
    const s = this.startup(input.startupId ?? this.activeStartupId());
    const rm = this.roadmapOf(s?.id);
    const phase = rm?.phases.find(p => p.tasks.some(t => !t.done));
    const done = phase ? phase.tasks.filter(t => t.done).length : 0;
    const total = phase ? phase.tasks.length : 0;

    const post: Post = {
      id: 'po_new_' + ++this.seq,
      authorId: ME_ID,
      startupId: s?.id,
      type: input.type,
      text: input.text,
      at: 'now',
      ts: -this.seq,
      media: input.media,
      poll: input.poll,
      day: input.withDay && s ? s.day : undefined,
      milestone: input.type === 'build' && phase && total
        ? { label: phase.goal, pct: Math.round((done / total) * 100) }
        : undefined,
      kpiChip: input.type === 'build' && s?.kpis[2] ? { label: s.kpis[2].label, value: s.kpis[2].value } : undefined,
      supports: 0, shares: 0, comments: [],
      reason: 'Your startup',
    };
    this.posts.update(list => [post, ...list]);
    this.addScore('Consistency — update published', 1);
    this.toast('Published to your feed', '🚀');
    this.simulateEngagement(post.id);
    this.save();
    return post;
  }

  /** Makes the demo feel alive: the community reacts a few seconds after you post. */
  private simulateEngagement(postId: string): void {
    const wave = (delay: number, supports: number, comment?: Comment, notif?: Notification, followers = 0) => {
      setTimeout(() => {
        this.posts.update(list => list.map(p => p.id === postId
          ? { ...p, supports: p.supports + supports, comments: comment ? [...p.comments, comment] : p.comments }
          : p));
        if (followers) {
          this.people.update(list => list.map(p => (p.id === ME_ID ? { ...p, followers: p.followers + followers } : p)));
          const sid = this.activeStartupId();
          this.startups.update(list => list.map(s => (s.id === sid ? { ...s, followers: s.followers + followers } : s)));
        }
        if (notif) this.notifications.update(n => [notif, ...n]);
        this.save();
      }, delay);
    };

    wave(2200, 7, undefined, {
      id: 'n_' + ++this.seq, kind: 'support', actorId: 's_fatma',
      text: 'supported your update', at: 'now', unread: true,
    }, 3);

    wave(5200, 12, {
      id: 'c_' + ++this.seq, authorId: 'e_karim', expert: true, at: 'now', supports: 4,
      text: 'Good update — the specific number is what makes this credible. Keep the cadence weekly and bring me the retention data in our next session.',
    }, {
      id: 'n_' + ++this.seq, kind: 'expert', actorId: 'e_karim',
      text: 'replied to your update', at: 'now', unread: true,
    }, 6);

    wave(9000, 21, {
      id: 'c_' + ++this.seq, authorId: 's_leila', at: 'now', supports: 2,
      text: 'Following this. If you reach Monastir I will be your first customer there.',
    }, {
      id: 'n_' + ++this.seq, kind: 'follow', actorId: 's_leila',
      text: 'started following you after your update', at: 'now', unread: true,
    }, 9);
  }

  /* ---------------- roadmap ---------------- */
  toggleTask(startupId: string, taskId: string): void {
    let nowDone = false;
    this.roadmaps.update(list => list.map(r => r.startupId !== startupId ? r : {
      ...r,
      phases: r.phases.map(p => ({
        ...p,
        tasks: p.tasks.map(t => {
          if (t.id !== taskId) return t;
          nowDone = !t.done;
          return { ...t, done: !t.done };
        }),
      })),
    }));
    if (nowDone) {
      this.addScore('Roadmap task completed', 1);
      this.toast('Task completed — Founder Score +1', '✅');
    }
    this.save();
  }

  roadmapProgress(startupId?: string): { done: number; total: number; pct: number } {
    const rm = this.roadmapOf(startupId);
    const all = rm?.phases.flatMap(p => p.tasks) ?? [];
    const done = all.filter(t => t.done).length;
    return { done, total: all.length, pct: all.length ? Math.round((done / all.length) * 100) : 0 };
  }

  /* ---------------- onboarding: idea → startup ---------------- */
  saveAnalysis(a: IdeaAnalysis): void {
    this.analyses.update(list => [a, ...list.filter(x => x.idea !== a.idea)].slice(0, 6));
    this.save();
  }
  readonly lastAnalysis = computed(() => this.analyses()[0]);

  createStartupFromAnalysis(a: IdeaAnalysis, opts: { name?: string; city?: string; buildInPublic: boolean }): Startup {
    const id = 's_new_' + ++this.seq;
    const name = (opts.name || a.name).trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'my-startup';
    const me = this.me();
    const startup: Startup = {
      id, slug, name, emoji: a.emoji,
      gradient: 'linear-gradient(135deg,#341a66,#6e5cf7 58%,#14b87a 140%)',
      tagline: a.tagline,
      description: a.idea,
      problem: a.idea,
      solution: a.mvp.map(m => m.label).join(' · '),
      industry: a.industry,
      city: opts.city || me.city, country: me.country,
      day: 1, buildInPublic: opts.buildInPublic,
      stages: stages(1, 10),
      kpis: [
        { label: 'Followers', value: '0', delta: 'new', trend: [0, 0, 0, 0, 0, 0, 0], tone: 'brand' },
        { label: 'Interviews', value: '0', delta: 'target 20', trend: [0, 0, 0, 0, 0, 0, 0], tone: 'seed' },
        { label: 'Customers', value: '0', delta: '—', trend: [0, 0, 0, 0, 0, 0, 0], tone: 'seed' },
        { label: 'Revenue', value: '0 TND', delta: '—', trend: [0, 0, 0, 0, 0, 0, 0], tone: 'amber' },
      ],
      journey: [
        { day: 1, label: 'Idea validated with Copilot', detail: `Opportunity score ${a.opportunityScore}/100`, status: 'now', emoji: '💡' },
        { day: 7, label: `Interview 20 ${a.segments[0].toLowerCase()}`, status: 'next', emoji: '🎤' },
        { day: 21, label: 'Prototype', status: 'next', emoji: '🧪' },
        { day: 42, label: 'MVP', status: 'next', emoji: '🚀' },
        { day: 68, label: 'First customer', status: 'next', emoji: '🤝' },
      ],
      founderId: ME_ID,
      team: [{ name: me.name, role: 'Founder', personId: ME_ID }],
      followers: 0, supporters: 0, endorsements: [],
      health: 'ok', createdByUser: true,
      businessModel: a.pricing, market: a.marketSize.map(m => `${m.label} ${m.value}`).join(' · '),
    };
    this.startups.update(list => [startup, ...list]);
    this.roadmaps.update(list => [generateRoadmap(a, id), ...list]);
    this.people.update(list => list.map(p => p.id === ME_ID ? { ...p, startupIds: [id, ...p.startupIds] } : p));
    this.activeStartupId.set(id);
    this.onboarded.set(true);
    if (opts.buildInPublic) this.follows.update(f => [...f, id]);
    this.save();
    return startup;
  }

  updateMe(patch: Partial<Person>): void {
    this.people.update(list => list.map(p => (p.id === ME_ID ? { ...p, ...patch } : p)));
    this.save();
  }

  setActiveStartup(id: string): void { this.activeStartupId.set(id); this.save(); }

  /* ---------------- funding (simulated) ---------------- */
  hasBacked = (campaignId: string) => this.backed().some(b => b.campaignId === campaignId);

  /**
   * Campaign builder output. Nothing here touches money — it only creates a
   * conceptual campaign page so the demo can show the end of the journey.
   */
  createCampaign(input: {
    startupId: string; headline: string; pitch: string; goal: number; days: number;
    useOfFunds: FundSlice[]; rewards: Reward[]; why: string[];
  }): Campaign {
    const s = this.startup(input.startupId);
    const campaign: Campaign = {
      id: 'c_new_' + ++this.seq,
      startupId: input.startupId,
      headline: input.headline,
      pitch: input.pitch,
      goal: input.goal,
      raised: 0,
      currency: this.currency,
      backers: 0,
      daysLeft: input.days,
      status: 'live',
      useOfFunds: input.useOfFunds,
      rewards: input.rewards,
      faqs: [
        { q: 'What do supporters get?', a: 'Rewards and early access — this is a community round, not an equity investment.' },
        { q: 'What happens if the goal is not reached?', a: 'The round closes and supporters are not charged. In this demo nothing is ever charged.' },
        { q: 'How will I report progress?', a: `Weekly Build in Public updates from ${s?.name ?? 'the team'}, the same cadence as before the round.` },
      ],
      risks: [
        'Timelines can slip — hardware and integrations are the usual cause.',
        'Adoption may be slower outside the launch city.',
      ],
      why: input.why.filter(Boolean),
      milestones: [
        { label: 'Round opens', amount: 0, done: true },
        { label: 'Halfway — production starts', amount: Math.round(input.goal / 2), done: false },
        { label: 'Goal reached — full rollout', amount: input.goal, done: false },
      ],
      updatePostIds: this.postsOf(input.startupId).slice(0, 3).map(p => p.id),
      isNew: true,
    };
    this.campaigns.update(list => [campaign, ...list]);
    this.addScore('Community round opened', 4);
    this.toast('Campaign page created — conceptual only, no payments are processed', '💰');
    this.save();
    return campaign;
  }

  backCampaign(campaignId: string, amount: number, reward?: string): void {
    this.backed.update(b => [...b, { campaignId, amount, reward }]);
    this.campaigns.update(list => list.map(c => c.id === campaignId
      ? { ...c, raised: c.raised + amount, backers: c.backers + 1 }
      : c));
    const camp = this.campaign(campaignId);
    if (camp) {
      this.startups.update(list => list.map(s => s.id === camp.startupId
        ? { ...s, supporters: s.supporters + 1 } : s));
      if (camp.startupId === this.activeStartupId()) this.addScore('New supporter', 1);
    }
    this.toast(`Simulated support of ${amount} ${this.currency} recorded — no payment was taken`, '🚀');
    this.save();
  }

  /* ---------------- experts (simulated booking) ---------------- */
  bookSession(expertId: string, kind: string, slot: string, price: number): void {
    const e = this.expert(expertId);
    const p = e ? this.person(e.personId) : undefined;
    this.bookings.update(b => [...b, { id: 'bk_' + ++this.seq, expertId, kind, slot, price, at: 'now' }]);
    this.notifications.update(n => [{
      id: 'n_' + ++this.seq, kind: 'expert', actorId: e?.personId ?? 'e_karim',
      text: `confirmed your ${kind} on ${slot}`, at: 'now', unread: true, meta: 'Simulated booking',
    }, ...n]);
    if (p) {
      const existing = this.threads().find(t => t.withId === p.id);
      if (!existing) {
        this.threads.update(list => [{
          id: 't_' + ++this.seq, withId: p.id, context: `Expert · ${kind}`, unread: 1,
          messages: [{
            id: 'm_' + ++this.seq, fromId: p.id, at: 'now',
            text: `Looking forward to our ${kind} on ${slot}. Before we meet, send me your current numbers and the single decision you are stuck on.`,
          }],
        }, ...list]);
      }
    }
    this.toast(`${kind} booked with ${p?.name ?? 'expert'} — demo only, no payment`, '🎓');
    this.save();
  }

  /* ---------------- challenges ---------------- */
  isJoined = (id: string) => this.joinedChallenges().includes(id);

  toggleChallenge(id: string): void {
    const on = this.isJoined(id);
    this.joinedChallenges.update(l => (on ? l.filter(x => x !== id) : [...l, id]));
    this.challenges.update(list => list.map(c => c.id === id
      ? { ...c, joined: !on, participants: c.participants + (on ? -1 : 1) } : c));
    if (!on) { this.addScore('Challenge joined', 1); this.toast('You joined the challenge', '🏁'); }
    this.save();
  }

  /* ---------------- notifications & messages ---------------- */
  markNotifsRead(): void {
    this.notifications.update(l => l.map(n => ({ ...n, unread: false })));
    this.save();
  }

  sendMessage(threadId: string, text: string, attachment?: import('./models').ChatAttachment): void {
    this.threads.update(list => list.map(t => t.id === threadId
      ? {
          ...t, unread: 0,
          messages: [...t.messages, { id: 'm_' + ++this.seq, fromId: ME_ID, text, at: 'now', read: false, attachment }],
        }
      : t));
    this.save();
    const t = this.threads().find(x => x.id === threadId);
    if (!t) return;
    // the other side "reads" the message shortly after (single -> double tick)
    setTimeout(() => {
      this.threads.update(list => list.map(x => x.id === threadId
        ? { ...x, messages: x.messages.map(m => (m.fromId === ME_ID ? { ...m, read: true } : m)) }
        : x));
      this.save();
    }, 1200);
    // then a scripted reply lands
    setTimeout(() => {
      this.threads.update(list => list.map(x => x.id === threadId ? {
        ...x,
        messages: [...x.messages, {
          id: 'm_' + ++this.seq, fromId: x.withId, at: 'now',
          text: this.autoReply(x.withId),
        }],
      } : x));
      this.save();
    }, 2400);
  }

  private autoReply(withId: string): string {
    const p = this.person(withId);
    if (p?.role === 'expert') return 'Noted. Send me the numbers before our session and I will come with a specific recommendation rather than general advice.';
    if (p?.role === 'incubator') return 'Thanks for the update — I have added it to your cohort file. Your mentor will review it before Thursday.';
    if (p?.role === 'supporter') return 'Great to hear. Keep publishing the numbers, that is why I backed you in the first place.';
    return 'Makes sense. I went through the same thing around Day 40 — happy to share how we handled it.';
  }

  markThreadRead(threadId: string): void {
    this.threads.update(l => l.map(t => (t.id === threadId ? { ...t, unread: 0 } : t)));
    this.save();
  }

  togglePinThread(threadId: string): void {
    this.threads.update(l => l.map(t => (t.id === threadId ? { ...t, pinned: !t.pinned } : t)));
    this.save();
  }

  reactToMessage(threadId: string, messageId: string, emoji: string): void {
    this.threads.update(l => l.map(t => t.id !== threadId ? t : {
      ...t,
      messages: t.messages.map(m => m.id === messageId
        ? { ...m, reaction: m.reaction === emoji ? undefined : emoji } : m),
    }));
    this.save();
  }

  /** Start (or focus) a 1:1 thread with a person. Returns the thread id. */
  startThread(withId: string, context = 'Direct message'): string {
    const existing = this.threads().find(t => t.withId === withId);
    if (existing) return existing.id;
    const id = 't_' + ++this.seq;
    this.threads.update(l => [{
      id, withId, context, unread: 0, online: Math.random() > 0.5, messages: [],
    }, ...l]);
    this.save();
    return id;
  }

  /* ---------------- copilot ---------------- */
  pushCopilotQuestion(text: string): void {
    this.copilot.update(l => [...l, { id: 'cp_' + ++this.seq, mine: true, text }]);
    this.save();
  }
  pushCopilotAnswer(a: CopilotAnswer): void {
    this.copilot.update(l => [...l, {
      id: 'cp_' + ++this.seq, mine: false, text: a.body, title: a.title,
      followUps: a.followUps, action: a.action,
    }]);
    this.save();
  }
  clearCopilot(): void { this.copilot.set([]); this.save(); }

  /* ---------------- transactions (wallet) ---------------- */
  private addTxn(kind: Transaction['kind'], amount: number, label: string, counterpartyId?: string): void {
    this.transactions.update(l => [{
      id: 'tx_' + ++this.seq, kind, amount, currency: this.currency, label, counterpartyId, at: 'now', ts: -this.seq,
    }, ...l]);
  }

  /* ---------------- marketplace ---------------- */
  buyProduct(productId: string, qty = 1, slot?: string): Order | undefined {
    const p = this.product(productId);
    if (!p) return undefined;
    const amount = p.price * qty;
    const order: Order = {
      id: 'ord_' + ++this.seq, productId, buyerId: ME_ID, sellerId: p.sellerId,
      qty, amount, currency: this.currency, status: 'paid', at: 'now', slot,
    };
    this.orders.update(l => [order, ...l]);
    this.products.update(list => list.map(x => x.id === productId
      ? { ...x, sold: x.sold + qty, stock: x.stock != null ? Math.max(0, x.stock - qty) : x.stock }
      : x));
    // if the seller is me, this is income; otherwise it's a purchase (out)
    if (p.sellerId === ME_ID) this.addTxn('sale', amount, `${p.title} × ${qty}`, ME_ID);
    else this.addTxn('purchase', -amount, `Bought ${p.title}`, p.sellerId);
    this.notifications.update(n => [{
      id: 'n_' + ++this.seq, kind: 'order', actorId: p.sellerId,
      text: `— your order for ${p.title} is confirmed`, at: 'now', unread: true,
      meta: 'Simulated purchase · no payment taken',
    }, ...n]);
    this.toast(`${p.title} purchased — demo only, no payment was taken`, '🛍️');
    this.save();
    return order;
  }

  addReview(productId: string, rating: number, text: string): void {
    this.products.update(list => list.map(p => {
      if (p.id !== productId) return p;
      const reviews = [{ id: 'prv_' + ++this.seq, authorId: ME_ID, rating, text, at: 'now' }, ...p.reviews];
      const avg = reviews.reduce((n, r) => n + r.rating, 0) / reviews.length;
      return { ...p, reviews, rating: Math.round(avg * 10) / 10 };
    }));
    this.toast('Review posted', '⭐');
    this.save();
  }

  createProduct(input: {
    type: ProductType; title: string; tagline: string; description: string; price: number;
    category: string; includes: string[]; emoji: string; stock?: number; slots?: string[]; deliveryNote?: string;
  }): Product {
    const s = this.activeStartup();
    const product: Product = {
      id: 'pr_new_' + ++this.seq, startupId: s?.id ?? 's_agrix', sellerId: ME_ID,
      type: input.type, title: input.title, tagline: input.tagline, description: input.description,
      price: input.price, currency: this.currency, emoji: input.emoji,
      gradient: s?.gradient ?? 'linear-gradient(135deg,#2b2d42,#4c3fb5)',
      category: input.category, stock: input.stock, sold: 0, rating: 0, reviews: [],
      includes: input.includes.filter(Boolean), slots: input.slots, deliveryNote: input.deliveryNote,
      tags: [], createdByUser: true,
    };
    this.products.update(l => [product, ...l]);
    this.addScore('Product listed', 2);
    this.toast('Product listed in your storefront', '🏷️');
    this.save();
    return product;
  }

  /* ---------------- donations (tip jar + live gifts) ---------------- */
  donate(input: {
    amount: number; toStartupId?: string; toPersonId?: string; message?: string;
    giftId?: string; source: Donation['source']; anonymous?: boolean;
  }): void {
    const donation: Donation = {
      id: 'dn_' + ++this.seq, fromId: ME_ID, toStartupId: input.toStartupId, toPersonId: input.toPersonId,
      amount: input.amount, currency: this.currency, message: input.message, giftId: input.giftId,
      source: input.source, at: 'now', anonymous: input.anonymous,
    };
    this.donations.update(l => [donation, ...l]);
    // a donation from me is money out of my wallet
    this.addTxn(input.giftId ? 'gift' : 'donation', -input.amount,
      input.giftId ? `${this.gift(input.giftId)?.label ?? 'Gift'} sent` : 'Donation sent',
      input.toPersonId ?? input.toStartupId);
    if (input.toStartupId) {
      this.startups.update(list => list.map(s => s.id === input.toStartupId
        ? { ...s, supporters: s.supporters + 1 } : s));
    }
    this.toast(`Sent ${input.amount} ${this.currency} — demo only, no payment was taken`, input.giftId ? '🎁' : '💛');
    this.save();
  }

  /* ---------------- live ---------------- */
  sendLiveGift(streamId: string, giftId: string): void {
    const g = this.gift(giftId);
    if (!g) return;
    this.livestreams.update(list => list.map(l => l.id === streamId
      ? { ...l, raised: l.raised + g.amount, hearts: l.hearts + 1 } : l));
    const stream = this.livestream(streamId);
    this.donate({
      amount: g.amount, toStartupId: stream?.startupId, toPersonId: stream?.hostId,
      giftId, source: 'live',
    });
  }

  heartLive(streamId: string): void {
    this.livestreams.update(list => list.map(l => l.id === streamId ? { ...l, hearts: l.hearts + 1 } : l));
  }

  /** append a chat line locally (used for the viewer's own messages and simulated ones) */
  liveChatLine(line: Omit<LiveChatMessage, 'id'>): LiveChatMessage {
    return { id: 'lc_' + ++this.seq, ...line };
  }

  /* ---------------- community chat rooms ---------------- */
  toggleRoom(roomId: string): void {
    let joined = false;
    this.rooms.update(list => list.map(r => {
      if (r.id !== roomId) return r;
      joined = !r.joined;
      const memberIds = joined ? [...new Set([...r.memberIds, ME_ID])] : r.memberIds.filter(id => id !== ME_ID);
      return { ...r, joined, memberIds, memberCount: r.memberCount + (joined ? 1 : -1) };
    }));
    this.toast(joined ? 'Joined the room' : 'Left the room', joined ? '👥' : '👋');
    this.save();
  }

  postToRoom(roomId: string, text: string): void {
    const msg: GroupMessage = { id: 'gm_' + ++this.seq, fromId: ME_ID, text, at: 'now' };
    this.rooms.update(list => list.map(r => r.id === roomId ? { ...r, messages: [...r.messages, msg] } : r));
    this.addScore('Community contribution', 1);
    this.save();
    // a scripted reply keeps the room feeling alive
    const room = this.room(roomId);
    const other = room?.memberIds.find(id => id !== ME_ID && this.person(id)?.role !== 'incubator');
    if (other) {
      setTimeout(() => {
        this.rooms.update(list => list.map(r => r.id === roomId ? {
          ...r, messages: [...r.messages, {
            id: 'gm_' + ++this.seq, fromId: other, at: 'now',
            text: this.roomReply(this.person(other)?.role),
          }],
        } : r));
        this.save();
      }, 2600);
    }
  }

  private roomReply(role?: string): string {
    if (role === 'expert') return 'Good point. The founders who act on this in the same week are the ones who pull ahead.';
    if (role === 'founder') return 'Same here — went through this last month. Happy to compare notes.';
    return 'Thanks for sharing this 🙏';
  }

  /* ---------------- jobs ---------------- */
  applyToJob(jobId: string, note: string): void {
    if (this.hasApplied(jobId)) { this.toast('You already applied to this role', 'ℹ️'); return; }
    this.applications.update(l => [{
      id: 'ja_' + ++this.seq, jobId, applicantId: ME_ID, note, at: 'now', status: 'submitted',
    }, ...l]);
    this.jobs.update(list => list.map(j => j.id === jobId ? { ...j, applicants: j.applicants + 1 } : j));
    const job = this.job(jobId);
    this.notifications.update(n => [{
      id: 'n_' + ++this.seq, kind: 'job', actorId: job?.posterId ?? ME_ID,
      text: `received your application for ${job?.title ?? 'the role'}`, at: 'now', unread: true,
      meta: 'Simulated application',
    }, ...n]);
    this.toast('Application submitted', '📨');
    this.save();
  }

  postJob(input: {
    title: string; kind: Job['kind']; location: string; remote: boolean; skills: string[];
    description: string; pay?: string; equity?: string;
  }): Job {
    const s = this.activeStartup();
    const job: Job = {
      id: 'job_new_' + ++this.seq, startupId: s?.id ?? 's_agrix', posterId: ME_ID,
      title: input.title, kind: input.kind, location: input.location, remote: input.remote,
      skills: input.skills.filter(Boolean), description: input.description, pay: input.pay, equity: input.equity,
      postedAt: 'now', applicants: 0, open: true,
    };
    this.jobs.update(l => [job, ...l]);
    this.toast('Role posted to the talent board', '💼');
    this.save();
    return job;
  }

  /* ---------------- events ---------------- */
  toggleEvent(eventId: string): void {
    let going = false;
    this.events.update(list => list.map(e => {
      if (e.id !== eventId) return e;
      going = !e.going;
      return { ...e, going, attendees: e.attendees + (going ? 1 : -1) };
    }));
    this.toast(going ? 'You are going — added to your calendar' : 'RSVP removed', going ? '📅' : '👋');
    this.save();
  }

  /* ---------------- score ---------------- */
  addScore(label: string, points: number): void {
    this.scoreEvents.update(l => [{ label, points, at: 'now' }, ...l].slice(0, 40));
  }

  /* ---------------- toasts ---------------- */
  toast(text: string, emoji = '✨'): void {
    const id = ++this.toastSeq;
    this.toasts.update(l => [...l, { id, text, emoji }]);
    setTimeout(() => this.toasts.update(l => l.filter(t => t.id !== id)), 3600);
  }

  /* ---------------- persistence ---------------- */
  private save(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        v: 1,
        people: this.people(), startups: this.startups(), posts: this.posts(),
        campaigns: this.campaigns(), roadmaps: this.roadmaps(), challenges: this.challenges(),
        notifications: this.notifications(), threads: this.threads(),
        activeStartupId: this.activeStartupId(), follows: this.follows(), supported: this.supported(),
        seenStories: this.seenStories(), backed: this.backed(), bookings: this.bookings(),
        joinedChallenges: this.joinedChallenges(), scoreEvents: this.scoreEvents(),
        copilot: this.copilot(), analyses: this.analyses(), onboarded: this.onboarded(),
        products: this.products(), livestreams: this.livestreams(), rooms: this.rooms(),
        jobs: this.jobs(), events: this.events(), orders: this.orders(), donations: this.donations(),
        transactions: this.transactions(), applications: this.applications(), seq: this.seq,
      }));
    } catch { /* storage unavailable — demo still works in memory */ }
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.v !== 1) return;
      this.people.set(d.people); this.startups.set(d.startups); this.posts.set(d.posts);
      this.campaigns.set(d.campaigns); this.roadmaps.set(d.roadmaps); this.challenges.set(d.challenges);
      this.notifications.set(d.notifications); this.threads.set(d.threads);
      this.activeStartupId.set(d.activeStartupId); this.follows.set(d.follows);
      this.supported.set(d.supported); this.seenStories.set(d.seenStories);
      this.backed.set(d.backed); this.bookings.set(d.bookings);
      this.joinedChallenges.set(d.joinedChallenges); this.scoreEvents.set(d.scoreEvents);
      this.copilot.set(d.copilot); this.analyses.set(d.analyses);
      this.onboarded.set(d.onboarded);
      // new-feature collections — fall back to seed data for states saved before they existed
      this.products.set(d.products ?? clone(PRODUCTS));
      this.livestreams.set(d.livestreams ?? clone(LIVES));
      this.rooms.set(d.rooms ?? clone(ROOMS));
      this.jobs.set(d.jobs ?? clone(JOBS));
      this.events.set(d.events ?? clone(EVENTS));
      this.orders.set(d.orders ?? []);
      this.donations.set(d.donations ?? clone(DONATIONS));
      this.transactions.set(d.transactions ?? clone(TRANSACTIONS));
      this.applications.set(d.applications ?? []);
      this.seq = d.seq ?? 0;
    } catch { /* corrupted state — start from the demo dataset */ }
  }

  resetDemo(): void {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    this.people.set(clone(PEOPLE)); this.startups.set(clone(STARTUPS)); this.posts.set(clone(POSTS));
    this.campaigns.set(clone(CAMPAIGNS)); this.roadmaps.set(clone(ROADMAPS));
    this.challenges.set(clone(CHALLENGES)); this.notifications.set(clone(NOTIFICATIONS));
    this.threads.set(clone(THREADS)); this.stories.set(clone(STORIES));
    this.activeStartupId.set('s_agrix');
    this.follows.set(['p_nour', 'p_yassine', 'p_omar', 'org_orbit', 's_sanad', 's_darija', 'e_karim']);
    this.supported.set([]); this.seenStories.set([]); this.backed.set([]); this.bookings.set([]);
    this.joinedChallenges.set(['ch_mvp']); this.scoreEvents.set([]); this.copilot.set([]);
    this.analyses.set([]); this.onboarded.set(false);
    this.products.set(clone(PRODUCTS)); this.livestreams.set(clone(LIVES)); this.rooms.set(clone(ROOMS));
    this.jobs.set(clone(JOBS)); this.events.set(clone(EVENTS)); this.orders.set([]);
    this.donations.set(clone(DONATIONS)); this.transactions.set(clone(TRANSACTIONS)); this.applications.set([]);
    this.toast('Demo reset to its initial state', '🔄');
  }
}
