/* ============================================================
   NAWA — demo dataset (fictional founders, startups & MENA context)
   All people, startups, numbers and campaigns below are invented
   for demonstration purposes.
   ============================================================ */

import {
  AppEvent, Campaign, Challenge, ChatRoom, Cohort, Donation, ExpertProfile, Gift, Incubator, Job,
  LiveStream, Notification, Person, Post, Product, Roadmap, Stage, StageKey, Startup, StoryGroup,
  Thread, Transaction, Video,
} from './models';

export const ME_ID = 'u_me';
export const CURRENCY = 'TND';

export const G = {
  agri: 'linear-gradient(135deg,#0d5c44,#14b87a 58%,#8ce6b6)',
  fin: 'linear-gradient(135deg,#11245c,#2b6df4 60%,#7cc0ff)',
  ai: 'linear-gradient(135deg,#341a66,#7b4df7 58%,#cbaaff)',
  health: 'linear-gradient(135deg,#0b4a58,#12a4b8 58%,#84e6f0)',
  edu: 'linear-gradient(135deg,#6b3a0d,#f5a524 64%,#ffdb9a)',
  climate: 'linear-gradient(135deg,#12492a,#3fae56 56%,#d5f18d)',
  ecom: 'linear-gradient(135deg,#5b1140,#e0417f 60%,#ffb0cd)',
  logi: 'linear-gradient(135deg,#1d2447,#4b5fd6 58%,#a6b5ff)',
  saas: 'linear-gradient(135deg,#0b2a3d,#2b9bf4 58%,#95d7ff)',
  ink: 'linear-gradient(135deg,#14151f,#3b3e57 62%,#767a97)',
  sunset: 'linear-gradient(135deg,#7a1f4b,#f5734a 62%,#ffc98c)',
  night: 'linear-gradient(135deg,#101a3d,#3a2f9c 58%,#8f7bff)',
};

const STAGE_DEF: { key: StageKey; label: string }[] = [
  { key: 'idea', label: 'Idea' },
  { key: 'validation', label: 'Validation' },
  { key: 'mvp', label: 'MVP' },
  { key: 'customers', label: 'First customers' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'fundraising', label: 'Fundraising' },
];

/** builds the 6-step stage tracker: `done` completed steps, current step at `pct` */
export function stages(done: number, pct = 0): Stage[] {
  return STAGE_DEF.map((s, i) => ({
    ...s,
    status: i < done ? 'done' : i === done ? 'active' : 'todo',
    pct: i < done ? 100 : i === done ? pct : 0,
  }));
}

/* ------------------------------------------------------------
   PEOPLE
   ------------------------------------------------------------ */
export const PEOPLE: Person[] = [
  {
    id: ME_ID, name: 'Ahmed Ben Ali', handle: 'ahmedbenali', role: 'founder',
    title: 'Founder @ AgriX', city: 'Tunis', country: 'Tunisia',
    bio: 'Building AgriX in public — AI-powered agricultural logistics for Tunisian farmers and restaurants. 184 days of shipping, interviewing and learning out loud.',
    followers: 1240, following: 186, verified: true, founderScore: 82,
    scoreFactors: [
      { label: 'Consistency', value: 19, max: 20, hint: '11-week posting streak — updates every week since Day 1' },
      { label: 'Verified milestones', value: 17, max: 20, hint: '5 of 6 journey milestones verified by activity on the platform' },
      { label: 'Roadmap completion', value: 14, max: 20, hint: '31 of 44 roadmap tasks completed' },
      { label: 'Startup traction', value: 13, max: 15, hint: '4,200 TND MRR, 87 paying customers, +24% growth' },
      { label: 'Expert endorsements', value: 10, max: 15, hint: '3 endorsements from verified experts' },
      { label: 'Community contribution', value: 9, max: 10, hint: '64 helpful answers to other founders' },
    ],
    daysBuilding: 184, startupIds: ['s_agrix'],
    achievements: [
      { emoji: '🚀', label: 'MVP launched', detail: 'Day 42 · verified', verified: true },
      { emoji: '🎯', label: '100 customer interviews', detail: 'Day 68 · verified', verified: true },
      { emoji: '💰', label: 'First revenue', detail: 'Day 87 · verified', verified: true },
      { emoji: '🏆', label: 'MVP in 30 Days — 2nd place', detail: 'Challenge winner' },
      { emoji: '🔥', label: '11-week build streak' },
    ],
    skills: ['Logistics', 'Ops', 'B2B sales', 'Product'],
    looking: 'Looking for a Flutter developer and 2 pilot restaurants in Sousse',
    joined: 'Feb 2026', previously: ['Ops lead at a produce distributor (3 yrs)', 'Failed side project: Souk delivery bot (2024)'],
  },
  {
    id: 'p_nour', name: 'Nour Trabelsi', handle: 'nourt', role: 'founder',
    title: 'Founder @ Sanad Pay', city: 'Sfax', country: 'Tunisia',
    bio: 'Invoice financing for Tunisian SMEs. Ex-banker turned founder. I share every number.',
    followers: 2130, following: 240, verified: true, founderScore: 88,
    scoreFactors: [
      { label: 'Consistency', value: 20, max: 20, hint: '26-week streak' },
      { label: 'Verified milestones', value: 19, max: 20, hint: '6 of 6 verified' },
      { label: 'Roadmap completion', value: 17, max: 20, hint: '52 of 60 tasks' },
      { label: 'Startup traction', value: 14, max: 15, hint: '11,400 TND MRR' },
      { label: 'Expert endorsements', value: 11, max: 15, hint: '4 endorsements' },
      { label: 'Community contribution', value: 7, max: 10, hint: '28 answers' },
    ],
    daysBuilding: 212, startupIds: ['s_sanad'],
    achievements: [
      { emoji: '💰', label: 'Crowdfunding successful', detail: '40,000 TND raised', verified: true },
      { emoji: '📈', label: '10k TND MRR', verified: true },
      { emoji: '🎓', label: 'Orbit Labs Cohort 2025' },
    ],
    skills: ['FinTech', 'Credit risk', 'Compliance'], joined: 'Jan 2026',
  },
  {
    id: 'p_yassine', name: 'Yassine El Amrani', handle: 'yassine', role: 'founder',
    title: 'Founder @ Darija AI', city: 'Casablanca', country: 'Morocco',
    bio: 'Voice AI that actually understands Moroccan Darija and Tunisian Derja. Building loudly.',
    followers: 3480, following: 190, verified: true, founderScore: 86,
    scoreFactors: [
      { label: 'Consistency', value: 18, max: 20, hint: '19-week streak' },
      { label: 'Verified milestones', value: 18, max: 20, hint: '5 of 6 verified' },
      { label: 'Roadmap completion', value: 16, max: 20, hint: '40 of 50 tasks' },
      { label: 'Startup traction', value: 13, max: 15, hint: '9 enterprise pilots' },
      { label: 'Expert endorsements', value: 13, max: 15, hint: '5 endorsements' },
      { label: 'Community contribution', value: 8, max: 10, hint: '41 answers' },
    ],
    daysBuilding: 168, startupIds: ['s_darija'],
    achievements: [
      { emoji: '🏆', label: 'Pitch Week winner', verified: true },
      { emoji: '🚀', label: 'MVP launched', verified: true },
      { emoji: '🤝', label: '9 enterprise pilots' },
    ],
    skills: ['ML', 'Speech', 'NLP', 'Arabic dialects'], joined: 'Dec 2025',
  },
  {
    id: 'p_mariem', name: 'Mariem Gharbi', handle: 'mariemg', role: 'founder',
    title: 'Founder @ Sahti', city: 'Sousse', country: 'Tunisia',
    bio: 'Teleconsultation for people far from specialists. Doctor first, founder second.',
    followers: 940, following: 310, verified: false, founderScore: 69,
    scoreFactors: [
      { label: 'Consistency', value: 14, max: 20, hint: '7-week streak' },
      { label: 'Verified milestones', value: 13, max: 20, hint: '4 of 6 verified' },
      { label: 'Roadmap completion', value: 12, max: 20, hint: '22 of 38 tasks' },
      { label: 'Startup traction', value: 10, max: 15, hint: '340 consultations' },
      { label: 'Expert endorsements', value: 12, max: 15, hint: '4 endorsements' },
      { label: 'Community contribution', value: 8, max: 10, hint: '33 answers' },
    ],
    daysBuilding: 96, startupIds: ['s_sahti'],
    achievements: [
      { emoji: '🩺', label: '340 consultations delivered', verified: true },
      { emoji: '🎯', label: '60 patient interviews', verified: true },
    ],
    skills: ['HealthTech', 'Clinical ops', 'Regulation'], joined: 'Mar 2026',
  },
  {
    id: 'p_ines', name: 'Ines Chaabane', handle: 'ines', role: 'founder',
    title: 'Founder @ Kaissa', city: 'Monastir', country: 'Tunisia',
    bio: 'POS + inventory for small Tunisian retailers. Validating in public, mistakes included.',
    followers: 412, following: 205, verified: false, founderScore: 58,
    scoreFactors: [
      { label: 'Consistency', value: 15, max: 20, hint: '6-week streak' },
      { label: 'Verified milestones', value: 9, max: 20, hint: '2 of 6 verified' },
      { label: 'Roadmap completion', value: 11, max: 20, hint: '18 of 32 tasks' },
      { label: 'Startup traction', value: 6, max: 15, hint: '14 pilot shops' },
      { label: 'Expert endorsements', value: 7, max: 15, hint: '2 endorsements' },
      { label: 'Community contribution', value: 10, max: 10, hint: '71 answers — top 5% helper' },
    ],
    daysBuilding: 44, startupIds: ['s_kaissa'],
    achievements: [
      { emoji: '🎯', label: '30 shop interviews', verified: true },
      { emoji: '💬', label: 'Top community helper' },
    ],
    skills: ['Retail', 'UX', 'Flutter'], joined: 'Jun 2026',
  },
  {
    id: 'p_sami', name: 'Sami Kacem', handle: 'samik', role: 'founder',
    title: 'Founder @ Nafhem', city: 'Tunis', country: 'Tunisia',
    bio: 'AI tutor for bac students in Arabic and French. Teacher for 9 years.',
    followers: 1580, following: 143, verified: true, founderScore: 76,
    scoreFactors: [
      { label: 'Consistency', value: 17, max: 20, hint: '14-week streak' },
      { label: 'Verified milestones', value: 15, max: 20, hint: '4 of 6 verified' },
      { label: 'Roadmap completion', value: 15, max: 20, hint: '34 of 45 tasks' },
      { label: 'Startup traction', value: 11, max: 15, hint: '2,900 students' },
      { label: 'Expert endorsements', value: 10, max: 15, hint: '3 endorsements' },
      { label: 'Community contribution', value: 8, max: 10, hint: '37 answers' },
    ],
    daysBuilding: 131, startupIds: ['s_nafhem'],
    achievements: [
      { emoji: '🎓', label: '2,900 students onboarded', verified: true },
      { emoji: '🚀', label: 'MVP launched', verified: true },
    ],
    skills: ['EdTech', 'Curriculum', 'Growth'], joined: 'Feb 2026',
  },
  {
    id: 'p_hamza', name: 'Hamza Louati', handle: 'hamzal', role: 'founder',
    title: 'Founder @ Shamsi', city: 'Gabès', country: 'Tunisia',
    bio: 'Solar micro-leasing for farms and small workshops in the south.',
    followers: 690, following: 122, verified: false, founderScore: 64,
    scoreFactors: [
      { label: 'Consistency', value: 13, max: 20, hint: '5-week streak' },
      { label: 'Verified milestones', value: 12, max: 20, hint: '3 of 6 verified' },
      { label: 'Roadmap completion', value: 13, max: 20, hint: '21 of 34 tasks' },
      { label: 'Startup traction', value: 8, max: 15, hint: '12 installations' },
      { label: 'Expert endorsements', value: 10, max: 15, hint: '3 endorsements' },
      { label: 'Community contribution', value: 8, max: 10, hint: '30 answers' },
    ],
    daysBuilding: 78, startupIds: ['s_shamsi'],
    achievements: [{ emoji: '☀️', label: '12 solar installations', verified: true }],
    skills: ['Energy', 'Field ops', 'Financing'], joined: 'Apr 2026',
  },
  {
    id: 'p_rania', name: 'Rania Belhaj', handle: 'raniab', role: 'founder',
    title: 'Founder @ SoukLink', city: 'Sfax', country: 'Tunisia',
    bio: 'Helping artisans sell beyond the medina. Export logistics + storefronts.',
    followers: 830, following: 260, verified: false, founderScore: 61,
    scoreFactors: [
      { label: 'Consistency', value: 12, max: 20, hint: '4-week streak' },
      { label: 'Verified milestones', value: 11, max: 20, hint: '3 of 6 verified' },
      { label: 'Roadmap completion', value: 12, max: 20, hint: '19 of 33 tasks' },
      { label: 'Startup traction', value: 9, max: 15, hint: '58 artisan shops' },
      { label: 'Expert endorsements', value: 8, max: 15, hint: '2 endorsements' },
      { label: 'Community contribution', value: 9, max: 10, hint: '44 answers' },
    ],
    daysBuilding: 61, startupIds: ['s_souklink'],
    achievements: [{ emoji: '🧵', label: '58 artisans onboarded', verified: true }],
    skills: ['E-commerce', 'Export', 'Craft supply chain'], joined: 'May 2026',
  },
  {
    id: 'p_omar', name: 'Omar Fathy', handle: 'omarf', role: 'founder',
    title: 'Founder @ Wassel', city: 'Cairo', country: 'Egypt',
    bio: 'Last-mile delivery for neighbourhood grocers. 3 governorates, 1 spreadsheet at a time.',
    followers: 2740, following: 198, verified: true, founderScore: 79,
    scoreFactors: [
      { label: 'Consistency', value: 16, max: 20, hint: '16-week streak' },
      { label: 'Verified milestones', value: 16, max: 20, hint: '5 of 6 verified' },
      { label: 'Roadmap completion', value: 15, max: 20, hint: '38 of 50 tasks' },
      { label: 'Startup traction', value: 13, max: 15, hint: '18,000 deliveries/mo' },
      { label: 'Expert endorsements', value: 11, max: 15, hint: '4 endorsements' },
      { label: 'Community contribution', value: 8, max: 10, hint: '35 answers' },
    ],
    daysBuilding: 154, startupIds: ['s_wassel'],
    achievements: [
      { emoji: '📦', label: '18k deliveries / month', verified: true },
      { emoji: '🚀', label: 'Expanded to 3 governorates', verified: true },
    ],
    skills: ['Logistics', 'Fleet ops', 'Unit economics'], joined: 'Jan 2026',
  },
  {
    id: 'p_layla', name: 'Layla Al-Harbi', handle: 'layla', role: 'founder',
    title: 'Founder @ Qard', city: 'Riyadh', country: 'Saudi Arabia',
    bio: 'Sharia-compliant working capital for small merchants. Numbers in public.',
    followers: 4120, following: 176, verified: true, founderScore: 90,
    scoreFactors: [
      { label: 'Consistency', value: 19, max: 20, hint: '31-week streak' },
      { label: 'Verified milestones', value: 20, max: 20, hint: '6 of 6 verified' },
      { label: 'Roadmap completion', value: 18, max: 20, hint: '58 of 64 tasks' },
      { label: 'Startup traction', value: 14, max: 15, hint: '640 merchants financed' },
      { label: 'Expert endorsements', value: 12, max: 15, hint: '5 endorsements' },
      { label: 'Community contribution', value: 7, max: 10, hint: '24 answers' },
    ],
    daysBuilding: 246, startupIds: ['s_qard'],
    achievements: [
      { emoji: '🏦', label: 'Regulatory sandbox admitted', verified: true },
      { emoji: '💰', label: 'Crowdfunding successful', verified: true },
    ],
    skills: ['Islamic finance', 'Risk', 'Partnerships'], joined: 'Nov 2025',
  },

  /* ---- experts ---- */
  {
    id: 'e_karim', name: 'Karim Mansour', handle: 'karimm', role: 'expert',
    title: 'Product & MVP strategy', city: 'Tunis', country: 'Tunisia',
    bio: '12 years shipping products across MENA. I help founders cut their MVP in half and still learn more.',
    followers: 5600, following: 88, verified: true, founderScore: 0, scoreFactors: [],
    daysBuilding: 0, startupIds: [], achievements: [], skills: ['MVP scoping', 'Discovery', 'Roadmaps'], joined: 'Dec 2025',
  },
  {
    id: 'e_sonia', name: 'Sonia Ben Youssef', handle: 'soniaby', role: 'expert',
    title: 'Growth & performance marketing', city: 'Tunis', country: 'Tunisia',
    bio: 'Scaled 3 marketplaces in Tunisia and Morocco. Obsessed with cheap distribution.',
    followers: 4300, following: 120, verified: true, founderScore: 0, scoreFactors: [],
    daysBuilding: 0, startupIds: [], achievements: [], skills: ['Acquisition', 'Content', 'Retention'], joined: 'Jan 2026',
  },
  {
    id: 'e_walid', name: 'Walid Zribi', handle: 'walidz', role: 'expert',
    title: 'Fundraising & investor readiness', city: 'Dubai', country: 'UAE',
    bio: 'Ex-VC. Reviewed 900+ decks. I will tell you exactly why investors passed.',
    followers: 7900, following: 64, verified: true, founderScore: 0, scoreFactors: [],
    daysBuilding: 0, startupIds: [], achievements: [], skills: ['Pitch', 'Financial model', 'Term sheets'], joined: 'Nov 2025',
  },
  {
    id: 'e_amal', name: 'Amal Haddad', handle: 'amalh', role: 'expert',
    title: 'Legal & company structuring', city: 'Tunis', country: 'Tunisia',
    bio: 'Startup lawyer. SARL vs SUARL, ESOPs, offshore structures, and the paperwork nobody explains.',
    followers: 2100, following: 71, verified: true, founderScore: 0, scoreFactors: [],
    daysBuilding: 0, startupIds: [], achievements: [], skills: ['Incorporation', 'Contracts', 'IP'], joined: 'Feb 2026',
  },
  {
    id: 'e_youssef', name: 'Youssef Bouazizi', handle: 'youssefb', role: 'expert',
    title: 'Engineering & technical architecture', city: 'Sfax', country: 'Tunisia',
    bio: 'CTO-for-hire. I review your stack, your hiring plan and your technical debt.',
    followers: 3050, following: 132, verified: true, founderScore: 0, scoreFactors: [],
    daysBuilding: 0, startupIds: [], achievements: [], skills: ['Architecture', 'Hiring', 'Mobile'], joined: 'Jan 2026',
  },
  {
    id: 'e_dina', name: 'Dina Kamal', handle: 'dinak', role: 'expert',
    title: 'B2B sales & pipeline building', city: 'Cairo', country: 'Egypt',
    bio: 'Built sales teams from 0 to 40. Cold outreach that works in Arabic markets.',
    followers: 3600, following: 158, verified: true, founderScore: 0, scoreFactors: [],
    daysBuilding: 0, startupIds: [], achievements: [], skills: ['Outbound', 'Pricing', 'Enterprise deals'], joined: 'Mar 2026',
  },
  {
    id: 'e_reda', name: 'Reda Alaoui', handle: 'redaa', role: 'expert',
    title: 'Finance & unit economics', city: 'Casablanca', country: 'Morocco',
    bio: 'CFO advisor. If your CAC payback is longer than 9 months, we should talk.',
    followers: 2450, following: 96, verified: true, founderScore: 0, scoreFactors: [],
    daysBuilding: 0, startupIds: [], achievements: [], skills: ['Modeling', 'Pricing', 'Cash runway'], joined: 'Feb 2026',
  },
  {
    id: 'e_maha', name: 'Maha Al-Suwaidi', handle: 'mahas', role: 'expert',
    title: 'Branding & positioning', city: 'Dubai', country: 'UAE',
    bio: 'Positioning for MENA-first products. Bilingual brand systems that do not feel translated.',
    followers: 4800, following: 140, verified: true, founderScore: 0, scoreFactors: [],
    daysBuilding: 0, startupIds: [], achievements: [], skills: ['Naming', 'Messaging', 'Design systems'], joined: 'Apr 2026',
  },

  /* ---- supporters / community ---- */
  {
    id: 's_fatma', name: 'Fatma Jlassi', handle: 'fatmaj', role: 'supporter',
    title: 'Angel supporter · Tunis', city: 'Tunis', country: 'Tunisia',
    bio: 'I back founders who show their work. 14 startups supported so far.',
    followers: 320, following: 480, verified: false, founderScore: 0, scoreFactors: [],
    daysBuilding: 0, startupIds: [], achievements: [], skills: [], joined: 'Feb 2026',
  },
  {
    id: 's_bilal', name: 'Bilal Nasri', handle: 'bilaln', role: 'supporter',
    title: 'Product designer · looking to join a startup', city: 'Sousse', country: 'Tunisia',
    bio: 'Designer. I follow build-in-public founders and help with UI for free once a month.',
    followers: 210, following: 390, verified: false, founderScore: 0, scoreFactors: [],
    daysBuilding: 0, startupIds: [], achievements: [], skills: ['UI', 'Design systems'], joined: 'May 2026',
  },
  {
    id: 's_leila', name: 'Leila Msakni', handle: 'leilam', role: 'supporter',
    title: 'Owner, 3 grocery shops · Monastir', city: 'Monastir', country: 'Tunisia',
    bio: 'Retailer. I test products for founders and tell them the truth.',
    followers: 96, following: 140, verified: false, founderScore: 0, scoreFactors: [],
    daysBuilding: 0, startupIds: [], achievements: [], skills: [], joined: 'Jun 2026',
  },

  /* ---- organisations ---- */
  {
    id: 'org_orbit', name: 'Orbit Labs Tunis', handle: 'orbitlabs', role: 'incubator',
    title: 'Startup studio & accelerator · Tunis', city: 'Tunis', country: 'Tunisia',
    bio: '12-week accelerator for MENA-first startups. 3 cohorts a year.',
    followers: 8900, following: 210, verified: true, founderScore: 0, scoreFactors: [],
    daysBuilding: 0, startupIds: [], achievements: [], skills: [], joined: 'Oct 2025',
  },
  {
    id: 'org_maghreb', name: 'Maghreb Accelerator', handle: 'maghrebacc', role: 'incubator',
    title: 'Accelerator · Casablanca', city: 'Casablanca', country: 'Morocco',
    bio: 'Cross-border acceleration between Morocco, Tunisia and Algeria.',
    followers: 6400, following: 180, verified: true, founderScore: 0, scoreFactors: [],
    daysBuilding: 0, startupIds: [], achievements: [], skills: [], joined: 'Nov 2025',
  },
];

/* ------------------------------------------------------------
   STARTUPS
   ------------------------------------------------------------ */
export const STARTUPS: Startup[] = [
  {
    id: 's_agrix', slug: 'agrix', name: 'AgriX', emoji: '🌾', gradient: G.agri,
    tagline: 'AI-powered agricultural logistics platform.',
    description:
      'AgriX connects farms directly with restaurants and grocers. We forecast demand, group orders into optimised routes, and cut the 4 intermediaries that eat 40% of a farmer’s margin.',
    problem:
      'Tunisian farmers sell through 3–4 intermediaries and lose up to 40% of margin. Restaurants get inconsistent quality and unpredictable prices, and 18% of fresh produce is lost in transit.',
    solution:
      'A demand-forecasting engine plus a shared-route delivery network. Restaurants order the evening before, farms see aggregated demand in the morning, and one van serves 9 clients instead of 9 separate trips.',
    industry: 'AgriTech', city: 'Tunis', country: 'Tunisia',
    day: 87, buildInPublic: true,
    stages: stages(5, 72),
    kpis: [
      { label: 'Users', value: '1,284', delta: '+18%', trend: [420, 520, 610, 720, 880, 1020, 1284], tone: 'brand' },
      { label: 'Customers', value: '87', delta: '+12', trend: [4, 11, 23, 38, 52, 71, 87], tone: 'seed' },
      { label: 'MRR', value: '4,200 TND', delta: '+24%', trend: [300, 700, 1200, 1900, 2600, 3400, 4200], tone: 'seed' },
      { label: 'Retention', value: '91%', delta: '+3pts', trend: [70, 74, 79, 82, 86, 88, 91], tone: 'amber' },
    ],
    journey: [
      { day: 1, label: 'Idea', detail: 'Noticed farms in Cap Bon dumping produce while restaurants imported it', status: 'done', emoji: '💡' },
      { day: 7, label: 'Customer interviews', detail: '23 farms and 14 restaurants interviewed', status: 'done', emoji: '🎤' },
      { day: 21, label: 'Prototype', detail: 'Excel + WhatsApp ordering — 3 farms, 5 restaurants', status: 'done', emoji: '🧪' },
      { day: 42, label: 'MVP launched', detail: 'Web app with demand forecast + route grouping', status: 'done', emoji: '🚀' },
      { day: 68, label: 'First paying customer', detail: 'Restaurant Dar Zarrouk signed a monthly plan', status: 'done', emoji: '🤝' },
      { day: 87, label: 'Revenue: 4,200 TND MRR', detail: '87 customers, 91% retention', status: 'now', emoji: '📈' },
      { day: 120, label: 'Crowdfunding campaign', detail: '25,000 TND to build the driver app + 2 new regions', status: 'next', emoji: '💰' },
    ],
    founderId: ME_ID,
    team: [
      { name: 'Ahmed Ben Ali', role: 'Founder · Ops & sales', personId: ME_ID },
      { name: 'Nadia Slim', role: 'Co-founder · Data' },
      { name: 'Karim Ouali', role: 'Backend (part-time)' },
    ],
    followers: 1284, supporters: 214,
    endorsements: [
      { expertId: 'e_karim', quote: 'Ahmed cut his MVP from 11 features to 3 and still learned more than most teams do in six months. Rare discipline.', at: 'Day 46' },
      { expertId: 'e_dina', quote: 'The clearest B2B pipeline I have reviewed from a first-time founder. Every restaurant conversation is logged and followed up.', at: 'Day 71' },
      { expertId: 'e_reda', quote: 'Unit economics hold up: 14 TND CAC against 48 TND monthly gross margin per client.', at: 'Day 84' },
    ],
    campaignId: 'c_agrix', incubatorId: 'inc_orbit', cohortId: 'co_orbit26', mentorId: 'e_karim',
    health: 'ok', roadmapId: 'r_agrix',
    businessModel: '9% commission on produce volume + 89 TND/month logistics subscription for restaurants.',
    market: '5,400 restaurants and 12,000 small farms in Greater Tunis, Nabeul and Sousse. 210M TND of fresh produce flows through the region yearly.',
  },
  {
    id: 's_sanad', slug: 'sanad-pay', name: 'Sanad Pay', emoji: '🧾', gradient: G.fin,
    tagline: 'Invoice financing for Tunisian SMEs in 48 hours.',
    description: 'Small suppliers wait 90–120 days to get paid. Sanad Pay advances 80% of a verified invoice in 48 hours.',
    problem: 'SMEs die of late payment, not lack of demand. 90–120 day terms are normal and banks will not touch invoices under 20,000 TND.',
    solution: 'Digital invoice verification with the buyer, risk scoring on payment history, and a funding pool that advances 80% within 48 hours.',
    industry: 'FinTech', city: 'Sfax', country: 'Tunisia',
    day: 212, buildInPublic: true, stages: stages(6, 100),
    kpis: [
      { label: 'Invoices financed', value: '412', delta: '+38', trend: [12, 44, 96, 168, 240, 330, 412], tone: 'brand' },
      { label: 'Volume', value: '1.9M TND', delta: '+21%', trend: [80, 240, 480, 820, 1200, 1600, 1900], tone: 'seed' },
      { label: 'MRR', value: '11,400 TND', delta: '+16%', trend: [1200, 2600, 4100, 6000, 8100, 9800, 11400], tone: 'seed' },
      { label: 'Default rate', value: '1.4%', delta: '-0.3pts', trend: [3.1, 2.8, 2.4, 2.1, 1.9, 1.7, 1.4], tone: 'amber' },
    ],
    journey: [
      { day: 1, label: 'Idea', detail: 'Left the bank after refusing 40 invoice-financing requests in a month', status: 'done', emoji: '💡' },
      { day: 12, label: '48 SME interviews', status: 'done', emoji: '🎤' },
      { day: 34, label: 'Manual pilot with 6 suppliers', status: 'done', emoji: '🧪' },
      { day: 70, label: 'MVP + risk engine', status: 'done', emoji: '🚀' },
      { day: 118, label: '100 invoices financed', status: 'done', emoji: '📦' },
      { day: 165, label: 'Crowdfunding funded — 40,000 TND', status: 'done', emoji: '💰' },
      { day: 212, label: 'Scaling to Sousse & Tunis', status: 'now', emoji: '📈' },
    ],
    founderId: 'p_nour',
    team: [{ name: 'Nour Trabelsi', role: 'Founder · Credit', personId: 'p_nour' }, { name: 'Riadh Fourati', role: 'CTO' }],
    followers: 2130, supporters: 486,
    endorsements: [{ expertId: 'e_reda', quote: 'Nour’s risk model is more conservative than most banks. That is why the default rate keeps falling.', at: 'Day 150' }],
    campaignId: 'c_sanad', incubatorId: 'inc_orbit', cohortId: 'co_orbit25', mentorId: 'e_reda', health: 'ok',
    businessModel: '3.5% discount fee per financed invoice + 99 TND/month platform fee.',
    market: '78,000 registered SMEs in Tunisia; 4.2B TND locked in receivables.',
  },
  {
    id: 's_darija', slug: 'darija-ai', name: 'Darija AI', emoji: '🗣️', gradient: G.ai,
    tagline: 'Voice AI that understands Maghrebi dialects.',
    description: 'Speech recognition and voice agents for Moroccan Darija, Tunisian Derja and Algerian dialect — the languages global models fail at.',
    problem: 'Call centres, banks and delivery companies across the Maghreb automate nothing by voice because global speech models score below 60% on local dialects.',
    solution: 'A dialect-first speech stack trained on 1,900 hours of consented regional audio, delivered as an API and as ready-made voice agents.',
    industry: 'AI', city: 'Casablanca', country: 'Morocco',
    day: 168, buildInPublic: true, stages: stages(4, 60),
    kpis: [
      { label: 'Enterprise pilots', value: '9', delta: '+3', trend: [1, 2, 3, 5, 6, 8, 9], tone: 'brand' },
      { label: 'Audio hours', value: '1,900', delta: '+240', trend: [180, 420, 700, 1050, 1400, 1700, 1900], tone: 'seed' },
      { label: 'Word accuracy', value: '92.4%', delta: '+4.1pts', trend: [61, 68, 74, 81, 86, 90, 92.4], tone: 'seed' },
      { label: 'API calls / mo', value: '640k', delta: '+52%', trend: [20, 60, 130, 240, 380, 500, 640], tone: 'amber' },
    ],
    journey: [
      { day: 1, label: 'Idea', status: 'done', emoji: '💡' },
      { day: 16, label: 'Dataset collection begins', status: 'done', emoji: '🎙️' },
      { day: 48, label: 'First model beats global baseline', status: 'done', emoji: '🧪' },
      { day: 92, label: 'API MVP live', status: 'done', emoji: '🚀' },
      { day: 168, label: '9 enterprise pilots', status: 'now', emoji: '🤝' },
      { day: 200, label: 'Crowdfunding + seed round', status: 'next', emoji: '💰' },
    ],
    founderId: 'p_yassine',
    team: [{ name: 'Yassine El Amrani', role: 'Founder · ML', personId: 'p_yassine' }, { name: 'Salma Idrissi', role: 'Linguistics lead' }, { name: 'Anas Berrada', role: 'Infra' }],
    followers: 3480, supporters: 712,
    endorsements: [{ expertId: 'e_youssef', quote: 'Serving costs per call are 6× lower than the obvious architecture. The engineering here is genuinely good.', at: 'Day 140' }],
    campaignId: 'c_darija', incubatorId: 'inc_maghreb', cohortId: 'co_maghreb26', mentorId: 'e_youssef', health: 'ok',
    businessModel: 'Usage-based API pricing + annual enterprise licences.',
    market: '4,300 call-centre seats in Morocco and Tunisia; MENA conversational AI spend growing 34% yearly.',
  },
  {
    id: 's_sahti', slug: 'sahti', name: 'Sahti', emoji: '🩺', gradient: G.health,
    tagline: 'Specialist teleconsultation for underserved regions.',
    description: 'Video consultations with specialists for patients in interior governorates, with local nurses handling the physical exam.',
    problem: 'A patient in Kasserine waits 7 weeks and travels 180 km to see a cardiologist. 62% of Tunisian specialists work in 3 coastal cities.',
    solution: 'Partner pharmacies and local clinics act as consultation points with a nurse and a connected exam kit; specialists join by video.',
    industry: 'HealthTech', city: 'Sousse', country: 'Tunisia',
    day: 96, buildInPublic: true, stages: stages(4, 45),
    kpis: [
      { label: 'Consultations', value: '340', delta: '+62', trend: [8, 30, 68, 120, 190, 265, 340], tone: 'brand' },
      { label: 'Partner points', value: '11', delta: '+3', trend: [1, 2, 4, 6, 8, 9, 11], tone: 'seed' },
      { label: 'Avg wait', value: '3 days', delta: '-4 days', trend: [21, 17, 13, 9, 7, 5, 3], tone: 'seed' },
      { label: 'Repeat rate', value: '48%', delta: '+9pts', trend: [12, 19, 25, 31, 38, 43, 48], tone: 'amber' },
    ],
    journey: [
      { day: 1, label: 'Idea', status: 'done', emoji: '💡' },
      { day: 14, label: '60 patient interviews', status: 'done', emoji: '🎤' },
      { day: 38, label: 'Pilot in 2 pharmacies', status: 'done', emoji: '🧪' },
      { day: 62, label: 'MVP + booking flow', status: 'done', emoji: '🚀' },
      { day: 96, label: 'Scaling partner points', status: 'now', emoji: '📈' },
      { day: 140, label: 'Crowdfunding for exam kits', status: 'next', emoji: '💰' },
    ],
    founderId: 'p_mariem',
    team: [{ name: 'Mariem Gharbi', role: 'Founder · Clinical', personId: 'p_mariem' }, { name: 'Tarek Ben Salah', role: 'Product' }],
    followers: 940, supporters: 168,
    endorsements: [{ expertId: 'e_amal', quote: 'Mariem got the regulatory framing right before writing code — unusual and very valuable in health.', at: 'Day 70' }],
    incubatorId: 'inc_orbit', cohortId: 'co_orbit26', mentorId: 'e_amal', health: 'warn',
    businessModel: '35 TND per consultation split with the partner point; subscription for chronic follow-up.',
    market: '4.1M people living more than 60 km from a specialist in Tunisia.',
  },
  {
    id: 's_kaissa', slug: 'kaissa', name: 'Kaissa', emoji: '🧮', gradient: G.saas,
    tagline: 'POS and inventory for small Tunisian retailers.',
    description: 'A phone-first point of sale that tracks stock, credit ledgers (karnet) and supplier orders for neighbourhood shops.',
    problem: 'Small shops track stock in paper notebooks. They lose 6–9% of revenue to stockouts and forgotten customer credit.',
    solution: 'A Flutter app that works offline, scans barcodes, tracks the karnet digitally, and suggests reorders.',
    industry: 'SaaS', city: 'Monastir', country: 'Tunisia',
    day: 44, buildInPublic: true, stages: stages(2, 55),
    kpis: [
      { label: 'Pilot shops', value: '14', delta: '+6', trend: [1, 2, 4, 6, 9, 11, 14], tone: 'brand' },
      { label: 'Interviews', value: '30', delta: '+10', trend: [3, 7, 12, 17, 21, 26, 30], tone: 'seed' },
      { label: 'Weekly active', value: '9', delta: '+2', trend: [1, 1, 3, 4, 6, 7, 9], tone: 'amber' },
      { label: 'Paying', value: '0', delta: 'pricing test', trend: [0, 0, 0, 0, 0, 0, 0], tone: 'rose' },
    ],
    journey: [
      { day: 1, label: 'Idea', status: 'done', emoji: '💡' },
      { day: 9, label: '30 shop interviews', status: 'done', emoji: '🎤' },
      { day: 26, label: 'Paper prototype in 4 shops', status: 'done', emoji: '🧪' },
      { day: 44, label: 'Pricing validation', status: 'now', emoji: '💬' },
      { day: 70, label: 'MVP launch', status: 'next', emoji: '🚀' },
    ],
    founderId: 'p_ines',
    team: [{ name: 'Ines Chaabane', role: 'Founder · Product', personId: 'p_ines' }],
    followers: 412, supporters: 61, endorsements: [], health: 'warn',
    businessModel: 'Testing 29 / 49 / 79 TND per month tiers.',
    market: '42,000 neighbourhood shops in Tunisia.',
  },
  {
    id: 's_nafhem', slug: 'nafhem', name: 'Nafhem', emoji: '📚', gradient: G.edu,
    tagline: 'AI tutor for bac students, in Arabic and French.',
    description: 'Step-by-step tutoring aligned to the Tunisian curriculum, with a teacher-reviewed answer bank.',
    problem: 'Private tutoring costs 40–80 TND/hour. Families spend up to 15% of income on it and rural students get nothing.',
    solution: 'An AI tutor grounded in the official curriculum, reviewed by teachers, at 19 TND/month — plus weekly live group sessions.',
    industry: 'EdTech', city: 'Tunis', country: 'Tunisia',
    day: 131, buildInPublic: true, stages: stages(4, 80),
    kpis: [
      { label: 'Students', value: '2,900', delta: '+410', trend: [120, 380, 720, 1200, 1800, 2400, 2900], tone: 'brand' },
      { label: 'Paying', value: '318', delta: '+74', trend: [8, 26, 61, 110, 178, 250, 318], tone: 'seed' },
      { label: 'MRR', value: '6,040 TND', delta: '+29%', trend: [150, 500, 1160, 2090, 3380, 4750, 6040], tone: 'seed' },
      { label: 'Weekly retention', value: '64%', delta: '+6pts', trend: [31, 38, 44, 51, 55, 60, 64], tone: 'amber' },
    ],
    journey: [
      { day: 1, label: 'Idea', status: 'done', emoji: '💡' },
      { day: 11, label: '40 parent interviews', status: 'done', emoji: '🎤' },
      { day: 30, label: 'WhatsApp tutoring pilot', status: 'done', emoji: '🧪' },
      { day: 58, label: 'MVP launched', status: 'done', emoji: '🚀' },
      { day: 94, label: 'First 100 paying families', status: 'done', emoji: '🤝' },
      { day: 131, label: 'Crowdfunding live', status: 'now', emoji: '💰' },
    ],
    founderId: 'p_sami',
    team: [{ name: 'Sami Kacem', role: 'Founder · Curriculum', personId: 'p_sami' }, { name: 'Hend Aouini', role: 'Engineering' }, { name: 'Moez Dridi', role: 'Teacher network' }],
    followers: 1580, supporters: 392,
    endorsements: [
      { expertId: 'e_sonia', quote: 'Sami has the rarest thing in EdTech: retention. 64% weekly on a teenage audience is exceptional.', at: 'Day 120' },
    ],
    campaignId: 'c_nafhem', health: 'ok',
    businessModel: '19 TND/month per student; school licences from 900 TND/year.',
    market: '1.2M secondary students in Tunisia; 140k bac candidates yearly.',
  },
  {
    id: 's_shamsi', slug: 'shamsi', name: 'Shamsi', emoji: '☀️', gradient: G.climate,
    tagline: 'Solar micro-leasing for farms and workshops.',
    description: 'Pay-as-you-produce solar for small agricultural and artisan businesses in southern Tunisia.',
    problem: 'A 5kW solar setup costs 14,000 TND up front — 3 years of profit for a small farm. Banks will not finance it.',
    solution: 'We install and own the panels; the business pays a monthly fee lower than its diesel bill, with remote monitoring.',
    industry: 'ClimateTech', city: 'Gabès', country: 'Tunisia',
    day: 78, buildInPublic: true, stages: stages(3, 40),
    kpis: [
      { label: 'Installations', value: '12', delta: '+4', trend: [1, 2, 4, 6, 8, 10, 12], tone: 'brand' },
      { label: 'kWh generated', value: '38,400', delta: '+24%', trend: [1200, 4800, 9600, 16000, 23000, 31000, 38400], tone: 'seed' },
      { label: 'Monthly recurring', value: '3,120 TND', delta: '+18%', trend: [180, 460, 880, 1400, 2000, 2600, 3120], tone: 'seed' },
      { label: 'Diesel saved', value: '11,200 L', delta: '+2,400 L', trend: [400, 1600, 3200, 5200, 7200, 9200, 11200], tone: 'amber' },
    ],
    journey: [
      { day: 1, label: 'Idea', status: 'done', emoji: '💡' },
      { day: 18, label: '35 farm interviews', status: 'done', emoji: '🎤' },
      { day: 40, label: 'First 3 installations', status: 'done', emoji: '🧪' },
      { day: 78, label: 'Financing model validation', status: 'now', emoji: '📊' },
      { day: 110, label: 'Crowdfunding for 20 installs', status: 'next', emoji: '💰' },
    ],
    founderId: 'p_hamza',
    team: [{ name: 'Hamza Louati', role: 'Founder · Energy', personId: 'p_hamza' }, { name: 'Sabri Mahjoub', role: 'Field ops' }],
    followers: 690, supporters: 122, endorsements: [], campaignId: 'c_shamsi', health: 'ok',
    businessModel: '190–420 TND/month leasing per site over 60 months.',
    market: '23,000 small farms in southern Tunisia spending 300+ TND/month on diesel.',
  },
  {
    id: 's_souklink', slug: 'souklink', name: 'SoukLink', emoji: '🧵', gradient: G.ecom,
    tagline: 'Export storefronts for Tunisian artisans.',
    description: 'Storefront, payments and export paperwork for artisan workshops selling to Europe.',
    problem: 'Artisans sell to tourists at 1/5 of the European retail price and cannot navigate export logistics or online payment.',
    solution: 'Shared export logistics, a curated marketplace, and paperwork handled for the artisan.',
    industry: 'E-commerce', city: 'Sfax', country: 'Tunisia',
    day: 61, buildInPublic: true, stages: stages(3, 30),
    kpis: [
      { label: 'Artisans', value: '58', delta: '+12', trend: [4, 10, 19, 28, 38, 48, 58], tone: 'brand' },
      { label: 'Orders', value: '206', delta: '+41', trend: [6, 22, 48, 84, 128, 168, 206], tone: 'seed' },
      { label: 'GMV', value: '52,800 TND', delta: '+31%', trend: [1200, 5400, 12000, 21000, 32000, 43000, 52800], tone: 'seed' },
      { label: 'Repeat buyers', value: '22%', delta: '+5pts', trend: [4, 8, 11, 14, 17, 19, 22], tone: 'amber' },
    ],
    journey: [
      { day: 1, label: 'Idea', status: 'done', emoji: '💡' },
      { day: 15, label: '25 artisan interviews', status: 'done', emoji: '🎤' },
      { day: 33, label: 'First 10 storefronts', status: 'done', emoji: '🧪' },
      { day: 61, label: 'Export logistics pilot', status: 'now', emoji: '📦' },
      { day: 100, label: 'MVP marketplace launch', status: 'next', emoji: '🚀' },
    ],
    founderId: 'p_rania',
    team: [{ name: 'Rania Belhaj', role: 'Founder', personId: 'p_rania' }, { name: 'Mehdi Kammoun', role: 'Logistics' }],
    followers: 830, supporters: 144, endorsements: [], health: 'risk',
    businessModel: '12% marketplace commission + 39 TND/month storefront.',
    market: '35,000 artisan workshops in Tunisia; 1.4B€ European market for Mediterranean crafts.',
  },
  {
    id: 's_wassel', slug: 'wassel', name: 'Wassel', emoji: '📦', gradient: G.logi,
    tagline: 'Last-mile delivery for neighbourhood grocers.',
    description: 'Shared delivery fleet that lets small grocers offer same-hour delivery without hiring drivers.',
    problem: 'Neighbourhood grocers lose customers to apps but cannot afford their own drivers or 25% commissions.',
    solution: 'A shared rider network priced per delivery, with routing that batches orders from several shops on one street.',
    industry: 'Logistics', city: 'Cairo', country: 'Egypt',
    day: 154, buildInPublic: true, stages: stages(5, 35),
    kpis: [
      { label: 'Deliveries / mo', value: '18,400', delta: '+22%', trend: [900, 2800, 5600, 8900, 12400, 15600, 18400], tone: 'brand' },
      { label: 'Shops', value: '146', delta: '+24', trend: [8, 24, 48, 76, 104, 126, 146], tone: 'seed' },
      { label: 'Revenue / mo', value: '412k EGP', delta: '+19%', trend: [22, 62, 128, 205, 288, 350, 412], tone: 'seed' },
      { label: 'Cost / delivery', value: '14.2 EGP', delta: '-2.1', trend: [24, 22, 20, 18, 17, 15.6, 14.2], tone: 'amber' },
    ],
    journey: [
      { day: 1, label: 'Idea', status: 'done', emoji: '💡' },
      { day: 20, label: '50 grocer interviews', status: 'done', emoji: '🎤' },
      { day: 44, label: 'Manual WhatsApp dispatch', status: 'done', emoji: '🧪' },
      { day: 78, label: 'MVP + rider app', status: 'done', emoji: '🚀' },
      { day: 112, label: '100 shops onboarded', status: 'done', emoji: '🤝' },
      { day: 154, label: 'Expanding to Giza', status: 'now', emoji: '📈' },
    ],
    founderId: 'p_omar',
    team: [{ name: 'Omar Fathy', role: 'Founder · Ops', personId: 'p_omar' }, { name: 'Hana Mostafa', role: 'Growth' }, { name: 'Kareem Adel', role: 'Engineering' }],
    followers: 2740, supporters: 508,
    endorsements: [{ expertId: 'e_dina', quote: 'Omar’s shop-onboarding playbook converts at 41%. That is a distribution moat, not a delivery company.', at: 'Day 120' }],
    campaignId: 'c_wassel', health: 'ok',
    businessModel: '11 EGP per delivery paid by the shop; ads and financing on top.',
    market: '120,000 neighbourhood grocers in Greater Cairo.',
  },
  {
    id: 's_qard', slug: 'qard', name: 'Qard', emoji: '🏦', gradient: G.night,
    tagline: 'Sharia-compliant working capital for merchants.',
    description: 'Murabaha-based inventory financing for small merchants, approved in one day.',
    problem: 'Small merchants cannot access inventory financing that is both fast and Sharia-compliant.',
    solution: 'We buy the inventory and resell it at a disclosed markup with instalments, scored on POS and supplier data.',
    industry: 'FinTech', city: 'Riyadh', country: 'Saudi Arabia',
    day: 246, buildInPublic: true, stages: stages(6, 100),
    kpis: [
      { label: 'Merchants financed', value: '640', delta: '+72', trend: [40, 110, 210, 320, 440, 550, 640], tone: 'brand' },
      { label: 'Financed volume', value: '18.4M SAR', delta: '+24%', trend: [900, 2800, 5600, 9200, 12800, 15800, 18400], tone: 'seed' },
      { label: 'Revenue / mo', value: '780k SAR', delta: '+17%', trend: [40, 130, 250, 400, 550, 670, 780], tone: 'seed' },
      { label: 'NPL', value: '2.1%', delta: '-0.4pts', trend: [4.4, 3.9, 3.4, 3.0, 2.7, 2.4, 2.1], tone: 'amber' },
    ],
    journey: [
      { day: 1, label: 'Idea', status: 'done', emoji: '💡' },
      { day: 30, label: 'Sharia board sign-off', status: 'done', emoji: '📜' },
      { day: 62, label: 'Pilot with 20 merchants', status: 'done', emoji: '🧪' },
      { day: 110, label: 'Regulatory sandbox admitted', status: 'done', emoji: '🏛️' },
      { day: 180, label: 'Crowdfunding funded', status: 'done', emoji: '💰' },
      { day: 246, label: 'Expanding to Jeddah & Dammam', status: 'now', emoji: '📈' },
    ],
    founderId: 'p_layla',
    team: [{ name: 'Layla Al-Harbi', role: 'Founder', personId: 'p_layla' }, { name: 'Faisal Al-Otaibi', role: 'Risk' }],
    followers: 4120, supporters: 906, endorsements: [], health: 'ok',
    businessModel: 'Disclosed markup on financed inventory (average 8.4% per 90-day cycle).',
    market: '480,000 small merchants in Saudi Arabia; 62% underserved by formal credit.',
  },
];

/* ------------------------------------------------------------
   POSTS  (feed)
   ------------------------------------------------------------ */
export const POSTS: Post[] = [
  {
    id: 'po_1', authorId: ME_ID, startupId: 's_agrix', type: 'build', day: 87,
    text: 'Day 87 of building AgriX.\n\nToday we interviewed 8 restaurant owners in Lac 2. 6 confirmed the problem is exactly what we think it is: they can not plan quantities because prices move every morning.\n\nOne of them asked to be invoiced monthly instead of per delivery. That is now in the roadmap.',
    at: '2h', ts: 2,
    milestone: { label: 'Complete MVP testing', pct: 72 },
    kpiChip: { label: 'MRR', value: '4,200 TND' },
    media: { kind: 'chart', emoji: '📈', caption: 'MRR growth · last 7 weeks', gradient: G.agri, series: [300, 700, 1200, 1900, 2600, 3400, 4200], seriesLabel: 'MRR (TND)' },
    supports: 148, shares: 12,
    comments: [
      { id: 'c1', authorId: 'e_dina', text: 'Monthly invoicing will double your average contract length. Do it before you add any new feature.', at: '1h', supports: 22, expert: true },
      { id: 'c2', authorId: 's_leila', text: 'I own 3 shops in Monastir — same problem with produce. Tell me when you reach Sahel.', at: '48m', supports: 9 },
    ],
    reason: 'Your startup', pinned: false,
  },
  {
    id: 'po_2', authorId: 'p_ines', startupId: 's_kaissa', type: 'question',
    text: 'Would you pay 50 TND/month for this?\n\nI am building a POS + stock app for small Tunisian retailers. Offline-first, barcode scanning, digital karnet for customer credit.\n\n14 shops are testing it for free. Now I need to know what is actually payable.',
    at: '4h', ts: 4,
    poll: {
      question: 'What would you pay per month?',
      options: [
        { label: 'Under 30 TND', votes: 41 },
        { label: '30–49 TND', votes: 68 },
        { label: '50–79 TND', votes: 37 },
        { label: 'Only if it replaces my accountant', votes: 24 },
      ],
    },
    supports: 96, shares: 7,
    comments: [
      { id: 'c3', authorId: 'e_reda', text: 'Do not ask what they would pay. Ask what they pay today for the notebook + the losses. You will find 80–120 TND of pain per month.', at: '3h', supports: 54, expert: true },
      { id: 'c4', authorId: ME_ID, text: 'Charge per shop, not per user. Retailers understand that instantly.', at: '2h', supports: 18 },
    ],
    reason: 'Trending in SaaS',
  },
  {
    id: 'po_3', authorId: 'p_hamza', startupId: 's_shamsi', type: 'failure',
    text: '❌ Our first pricing experiment failed.\n\nWe expected farms to pay 480 TND/month for a 5kW solar lease. 8 out of 10 said no — not because of the amount, but because the commitment was 60 months.\n\nWhat we learned:\n• The objection was never the price, it was the lock-in\n• Two farmers asked for a seasonal plan tied to harvest income\n• Diesel spend is seasonal, so our flat fee never matched their cash flow\n\nNew experiment: 190 TND base + a harvest-season top-up. Testing with 4 farms next week.',
    at: '7h', ts: 7,
    media: { kind: 'image', emoji: '🌞', caption: 'Installation #12 · Gabès — the interview that changed our pricing', gradient: G.climate },
    supports: 312, shares: 41,
    comments: [
      { id: 'c5', authorId: 'p_nour', text: 'This is the most useful failure post I have read this month. Seasonal cash flow kills a lot of MENA subscription models.', at: '5h', supports: 63 },
      { id: 'c6', authorId: 'e_reda', text: 'Model the seasonal plan against your 60-month payback before you launch it. Happy to review the sheet in a session.', at: '4h', supports: 28, expert: true },
    ],
    reason: 'Most supported failure post this week',
  },
  {
    id: 'po_4', authorId: 'p_yassine', startupId: 's_darija', type: 'progress',
    text: '🚀 Our dialect model just crossed 92% word accuracy on Tunisian Derja.\n\nThree months ago we were at 61%, worse than useless. The unlock was not more data — it was 40 hours of properly annotated code-switching between Derja, French and Arabic.\n\n9 enterprise pilots running. Two call centres are moving to production next month.',
    at: '11h', ts: 11,
    media: { kind: 'video', emoji: '🎙️', caption: 'Live demo: ordering a coffee in Derja, handled end-to-end', gradient: G.ai, duration: '1:24' },
    kpiChip: { label: 'Accuracy', value: '92.4%' },
    supports: 428, shares: 76,
    comments: [{ id: 'c7', authorId: 'e_youssef', text: 'The code-switching insight is the whole business. Nobody else in the region has that dataset.', at: '9h', supports: 44, expert: true }],
    reason: 'From founders you follow',
  },
  {
    id: 'po_5', authorId: 'p_nour', startupId: 's_sanad', type: 'achievement',
    text: '🎉 400 invoices financed.\n\n1.9M TND has moved to suppliers who would otherwise have waited 90 to 120 days. Default rate is down to 1.4%.\n\nTo everyone who backed our campaign at Day 165: this is what your 40,000 TND became.',
    at: '1d', ts: 26,
    media: { kind: 'chart', emoji: '🧾', caption: 'Invoices financed per week', gradient: G.fin, series: [12, 44, 96, 168, 240, 330, 412], seriesLabel: 'Invoices' },
    supports: 522, shares: 88,
    comments: [{ id: 'c8', authorId: 's_fatma', text: 'I backed this at 300 TND. Best decision of my year — and I can see every update.', at: '22h', supports: 37 }],
    reason: 'From startups you follow',
  },
  {
    id: 'po_6', authorId: 'p_sami', startupId: 's_nafhem', type: 'funding',
    text: '💰 We are raising 60,000 TND to build the offline mode.\n\n2,900 students use Nafhem. 41% of them lose connection during a session — mostly in interior governorates, exactly the students who need us most.\n\nThe campaign funds: offline lessons, 3 more subject packs, and 40 teacher reviewers.',
    at: '1d', ts: 30,
    ask: [{ label: 'Goal', value: '60,000 TND' }, { label: 'Raised', value: '24,600 TND' }, { label: 'Supporters', value: '392' }],
    supports: 274, shares: 52,
    comments: [{ id: 'c9', authorId: 'e_sonia', text: 'Lead with the 41% number in your campaign hero. That single stat is your whole pitch.', at: '20h', supports: 31, expert: true }],
    reason: 'Campaign live now',
  },
  {
    id: 'po_7', authorId: ME_ID, startupId: 's_agrix', type: 'help',
    text: '🙋 Looking for a Flutter developer to help us build the driver app.\n\n6–8 weeks, part-time, paid. You would own the offline sync (drivers lose signal constantly on rural routes).\n\nAlso looking for 2 pilot restaurants in Sousse.',
    at: '2d', ts: 50,
    supports: 64, shares: 23,
    comments: [{ id: 'c10', authorId: 's_bilal', text: 'Not Flutter, but I can do the driver app UI for free. I like what you are building.', at: '1d', supports: 14 }],
    reason: 'Your startup',
  },
  {
    id: 'po_8', authorId: 'p_omar', startupId: 's_wassel', type: 'educational',
    text: '5 things I learned after onboarding 146 grocers:\n\n1. They do not care about your app. They care about not losing the customer who called.\n2. Never say "platform". Say "your delivery guy, without hiring one".\n3. The owner signs, but the cashier decides if it gets used.\n4. Free trials made retention worse. A 50 EGP deposit fixed it.\n5. The best channel was not ads — it was the supplier who visits 40 shops a week.',
    at: '2d', ts: 54,
    supports: 617, shares: 143,
    comments: [
      { id: 'c11', authorId: 'p_ines', text: 'Number 3 just explained why 5 of my 14 pilot shops went quiet. Thank you.', at: '2d', supports: 48 },
      { id: 'c12', authorId: 'e_dina', text: 'Point 5 is the whole playbook. Distribution through existing route salespeople is underused across MENA.', at: '1d', supports: 39, expert: true },
    ],
    reason: 'Top educational post',
  },
  {
    id: 'po_9', authorId: 'p_mariem', startupId: 's_sahti', type: 'build', day: 96,
    text: 'Day 96 of building Sahti.\n\n340 consultations delivered. Average wait for a specialist dropped from 21 days to 3 for patients at our 11 partner points.\n\nHonest struggle: 2 of our 11 points did almost nothing this month. I think the nurse incentive is wrong, not the demand.',
    at: '3d', ts: 74,
    milestone: { label: 'Validate partner-point economics', pct: 45 },
    kpiChip: { label: 'Consultations', value: '340' },
    supports: 189, shares: 18,
    comments: [{ id: 'c13', authorId: 'e_karim', text: 'Pay the nurse per completed consultation, not per shift. You will see which points were an incentive problem within two weeks.', at: '3d', supports: 41, expert: true }],
    reason: 'Regional · Sousse',
  },
  {
    id: 'po_10', authorId: 'p_rania', startupId: 's_souklink', type: 'progress',
    text: 'First container of artisan goods cleared customs today. 206 orders, 52,800 TND of GMV, 58 workshops.\n\nOne artisan in Nabeul earned more from 14 online orders than from 3 months of tourist walk-ins.',
    at: '3d', ts: 78,
    media: { kind: 'image', emoji: '🧺', caption: 'Sfax port — first export batch', gradient: G.ecom },
    supports: 231, shares: 34, comments: [],
    reason: 'Trending in E-commerce',
  },
  {
    id: 'po_11', authorId: 'p_layla', startupId: 's_qard', type: 'educational',
    text: 'How we got into the regulatory sandbox in 110 days, as a 2-person team:\n\n• We wrote the Sharia structure before the product. The board sign-off became our credibility document.\n• We financed 20 merchants manually first, so every claim in the application had real repayment data behind it.\n• We shared the numbers publicly every week. Two of the regulators had been reading them before we applied.\n\nBuilding in public is not marketing. It is a paper trail.',
    at: '4d', ts: 98,
    supports: 704, shares: 187,
    comments: [{ id: 'c14', authorId: ME_ID, text: '"Building in public is a paper trail" — that is going on my wall.', at: '3d', supports: 52 }],
    reason: 'Top post in MENA this week',
  },
  {
    id: 'po_12', authorId: 'e_karim', type: 'educational',
    text: 'A pattern I see in almost every early MENA startup I review:\n\nYou are not short of ideas. You are short of decided ideas.\n\nWrite the one sentence: "We help [who] do [what] so they can [outcome]." If you cannot fill it without an "and", you have two startups and no traction.',
    at: '5d', ts: 122,
    supports: 389, shares: 96,
    comments: [{ id: 'c15', authorId: 'p_hamza', text: 'Filled it in and immediately deleted half my roadmap. Painful, correct.', at: '4d', supports: 27 }],
    reason: 'Recommended expert',
  },
  {
    id: 'po_13', authorId: ME_ID, startupId: 's_agrix', type: 'progress', day: 68,
    text: '🚀 We just signed our first paying customer.\n\nRestaurant Dar Zarrouk in Sidi Bou Said signed a monthly logistics plan. 340 TND for the first month.\n\n42 days ago this was a spreadsheet and a WhatsApp group.',
    at: '19d', ts: 460,
    media: { kind: 'image', emoji: '🤝', caption: 'Day 68 · first signed contract', gradient: G.agri },
    supports: 402, shares: 58,
    comments: [{ id: 'c16', authorId: 'p_nour', text: 'Congratulations! The first contract is the hardest one.', at: '19d', supports: 21 }],
  },
  {
    id: 'po_14', authorId: ME_ID, startupId: 's_agrix', type: 'failure', day: 34,
    text: '❌ Our first experiment failed.\n\nWe expected restaurants to pay 100 TND/month for produce price alerts. 8 out of 10 said no.\n\nWhat we learned: nobody pays for information. They pay for the produce arriving on time at a predictable price. We were selling the dashboard instead of the outcome.\n\nPivoting from "price alerts" to "we handle the delivery".',
    at: '53d', ts: 1280,
    supports: 268, shares: 44,
    comments: [{ id: 'c17', authorId: 'e_karim', text: 'This pivot is the reason AgriX has revenue today. Reread it in six months.', at: '52d', supports: 31, expert: true }],
  },
  {
    id: 'po_15', authorId: 'org_orbit', type: 'progress',
    text: 'Applications for Orbit Labs Cohort 2027 are open.\n\nWe are looking for 24 teams building for MENA-first markets. What we look at first is not your deck — it is your public journey. Show us 8 weeks of updates and you skip the first screening round.',
    at: '6d', ts: 148,
    media: { kind: 'image', emoji: '🛰️', caption: 'Orbit Labs · Cohort 2027 open call', gradient: G.ink },
    supports: 218, shares: 71, comments: [],
    reason: 'Incubator you follow',
  },
];

/* ------------------------------------------------------------
   STORIES
   ------------------------------------------------------------ */
export const STORIES: StoryGroup[] = [
  {
    id: 'st_me', authorId: ME_ID, startupId: 's_agrix', label: 'AgriX — Day 87', at: '3h',
    items: [
      { id: 'sti1', kind: 'video', emoji: '🚚', caption: 'Testing the MVP with three restaurants today', gradient: G.agri, milestoneTag: 'MVP testing · 72%', quote: '“Third stop of the morning. If this route works we cut delivery cost by a third.”' },
      { id: 'sti2', kind: 'image', emoji: '📋', caption: 'Interview notes from Lac 2', gradient: G.ink, quote: '6 of 8 confirmed the problem. One asked for monthly invoicing.' },
      { id: 'sti3', kind: 'text', emoji: '📈', caption: '4,200 TND MRR', gradient: G.night, milestoneTag: 'Revenue', quote: 'Up 24% this month. 87 customers.' },
    ],
  },
  {
    id: 'st_yassine', authorId: 'p_yassine', startupId: 's_darija', label: 'Darija AI — Day 168', at: '5h',
    items: [
      { id: 'sty1', kind: 'video', emoji: '🎙️', caption: 'Recording session #212 in Casablanca', gradient: G.ai, quote: '“Every hour of annotated code-switching is worth ten hours of clean speech.”' },
      { id: 'sty2', kind: 'text', emoji: '🏆', caption: '92.4% accuracy on Derja', gradient: G.night, milestoneTag: 'Model milestone' },
    ],
  },
  {
    id: 'st_nour', authorId: 'p_nour', startupId: 's_sanad', label: 'Sanad Pay — Day 212', at: '8h',
    items: [
      { id: 'stn1', kind: 'image', emoji: '🧾', caption: 'Invoice #400 approved in 31 minutes', gradient: G.fin, milestoneTag: '400 invoices' },
      { id: 'stn2', kind: 'video', emoji: '🏢', caption: 'Opening the Sousse desk', gradient: G.ink },
    ],
  },
  {
    id: 'st_ines', authorId: 'p_ines', startupId: 's_kaissa', label: 'Kaissa — Day 44', at: '10h',
    items: [
      { id: 'sti4', kind: 'video', emoji: '🏪', caption: 'Shop #14 onboarding — 6 minutes from install to first sale', gradient: G.saas, milestoneTag: 'Pilot shops: 14' },
      { id: 'sti5', kind: 'text', emoji: '🤔', caption: 'Pricing test: 29 / 49 / 79 TND', gradient: G.ink, quote: 'Which one would you choose? Answer in the poll on my post.' },
    ],
  },
  {
    id: 'st_mariem', authorId: 'p_mariem', startupId: 's_sahti', label: 'Sahti — Day 96', at: '12h',
    items: [{ id: 'stm1', kind: 'video', emoji: '🩺', caption: 'Consultation point #11 opens in Kasserine', gradient: G.health, milestoneTag: '11 partner points' }],
  },
  {
    id: 'st_hamza', authorId: 'p_hamza', startupId: 's_shamsi', label: 'Shamsi — Day 78', at: '1d',
    items: [
      { id: 'sth1', kind: 'image', emoji: '☀️', caption: 'Installation #12 · 5kW on a date farm', gradient: G.climate, milestoneTag: '12 installs' },
      { id: 'sth2', kind: 'text', emoji: '❌', caption: 'Pricing experiment failed', gradient: G.sunset, quote: '8 of 10 said no. It was the 60-month lock-in, not the price.' },
    ],
  },
  {
    id: 'st_omar', authorId: 'p_omar', startupId: 's_wassel', label: 'Wassel — Day 154', at: '1d',
    items: [{ id: 'sto1', kind: 'video', emoji: '🛵', caption: 'Morning dispatch — 620 orders before 10am', gradient: G.logi, milestoneTag: '18k deliveries/mo' }],
  },
];

/* ------------------------------------------------------------
   SHORT-FORM VIDEO
   ------------------------------------------------------------ */
export const VIDEOS: Video[] = [
  { id: 'v1', authorId: ME_ID, startupId: 's_agrix', title: 'Building my MVP in 30 days', caption: 'Every week of AgriX from spreadsheet to shipped product.', duration: '2:14', views: 18400, supports: 1240, comments: 86, category: 'Building', milestone: 'MVP launched · Day 42', emoji: '🚀', gradient: G.agri },
  { id: 'v2', authorId: 'p_hamza', startupId: 's_shamsi', title: 'Our pricing failed — here is why', caption: '8 out of 10 farms said no. The lesson cost us 5 weeks.', duration: '3:02', views: 26100, supports: 2110, comments: 154, category: 'Failure', milestone: 'Pricing pivot · Day 78', emoji: '❌', gradient: G.climate },
  { id: 'v3', authorId: 'p_omar', startupId: 's_wassel', title: 'What I learned from 146 grocers', caption: 'The onboarding script that converts at 41%.', duration: '4:37', views: 41200, supports: 3380, comments: 240, category: 'Lessons', milestone: '146 shops · Day 154', emoji: '📦', gradient: G.logi },
  { id: 'v4', authorId: 'p_yassine', startupId: 's_darija', title: 'Behind the scenes of a dataset', caption: '1,900 hours of Maghrebi speech. How we collected it legally.', duration: '5:12', views: 33800, supports: 2740, comments: 198, category: 'Behind the scenes', milestone: '92.4% accuracy', emoji: '🎙️', gradient: G.ai },
  { id: 'v5', authorId: 'p_nour', startupId: 's_sanad', title: 'How we got our first customer', caption: 'Six suppliers, one spreadsheet, zero product.', duration: '2:48', views: 22400, supports: 1620, comments: 97, category: 'First customer', milestone: 'First revenue · Day 34', emoji: '🧾', gradient: G.fin },
  { id: 'v6', authorId: 'p_layla', startupId: 's_qard', title: 'Pitching Qard in 90 seconds', caption: 'The pitch that got us into the sandbox.', duration: '1:31', views: 52900, supports: 4210, comments: 312, category: 'Pitch', milestone: 'Sandbox admitted', emoji: '🏦', gradient: G.night },
  { id: 'v7', authorId: 'p_ines', startupId: 's_kaissa', title: 'Validating a POS app in 14 days', caption: '30 shop interviews, one notebook, no code.', duration: '3:20', views: 9800, supports: 740, comments: 61, category: 'Validation', milestone: 'Validation · Day 44', emoji: '🧮', gradient: G.saas },
  { id: 'v8', authorId: 'p_sami', startupId: 's_nafhem', title: 'Why 41% of our students lose connection', caption: 'The number that became our whole campaign.', duration: '2:05', views: 16700, supports: 1180, comments: 74, category: 'Building', milestone: 'Crowdfunding live', emoji: '📚', gradient: G.edu },
  { id: 'v9', authorId: 'e_walid', title: 'The 3 slides investors actually read', caption: 'From 900+ decks reviewed.', duration: '6:44', views: 68300, supports: 5620, comments: 401, category: 'Fundraising', emoji: '📊', gradient: G.ink },
  { id: 'v10', authorId: 'p_mariem', startupId: 's_sahti', title: 'A consultation in Kasserine', caption: 'What 3 days instead of 21 days looks like.', duration: '3:56', views: 14200, supports: 1090, comments: 68, category: 'Behind the scenes', milestone: '11 partner points', emoji: '🩺', gradient: G.health },
];

/* ------------------------------------------------------------
   CAMPAIGNS
   ------------------------------------------------------------ */
export const CAMPAIGNS: Campaign[] = [
  {
    id: 'c_agrix', startupId: 's_agrix',
    headline: 'Help us put 200 Tunisian farms on one logistics network',
    pitch: 'AgriX cuts the intermediaries between farms and restaurants. We have 87 paying customers and 4,200 TND of monthly revenue after 87 days. This campaign funds the driver app and two new regions.',
    goal: 25000, raised: 18500, currency: 'TND', backers: 214, daysLeft: 19, status: 'live',
    useOfFunds: [
      { label: 'Product — driver app & offline sync', pct: 40, color: 'var(--brand-600)' },
      { label: 'Marketing — 2 new regions', pct: 30, color: 'var(--seed-500)' },
      { label: 'Operations — 1 route coordinator', pct: 20, color: 'var(--amber-500)' },
      { label: 'Legal & accounting', pct: 10, color: 'var(--sky-500)' },
    ],
    rewards: [
      { id: 'rw1', title: 'Follower', amount: 30, desc: 'Weekly investor-style update with the real numbers.', claimed: 96, perks: ['Private weekly update', 'Name on the supporters wall'] },
      { id: 'rw2', title: 'Early believer', amount: 150, desc: 'Everything above, plus a monthly open call with the team.', claimed: 71, limit: 120, perks: ['Monthly open call', 'Early access to the driver app', 'Supporters wall'] },
      { id: 'rw3', title: 'Route partner', amount: 600, desc: 'For restaurants: 3 months of logistics subscription plus priority routing.', claimed: 34, limit: 60, perks: ['3 months subscription', 'Priority routing', 'Quarterly strategy call'] },
      { id: 'rw4', title: 'Regional champion', amount: 2500, desc: 'Your name on the first van in a new region, and a seat in our quarterly review.', claimed: 6, limit: 10, perks: ['Name on the van', 'Quarterly review seat', 'Annual data report'] },
    ],
    faqs: [
      { q: 'Is this equity?', a: 'No. This is a reward-based campaign. Supporters receive perks and updates, not shares. (In this demo, no money moves at all.)' },
      { q: 'What happens if you do not reach the goal?', a: 'We keep the milestones we can fund: the driver app comes first at 15,000 TND, the second region at 22,000 TND.' },
      { q: 'How do I know the numbers are real?', a: 'Every KPI on this page is tied to 87 days of public updates. You can scroll our journey and read the failures too.' },
      { q: 'When do perks ship?', a: 'Weekly updates start immediately. Product perks follow the milestone they belong to.' },
    ],
    risks: [
      'Seasonality: produce volume drops 20–30% in winter, which slows revenue growth in months 4–5.',
      'Driver supply in new regions is the hardest input. We are pre-recruiting in Sousse before launching there.',
      'A larger distributor could copy the routing model. Our defence is farm relationships and 91% retention.',
    ],
    why: [
      '87 days of public building — every milestone on this page has a post behind it.',
      '87 paying customers and 91% retention before asking for a dinar.',
      'Three verified expert endorsements, including unit-economics review.',
      'Revenue already covers 58% of monthly operating cost.',
    ],
    milestones: [
      { label: 'Driver app with offline sync', amount: 15000, done: true },
      { label: 'Launch region 2 — Sousse', amount: 22000, done: false },
      { label: 'Launch region 3 — Nabeul', amount: 25000, done: false },
    ],
    updatePostIds: ['po_1', 'po_13', 'po_14'], trending: true,
  },
  {
    id: 'c_nafhem', startupId: 's_nafhem',
    headline: 'Offline mode for 2,900 students who keep losing connection',
    pitch: '41% of Nafhem students drop a session because of connectivity. This campaign funds offline lessons, 3 new subject packs and 40 teacher reviewers.',
    goal: 60000, raised: 24600, currency: 'TND', backers: 392, daysLeft: 27, status: 'live',
    useOfFunds: [
      { label: 'Engineering — offline mode', pct: 45, color: 'var(--brand-600)' },
      { label: 'Content — 3 subject packs', pct: 30, color: 'var(--seed-500)' },
      { label: 'Teacher reviewers', pct: 15, color: 'var(--amber-500)' },
      { label: 'Operations', pct: 10, color: 'var(--sky-500)' },
    ],
    rewards: [
      { id: 'rw5', title: 'Supporter', amount: 25, desc: 'Weekly progress update and the supporters wall.', claimed: 168, perks: ['Weekly update'] },
      { id: 'rw6', title: 'Sponsor a student', amount: 190, desc: 'One year of Nafhem for a student in an interior governorate.', claimed: 142, perks: ['Sponsor certificate', 'Anonymous student progress report'] },
      { id: 'rw7', title: 'Sponsor a classroom', amount: 1400, desc: 'A full class of 25 students for one year.', claimed: 11, limit: 40, perks: ['Class named after you or your company', 'Quarterly impact report'] },
    ],
    faqs: [
      { q: 'Who reviews the AI answers?', a: '40 practising teachers review every generated explanation in the covered curriculum before it is published.' },
      { q: 'Is the content aligned to the official programme?', a: 'Yes — Tunisian secondary curriculum, in Arabic and French.' },
    ],
    risks: ['Offline content licensing takes longer than engineering.', 'Exam-season seasonality concentrates revenue in 4 months.'],
    why: ['131 days of public building.', '318 paying families with 64% weekly retention.', 'Teacher network of 40 reviewers already in place.'],
    milestones: [
      { label: 'Offline lessons for maths & physics', amount: 30000, done: false },
      { label: '3 additional subject packs', amount: 48000, done: false },
      { label: '40 teacher reviewers for a year', amount: 60000, done: false },
    ],
    updatePostIds: ['po_6'], isNew: true,
  },
  {
    id: 'c_darija', startupId: 's_darija',
    headline: 'Open-source the first Maghrebi speech benchmark',
    pitch: 'We are funding a public benchmark and 300 hours of openly licensed dialect audio, so every MENA startup can build voice products.',
    goal: 120000, raised: 96400, currency: 'TND', backers: 712, daysLeft: 11, status: 'live',
    useOfFunds: [
      { label: 'Data collection & consent', pct: 50, color: 'var(--brand-600)' },
      { label: 'Annotation team', pct: 25, color: 'var(--seed-500)' },
      { label: 'Compute', pct: 20, color: 'var(--amber-500)' },
      { label: 'Legal review', pct: 5, color: 'var(--sky-500)' },
    ],
    rewards: [
      { id: 'rw8', title: 'Community', amount: 40, desc: 'Early access to the benchmark and dataset cards.', claimed: 412, perks: ['Early dataset access'] },
      { id: 'rw9', title: 'Builder', amount: 300, desc: 'API credits plus a technical office-hour with the team.', claimed: 218, perks: ['API credits', 'Office hour'] },
      { id: 'rw10', title: 'Institution', amount: 4000, desc: 'Named contributor on the benchmark paper and a private workshop.', claimed: 9, limit: 20, perks: ['Named contributor', 'Private workshop'] },
    ],
    faqs: [{ q: 'Will the dataset really be open?', a: 'Yes, under a permissive licence with full speaker consent. The commercial model is the hosted API, not the data.' }],
    risks: ['Consent-compliant collection is slow in some regions.'],
    why: ['168 days of public building with weekly model metrics.', '9 enterprise pilots already paying for the API.', 'Pitch Week winner.'],
    milestones: [
      { label: '100 hours open audio', amount: 40000, done: true },
      { label: 'Public benchmark v1', amount: 80000, done: true },
      { label: '300 hours + annotation', amount: 120000, done: false },
    ],
    updatePostIds: ['po_4'], trending: true,
  },
  {
    id: 'c_wassel', startupId: 's_wassel',
    headline: 'Expand shared delivery to Giza — 60 new shops',
    pitch: '146 shops, 18,400 deliveries a month, cost per delivery down 41%. This campaign opens the Giza network.',
    goal: 90000, raised: 55800, currency: 'TND', backers: 508, daysLeft: 23, status: 'live',
    useOfFunds: [
      { label: 'Rider onboarding & training', pct: 40, color: 'var(--brand-600)' },
      { label: 'Shop acquisition', pct: 30, color: 'var(--seed-500)' },
      { label: 'Routing engine', pct: 20, color: 'var(--amber-500)' },
      { label: 'Working capital', pct: 10, color: 'var(--sky-500)' },
    ],
    rewards: [
      { id: 'rw11', title: 'Supporter', amount: 35, desc: 'Monthly ops report with real unit economics.', claimed: 302, perks: ['Ops report'] },
      { id: 'rw12', title: 'Operator', amount: 450, desc: 'Quarterly deep-dive call on the routing model.', claimed: 61, limit: 100, perks: ['Deep-dive call', 'Ops report'] },
    ],
    faqs: [{ q: 'Why crowdfunding and not a VC round?', a: 'We are raising both. The community round funds rider onboarding, which investors dislike funding and shops care about most.' }],
    risks: ['Fuel price volatility affects cost per delivery.', 'Rider churn in the first 30 days is 24%.'],
    why: ['154 days public.', '41% shop onboarding conversion.', 'Cost per delivery down from 24 to 14.2 EGP.'],
    milestones: [
      { label: '30 riders onboarded in Giza', amount: 45000, done: true },
      { label: '60 shops live', amount: 75000, done: false },
      { label: 'Routing v2', amount: 90000, done: false },
    ],
    updatePostIds: ['po_8'],
  },
  {
    id: 'c_sanad', startupId: 's_sanad',
    headline: 'Successfully funded — 40,000 TND from 486 supporters',
    pitch: 'Our community round closed at 162% of goal. Here is what it built: the risk engine, the Sousse desk, and 412 financed invoices.',
    goal: 40000, raised: 64800, currency: 'TND', backers: 486, daysLeft: 0, status: 'funded',
    useOfFunds: [
      { label: 'Risk engine', pct: 40, color: 'var(--brand-600)' },
      { label: 'Sousse desk', pct: 35, color: 'var(--seed-500)' },
      { label: 'Compliance', pct: 25, color: 'var(--amber-500)' },
    ],
    rewards: [{ id: 'rw13', title: 'Supporter', amount: 50, desc: 'Weekly numbers, forever.', claimed: 486, perks: ['Weekly numbers'] }],
    faqs: [{ q: 'What happened after the campaign?', a: 'Volume went from 168 to 412 financed invoices and the default rate fell from 2.1% to 1.4%.' }],
    risks: ['Credit risk concentration in a single sector.'],
    why: ['212 days public.', '1.9M TND of invoices financed.', 'Every supporter still gets the weekly numbers.'],
    milestones: [
      { label: 'Risk engine v1', amount: 20000, done: true },
      { label: 'Sousse desk', amount: 32000, done: true },
      { label: 'Compliance & audit', amount: 40000, done: true },
    ],
    updatePostIds: ['po_5'],
  },
  {
    id: 'c_shamsi', startupId: 's_shamsi',
    headline: '20 solar installations for farms in the south',
    pitch: 'Opening soon. 12 installations running, 11,200 litres of diesel already avoided. The new seasonal plan is being tested with 4 farms.',
    goal: 75000, raised: 0, currency: 'TND', backers: 0, daysLeft: 12, status: 'upcoming',
    useOfFunds: [
      { label: 'Panels & inverters', pct: 60, color: 'var(--brand-600)' },
      { label: 'Installation crew', pct: 25, color: 'var(--seed-500)' },
      { label: 'Monitoring hardware', pct: 15, color: 'var(--amber-500)' },
    ],
    rewards: [{ id: 'rw14', title: 'Early supporter', amount: 60, desc: 'Follow the generation data of a real installation.', claimed: 0, perks: ['Live generation dashboard'] }],
    faqs: [{ q: 'When does it open?', a: 'In 12 days, once the seasonal pricing test with 4 farms concludes.' }],
    risks: ['Import lead times on inverters.', 'Seasonal cash flow of farm customers.'],
    why: ['78 days public, including a very honest pricing failure.', '12 installations with monitored output.'],
    milestones: [{ label: '8 installations', amount: 30000, done: false }, { label: '20 installations', amount: 75000, done: false }],
    updatePostIds: ['po_3'], isNew: true,
  },
];

/* ------------------------------------------------------------
   EXPERTS
   ------------------------------------------------------------ */
export const EXPERTS: ExpertProfile[] = [
  {
    id: 'x_karim', personId: 'e_karim', headline: 'I will cut your MVP in half and you will learn more',
    categories: ['Product', 'Technology'], industries: ['SaaS', 'AgriTech', 'Logistics'], years: 12,
    rating: 4.9, reviews: 128, sessions: 340, price30: 120, price60: 210, packagePrice: 900,
    packageDesc: '4 sessions over 6 weeks: MVP scoping, discovery plan, roadmap review, launch review.',
    availability: ['Tue 09:00', 'Tue 14:00', 'Thu 11:00', 'Fri 16:00'], languages: ['Arabic', 'French', 'English'],
    answers: 412, responseTime: 'under 4h', gradient: G.saas,
    topAnswer: { q: 'How do I know my MVP is small enough?', a: 'If you cannot build it in 3 weeks, it is not an MVP — it is a plan. Pick the single workflow where your user currently loses money, and automate only that.' },
  },
  {
    id: 'x_sonia', personId: 'e_sonia', headline: 'Cheap distribution for MENA-first products',
    categories: ['Marketing', 'Sales'], industries: ['E-commerce', 'EdTech', 'SaaS'], years: 10,
    rating: 4.8, reviews: 96, sessions: 262, price30: 100, price60: 180, packagePrice: 760,
    packageDesc: '4 sessions: channel audit, content engine, paid test plan, retention review.',
    availability: ['Mon 10:00', 'Wed 15:00', 'Thu 09:00'], languages: ['Arabic', 'French'],
    answers: 288, responseTime: 'under 6h', gradient: G.ecom,
    topAnswer: { q: 'Should I run ads before launch?', a: 'No. Run 20 conversations. Ads amplify a message you have not found yet, and in small markets you burn your only audience learning it.' },
  },
  {
    id: 'x_walid', personId: 'e_walid', headline: 'Ex-VC. I will tell you why investors passed',
    categories: ['Fundraising', 'Finance'], industries: ['FinTech', 'AI', 'Logistics'], years: 15,
    rating: 5.0, reviews: 174, sessions: 480, price30: 220, price60: 380, packagePrice: 1650,
    packageDesc: 'Fundraising readiness: deck teardown, model review, narrative, investor list, mock pitch.',
    availability: ['Mon 17:00', 'Tue 18:00', 'Sat 10:00'], languages: ['Arabic', 'English'],
    answers: 620, responseTime: 'under 2h', gradient: G.night,
    topAnswer: { q: 'How much traction do I need to raise?', a: 'Enough that your growth story is boring. Investors do not fund potential in emerging markets — they fund a repeatable channel and a retained cohort.' },
  },
  {
    id: 'x_amal', personId: 'e_amal', headline: 'Incorporation, ESOPs and the paperwork nobody explains',
    categories: ['Legal'], industries: ['HealthTech', 'FinTech', 'SaaS'], years: 11,
    rating: 4.9, reviews: 84, sessions: 190, price30: 140, price60: 240, packagePrice: 980,
    packageDesc: 'Company setup pack: structure choice, founder agreement, ESOP outline, data compliance.',
    availability: ['Wed 09:00', 'Thu 14:00'], languages: ['Arabic', 'French'],
    answers: 176, responseTime: 'under 12h', gradient: G.health,
    topAnswer: { q: 'SARL or SUARL for a first startup?', a: 'If you have a co-founder, never SUARL. Write the founder agreement before the statutes — 80% of the disputes I see start there.' },
  },
  {
    id: 'x_youssef', personId: 'e_youssef', headline: 'CTO-for-hire: architecture, hiring, technical debt',
    categories: ['Technology'], industries: ['AI', 'SaaS', 'Logistics'], years: 14,
    rating: 4.8, reviews: 112, sessions: 296, price30: 150, price60: 260, packagePrice: 1100,
    packageDesc: 'Technical review: stack audit, cost model, hiring plan, 90-day engineering roadmap.',
    availability: ['Tue 11:00', 'Fri 10:00', 'Sat 15:00'], languages: ['Arabic', 'French', 'English'],
    answers: 340, responseTime: 'under 8h', gradient: G.ai,
    topAnswer: { q: 'Should I hire a CTO or an agency for the MVP?', a: 'Neither, at first. Hire one strong contractor for 8 weeks with a hard scope. A CTO you hire before product-market fit usually leaves before it.' },
  },
  {
    id: 'x_dina', personId: 'e_dina', headline: 'B2B pipelines that work in Arabic markets',
    categories: ['Sales'], industries: ['Logistics', 'SaaS', 'AgriTech'], years: 13,
    rating: 4.9, reviews: 141, sessions: 388, price30: 130, price60: 230, packagePrice: 950,
    packageDesc: '4 sessions: ICP, outbound script, pricing conversation, pipeline review.',
    availability: ['Mon 12:00', 'Wed 17:00', 'Thu 16:00'], languages: ['Arabic', 'English'],
    answers: 402, responseTime: 'under 5h', gradient: G.logi,
    topAnswer: { q: 'Cold email or WhatsApp?', a: 'WhatsApp after one physical visit. In most MENA B2B segments the visit is what makes the message get read at all.' },
  },
  {
    id: 'x_reda', personId: 'e_reda', headline: 'Unit economics before growth',
    categories: ['Finance'], industries: ['FinTech', 'E-commerce', 'ClimateTech'], years: 16,
    rating: 4.9, reviews: 103, sessions: 244, price30: 160, price60: 280, packagePrice: 1200,
    packageDesc: 'Financial model build: unit economics, 18-month plan, pricing, cash runway.',
    availability: ['Tue 08:00', 'Thu 18:00'], languages: ['Arabic', 'French', 'English'],
    answers: 214, responseTime: 'under 10h', gradient: G.fin,
    topAnswer: { q: 'What is a healthy CAC payback for a MENA SaaS?', a: 'Under 9 months, and you must compute it with the churn you actually have, not the one in your deck.' },
  },
  {
    id: 'x_maha', personId: 'e_maha', headline: 'Bilingual brands that do not feel translated',
    categories: ['Branding', 'Product'], industries: ['E-commerce', 'HealthTech', 'EdTech'], years: 12,
    rating: 4.7, reviews: 76, sessions: 168, price30: 140, price60: 250, packagePrice: 1050,
    packageDesc: 'Positioning sprint: audience, message architecture, naming, visual direction.',
    availability: ['Mon 15:00', 'Wed 11:00', 'Sat 12:00'], languages: ['Arabic', 'English'],
    answers: 158, responseTime: 'under 7h', gradient: G.sunset,
    topAnswer: { q: 'Arabic-first or English-first brand?', a: 'Whichever your customer complains in. Write your promise in that language first and translate second, never the reverse.' },
  },
];

/* ------------------------------------------------------------
   INCUBATORS
   ------------------------------------------------------------ */
const orbitCohort26: Cohort = {
  id: 'co_orbit26', name: 'Cohort 2026', incubatorId: 'inc_orbit', window: 'Mar → Jun 2026',
  startupIds: ['s_agrix', 's_sahti', 's_kaissa', 's_souklink', 's_shamsi'], progress: 64,
  mentorIds: ['e_karim', 'e_dina', 'e_amal', 'e_reda'],
  milestones: [
    { label: 'Problem validated with 20+ interviews', due: 'Week 2', doneCount: 5 },
    { label: 'MVP scope frozen', due: 'Week 4', doneCount: 4 },
    { label: 'First paying customer', due: 'Week 8', doneCount: 3 },
    { label: 'Unit economics reviewed', due: 'Week 10', doneCount: 2 },
    { label: 'Demo day pitch ready', due: 'Week 12', doneCount: 1 },
  ],
  demoDay: '24 Jun 2026',
};

const orbitCohort25: Cohort = {
  id: 'co_orbit25', name: 'Cohort 2025', incubatorId: 'inc_orbit', window: 'Sep → Dec 2025',
  startupIds: ['s_sanad'], progress: 100, mentorIds: ['e_reda', 'e_walid'],
  milestones: [
    { label: 'Problem validated', due: 'Week 2', doneCount: 1 },
    { label: 'MVP shipped', due: 'Week 5', doneCount: 1 },
    { label: 'Revenue', due: 'Week 9', doneCount: 1 },
    { label: 'Community round', due: 'Week 12', doneCount: 1 },
  ],
  demoDay: '18 Dec 2025 · completed',
};

export const INCUBATORS: Incubator[] = [
  {
    id: 'inc_orbit', slug: 'orbit-labs', name: 'Orbit Labs Tunis', logoText: 'OL', gradient: G.ink,
    city: 'Tunis', country: 'Tunisia',
    about: 'A 12-week accelerator for MENA-first startups. We run cohorts of up to 24 teams, assign a mentor per startup, and require a public build journey.',
    focus: ['AgriTech', 'FinTech', 'HealthTech', 'SaaS', 'ClimateTech'],
    cohorts: [orbitCohort26, orbitCohort25], mentorIds: ['e_karim', 'e_dina', 'e_amal', 'e_reda', 'e_walid'],
    stats: [
      { label: 'Startups supported', value: '86' },
      { label: 'Cohorts', value: '6' },
      { label: 'Funded after program', value: '41%' },
      { label: 'Avg founder score', value: '73' },
    ],
    perks: ['12-week structured roadmap', '1 dedicated mentor per startup', '18,000 TND stipend', 'Demo day with 40+ supporters', 'Office space in Lac 2'],
    applyDeadline: '30 Sep 2026', openCall: true,
  },
  {
    id: 'inc_maghreb', slug: 'maghreb-accelerator', name: 'Maghreb Accelerator', logoText: 'MA', gradient: G.sunset,
    city: 'Casablanca', country: 'Morocco',
    about: 'Cross-border acceleration between Morocco, Tunisia and Algeria, focused on AI and commerce infrastructure.',
    focus: ['AI', 'E-commerce', 'Logistics', 'FinTech'],
    cohorts: [{
      id: 'co_maghreb26', name: 'AI Cohort 2026', incubatorId: 'inc_maghreb', window: 'Feb → May 2026',
      startupIds: ['s_darija'], progress: 78, mentorIds: ['e_youssef', 'e_maha'],
      milestones: [
        { label: 'Model benchmark published', due: 'Week 3', doneCount: 1 },
        { label: '5 enterprise pilots', due: 'Week 7', doneCount: 1 },
        { label: 'Pricing validated', due: 'Week 10', doneCount: 0 },
      ],
      demoDay: '21 May 2026',
    }],
    mentorIds: ['e_youssef', 'e_maha', 'e_reda'],
    stats: [
      { label: 'Startups supported', value: '52' },
      { label: 'Countries', value: '3' },
      { label: 'Funded after program', value: '37%' },
      { label: 'Avg founder score', value: '76' },
    ],
    perks: ['Cross-border market entry support', 'Compute credits', '2 mentors per startup', 'Investor day in Casablanca'],
    applyDeadline: '15 Oct 2026', openCall: true,
  },
  {
    id: 'inc_delta', slug: 'delta-studio', name: 'Delta Ventures Studio', logoText: 'DV', gradient: G.night,
    city: 'Dubai', country: 'UAE',
    about: 'A venture studio partnering with second-time founders on regulated fintech and logistics.',
    focus: ['FinTech', 'Logistics'],
    cohorts: [{
      id: 'co_delta26', name: 'Studio Batch 4', incubatorId: 'inc_delta', window: 'Jan → Jul 2026',
      startupIds: ['s_qard', 's_wassel'], progress: 88, mentorIds: ['e_walid', 'e_reda'],
      milestones: [
        { label: 'Regulatory pathway cleared', due: 'Month 2', doneCount: 2 },
        { label: 'Revenue > 100k', due: 'Month 4', doneCount: 2 },
        { label: 'Institutional round ready', due: 'Month 6', doneCount: 1 },
      ],
      demoDay: '09 Jul 2026',
    }],
    mentorIds: ['e_walid', 'e_reda', 'e_dina'],
    stats: [
      { label: 'Startups co-built', value: '14' },
      { label: 'Avg cheque', value: '$150k' },
      { label: 'Funded after program', value: '64%' },
      { label: 'Avg founder score', value: '84' },
    ],
    perks: ['Co-founding capital', 'Regulatory & licensing support', 'Shared engineering pod'],
    applyDeadline: 'Rolling', openCall: false,
  },
];

/* ------------------------------------------------------------
   CHALLENGES
   ------------------------------------------------------------ */
export const CHALLENGES: Challenge[] = [
  {
    id: 'ch_mvp', slug: 'mvp-30-days', title: 'Build Your MVP in 30 Days', subtitle: 'Ship something real, publicly, in a month.',
    emoji: '🚀', gradient: G.night, window: '1 → 30 Sep 2026', daysLeft: 12, participants: 104, joined: true,
    reward: 'Featured on Discover for 2 weeks + a session with a product expert',
    milestones: [
      { label: 'Define the single core workflow', day: 3, done: true },
      { label: 'Publish your MVP scope publicly', day: 6, done: true },
      { label: 'First working version in someone else’s hands', day: 18, done: true },
      { label: '10 users tested it', day: 26, done: false },
      { label: 'Publish your launch update', day: 30, done: false },
    ],
    leaderboard: [
      { personId: 'p_yassine', startupId: 's_darija', points: 480, streak: 19 },
      { personId: ME_ID, startupId: 's_agrix', points: 455, streak: 11 },
      { personId: 'p_ines', startupId: 's_kaissa', points: 410, streak: 9 },
      { personId: 'p_mariem', startupId: 's_sahti', points: 372, streak: 7 },
      { personId: 'p_rania', startupId: 's_souklink', points: 318, streak: 4 },
    ],
    rules: ['Post at least twice a week', 'Every milestone must have a public update', 'Failures count for full points'],
  },
  {
    id: 'ch_validate', slug: 'validate-14-days', title: 'Validate Your Idea in 14 Days', subtitle: '20 conversations before a single line of code.',
    emoji: '🎯', gradient: G.agri, window: '10 → 24 Sep 2026', daysLeft: 6, participants: 218, joined: false,
    reward: 'AI validation deep-dive + a 30-minute session with a validation mentor',
    milestones: [
      { label: 'Write your one-sentence problem', day: 1, done: false },
      { label: '10 interviews completed', day: 7, done: false },
      { label: '20 interviews completed', day: 12, done: false },
      { label: 'Publish what you learned (including the no’s)', day: 14, done: false },
    ],
    leaderboard: [
      { personId: 'p_ines', startupId: 's_kaissa', points: 340, streak: 9 },
      { personId: 'p_hamza', startupId: 's_shamsi', points: 296, streak: 6 },
      { personId: 's_bilal', points: 180, streak: 3 },
    ],
    rules: ['Interviews must be with people outside your network', 'Publish the objections you heard'],
  },
  {
    id: 'ch_customers', slug: 'first-10-customers', title: 'First 10 Customers Challenge', subtitle: 'From free pilots to money in the account.',
    emoji: '🤝', gradient: G.fin, window: '15 Sep → 15 Oct 2026', daysLeft: 24, participants: 86, joined: false,
    reward: 'Sales playbook review by a B2B expert',
    milestones: [
      { label: 'Define your ideal customer', day: 2, done: false },
      { label: '30 outbound conversations', day: 10, done: false },
      { label: 'First paid customer', day: 18, done: false },
      { label: '10 paying customers', day: 30, done: false },
    ],
    leaderboard: [
      { personId: 'p_sami', startupId: 's_nafhem', points: 420, streak: 14 },
      { personId: 'p_omar', startupId: 's_wassel', points: 398, streak: 16 },
      { personId: 'p_nour', startupId: 's_sanad', points: 360, streak: 26 },
    ],
    rules: ['Only paid customers count', 'Share your pricing conversations'],
  },
  {
    id: 'ch_pitch', slug: 'pitch-week', title: 'Pitch Week', subtitle: 'One 90-second video pitch. Community votes.',
    emoji: '🎤', gradient: G.sunset, window: '5 → 12 Oct 2026', daysLeft: 38, participants: 142, joined: false,
    reward: 'Pitch review with an ex-VC + intro to 3 supporters',
    milestones: [
      { label: 'Publish your 90-second pitch video', day: 3, done: false },
      { label: 'Get 50 community votes', day: 6, done: false },
      { label: 'Live pitch final', day: 7, done: false },
    ],
    leaderboard: [
      { personId: 'p_layla', startupId: 's_qard', points: 512, streak: 31 },
      { personId: 'p_yassine', startupId: 's_darija', points: 468, streak: 19 },
    ],
    rules: ['90 seconds maximum', 'Must include one real number'],
  },
];

/* ------------------------------------------------------------
   NOTIFICATIONS
   ------------------------------------------------------------ */
export const NOTIFICATIONS: Notification[] = [
  { id: 'n1', kind: 'support', actorId: 's_fatma', text: 'supported your Day 87 update and backed AgriX with 150 TND', at: '12m', unread: true, link: '/fund/c_agrix', meta: 'Early believer reward' },
  { id: 'n2', kind: 'expert', actorId: 'e_dina', text: 'replied to your update: “Monthly invoicing will double your average contract length.”', at: '1h', unread: true, link: '/founder/ahmedbenali' },
  { id: 'n3', kind: 'funding', actorId: 'org_orbit', text: 'Your campaign reached 74% of its goal — 3 supporters in the last 24h', at: '3h', unread: true, link: '/fund/c_agrix', meta: '18,500 / 25,000 TND' },
  { id: 'n4', kind: 'follow', actorId: 's_bilal', text: 'started following you and offered design help', at: '5h', unread: true, link: '/founder/bilaln' },
  { id: 'n5', kind: 'milestone', actorId: ME_ID, text: 'Milestone verified: First revenue (Day 87). Founder Score +3', at: '8h', unread: false, link: '/founder/ahmedbenali', meta: 'Score 79 → 82' },
  { id: 'n6', kind: 'challenge', actorId: 'org_orbit', text: 'You moved to #2 on the Build Your MVP in 30 Days leaderboard', at: '1d', unread: false, link: '/challenges/mvp-30-days' },
  { id: 'n7', kind: 'comment', actorId: 'p_nour', text: 'commented on your failure post: “The first contract is the hardest one.”', at: '1d', unread: false, link: '/founder/ahmedbenali' },
  { id: 'n8', kind: 'incubator', actorId: 'org_orbit', text: 'Orbit Labs added a new cohort milestone: Unit economics reviewed (Week 10)', at: '2d', unread: false, link: '/incubators/orbit-labs' },
  { id: 'n9', kind: 'support', actorId: 's_leila', text: 'supported your update and asked about Sahel coverage', at: '2d', unread: false },
  { id: 'n10', kind: 'expert', actorId: 'e_karim', text: 'endorsed AgriX: “Rare discipline in MVP scoping.”', at: '3d', unread: false, link: '/startup/agrix', meta: 'Endorsement · Founder Score +2' },
  { id: 'n11', kind: 'funding', actorId: 'p_sami', text: 'launched a campaign: Nafhem — 60,000 TND for offline mode', at: '4d', unread: false, link: '/fund/c_nafhem' },
];

/* ------------------------------------------------------------
   MESSAGES
   ------------------------------------------------------------ */
export const THREADS: Thread[] = [
  {
    id: 't1', withId: 'e_karim', context: 'Mentor · Orbit Labs Cohort 2026', unread: 2, online: true, pinned: true,
    messages: [
      { id: 'm1', fromId: 'e_karim', text: 'Saw your Day 87 update. The monthly invoicing request is a bigger signal than it looks — it means they are planning around you.', at: '09:12' },
      { id: 'm2', fromId: ME_ID, text: 'Agreed. I am tempted to build it this sprint, but the driver app is already late.', at: '09:20' },
      { id: 'm3', fromId: 'e_karim', text: 'Invoicing can be a spreadsheet and a PDF for now. Do not build software for 8 restaurants.', at: '09:22' },
      { id: 'm4', fromId: 'e_karim', text: 'Also: your campaign page needs the retention number in the hero. 91% is your strongest proof.', at: '09:23' },
    ],
  },
  {
    id: 't2', withId: 'p_ines', context: 'Founder · Kaissa', unread: 0, online: false, lastSeen: '2h ago',
    messages: [
      { id: 'm5', fromId: 'p_ines', text: 'Your comment on my pricing poll saved me a week. Charging per shop now.', at: 'Yesterday' },
      { id: 'm6', fromId: ME_ID, text: 'Happy it helped. Do you have a retailer in Monastir who sells fresh produce? Testing something.', at: 'Yesterday' },
      { id: 'm7', fromId: 'p_ines', text: 'Yes — Leila, she owns 3 shops and already follows you. I will introduce you.', at: 'Yesterday' },
    ],
  },
  {
    id: 't3', withId: 'org_orbit', context: 'Incubator · Cohort 2026', unread: 1, online: false, lastSeen: 'yesterday',
    messages: [
      { id: 'm8', fromId: 'org_orbit', text: 'Reminder: unit economics review is due Week 10. Your mentor Karim will join the session.', at: 'Mon' },
      { id: 'm9', fromId: 'org_orbit', text: 'Demo day is confirmed for 24 June, 40+ supporters attending. You are pitching 4th.', at: 'Mon' },
    ],
  },
  {
    id: 't4', withId: 's_fatma', context: 'Supporter · backed AgriX', unread: 0, online: true,
    messages: [
      { id: 'm10', fromId: 's_fatma', text: 'Just backed you at 150 TND. I read your failure post from Day 34 first — that is why.', at: 'Tue' },
      { id: 'm11', fromId: ME_ID, text: 'That means a lot, thank you. You will get the weekly numbers, including the bad weeks.', at: 'Tue' },
    ],
  },
];

/* ------------------------------------------------------------
   ROADMAPS
   ------------------------------------------------------------ */
export const ROADMAPS: Roadmap[] = [
  {
    id: 'r_agrix', startupId: 's_agrix', source: 'incubator', sourceLabel: 'Orbit Labs Cohort 2026 · customised by your mentor',
    phases: [
      {
        id: 'ph1', name: 'Phase 1 — Validate', goal: 'Prove the problem is worth money', weeks: 'Weeks 1–3',
        tasks: [
          { id: 'tk1', label: 'Interview 20 farms', done: true, hint: '23 completed' },
          { id: 'tk2', label: 'Interview 15 restaurants', done: true, hint: '14 completed' },
          { id: 'tk3', label: 'Map the 4 intermediaries and their margins', done: true },
          { id: 'tk4', label: 'Competitor research (local + regional)', done: true },
          { id: 'tk5', label: 'Write the one-sentence problem statement', done: true },
        ],
      },
      {
        id: 'ph2', name: 'Phase 2 — MVP', goal: 'One workflow, working, in real hands', weeks: 'Weeks 4–7',
        tasks: [
          { id: 'tk6', label: 'Freeze MVP scope to 3 features', done: true, hint: 'Cut from 11 with mentor Karim' },
          { id: 'tk7', label: 'Build ordering + demand aggregation', done: true },
          { id: 'tk8', label: 'Build route grouping v1', done: true },
          { id: 'tk9', label: 'Test with 3 farms and 5 restaurants', done: true },
          { id: 'tk10', label: 'Publish MVP launch update', done: true },
        ],
      },
      {
        id: 'ph3', name: 'Phase 3 — Launch', goal: 'Money in the account, repeatably', weeks: 'Weeks 8–11',
        tasks: [
          { id: 'tk11', label: 'Sign first paying customer', done: true, hint: 'Day 68 · Dar Zarrouk' },
          { id: 'tk12', label: 'Reach 50 paying customers', done: true, hint: '87 reached' },
          { id: 'tk13', label: 'Interview 10 customers about renewal', done: false, hint: '8 of 10 done', owner: 'You' },
          { id: 'tk14', label: 'Ship monthly invoicing (manual first)', done: false, owner: 'You' },
          { id: 'tk15', label: 'Publish retention numbers publicly', done: false },
        ],
      },
      {
        id: 'ph4', name: 'Phase 4 — Growth', goal: 'A channel that repeats without you', weeks: 'Weeks 12–16',
        tasks: [
          { id: 'tk16', label: 'Define the route-salesperson channel', done: false },
          { id: 'tk17', label: 'Hire 1 route coordinator', done: false },
          { id: 'tk18', label: 'Launch Sousse pilot', done: false },
          { id: 'tk19', label: 'Reach 150 paying customers', done: false },
        ],
      },
      {
        id: 'ph5', name: 'Phase 5 — Fundraising', goal: 'Raise from a community that already follows you', weeks: 'Weeks 17–20',
        tasks: [
          { id: 'tk20', label: 'Build the campaign page', done: true },
          { id: 'tk21', label: 'Financial model reviewed by an expert', done: true, hint: 'Reda Alaoui · Day 84' },
          { id: 'tk22', label: 'Reach 25,000 TND goal', done: false, hint: '18,500 raised · 74%' },
          { id: 'tk23', label: 'Prepare the post-campaign report', done: false },
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------
   GIFTS  (used in Live donations and the tip jar)
   ------------------------------------------------------------ */
export const GIFTS: Gift[] = [
  { id: 'g_seed', emoji: '🌱', label: 'Seed', amount: 2 },
  { id: 'g_coffee', emoji: '☕', label: 'Coffee', amount: 5 },
  { id: 'g_fire', emoji: '🔥', label: 'On fire', amount: 10 },
  { id: 'g_rocket', emoji: '🚀', label: 'Rocket', amount: 25 },
  { id: 'g_star', emoji: '⭐', label: 'Star', amount: 50 },
  { id: 'g_crown', emoji: '👑', label: 'Champion', amount: 100 },
];

/* ------------------------------------------------------------
   PRODUCTS  (marketplace)
   ------------------------------------------------------------ */
export const PRODUCTS: Product[] = [
  {
    id: 'pr_agrix_box', startupId: 's_agrix', sellerId: ME_ID, type: 'physical',
    title: 'AgriX Weekly Farm Box', tagline: 'Seasonal produce, direct from the farms we serve.',
    description: 'A weekly crate of seasonal vegetables and fruit sourced directly from the farms on the AgriX network — no intermediaries. Support the network while you eat well.',
    price: 45, currency: CURRENCY, emoji: '🧺', gradient: G.agri, category: 'Food & produce',
    stock: 120, sold: 340, rating: 4.8, includes: ['6–8 kg seasonal produce', 'Delivered every Saturday', 'Farm origin card in every box'],
    tags: ['produce', 'weekly', 'Tunis'], featured: true,
    reviews: [
      { id: 'prv1', authorId: 's_leila', rating: 5, text: 'Fresher than the market and I know exactly which farm it came from.', at: '3d' },
      { id: 'prv2', authorId: 's_fatma', rating: 4, text: 'Great quality. Would love a smaller box option.', at: '1w' },
    ],
  },
  {
    id: 'pr_agrix_playbook', startupId: 's_agrix', sellerId: ME_ID, type: 'digital',
    title: 'The Build-in-Public Logistics Playbook', tagline: 'How we cut 4 intermediaries — the full template.',
    description: 'The exact spreadsheets, interview scripts and route-grouping logic we used to go from idea to 87 paying customers. 38-page PDF + editable templates.',
    price: 30, currency: CURRENCY, compareAt: 60, emoji: '📘', gradient: G.ink, category: 'Templates & guides',
    sold: 212, rating: 4.9, includes: ['38-page PDF', 'Interview script templates', 'Route-grouping spreadsheet'],
    deliveryNote: 'Instant download link after checkout (simulated).',
    tags: ['playbook', 'logistics', 'template'], featured: true,
    reviews: [{ id: 'prv3', authorId: 'p_ines', rating: 5, text: 'The interview scripts alone were worth it.', at: '5d' }],
  },
  {
    id: 'pr_agrix_consult', startupId: 's_agrix', sellerId: ME_ID, type: 'service',
    title: '30-min Ops Teardown with Ahmed', tagline: 'I will look at your logistics and find the waste.',
    description: 'A focused call where I review your fulfilment/ops setup and point out the 2–3 changes that will save you the most. Founder-to-founder, no fluff.',
    price: 80, currency: CURRENCY, emoji: '🎧', gradient: G.agri, category: 'Consulting',
    sold: 18, rating: 5.0, includes: ['30-minute video call', 'Written summary after', 'One follow-up question'],
    slots: ['Tue 10:00', 'Wed 15:00', 'Fri 09:00'], tags: ['consulting', 'ops'],
    reviews: [],
  },
  {
    id: 'pr_darija_credits', startupId: 's_darija', sellerId: 'p_yassine', type: 'digital',
    title: 'Darija AI — 10k API credits', tagline: 'Voice AI for Maghrebi dialects.',
    description: '10,000 API credits for the Darija AI speech stack. Build voice features that actually understand Derja, Darija and Algerian dialect.',
    price: 120, currency: CURRENCY, emoji: '🗣️', gradient: G.ai, category: 'API & credits',
    sold: 96, rating: 4.7, includes: ['10,000 API credits', 'Dialect model access', 'Sandbox key'],
    deliveryNote: 'API key issued instantly (simulated).', tags: ['api', 'ai', 'voice'],
    reviews: [],
  },
  {
    id: 'pr_souklink_rug', startupId: 's_souklink', sellerId: 'p_rania', type: 'physical',
    title: 'Handwoven Kilim — Sfax Artisans', tagline: 'Direct from the workshop, export-ready.',
    description: 'A handwoven wool kilim from a Sfax artisan cooperative on the SoukLink network. Every purchase pays the maker directly.',
    price: 240, currency: CURRENCY, emoji: '🧶', gradient: G.ecom, category: 'Crafts',
    stock: 12, sold: 44, rating: 4.9, includes: ['120×180 cm handwoven kilim', 'Artisan name card', 'Export paperwork handled'],
    tags: ['craft', 'artisan', 'export'], featured: true,
    reviews: [{ id: 'prv4', authorId: 's_bilal', rating: 5, text: 'Beautiful piece, and I love that the maker is named.', at: '2w' }],
  },
  {
    id: 'pr_agrix_kit', startupId: 's_agrix', sellerId: ME_ID, type: 'preorder',
    title: 'AgriX Smart Crate (pre-order)', tagline: 'Reserve a connected crate — ships once the driver network launches.',
    description: 'A reusable, sensor-fitted delivery crate that tracks temperature and location from farm to restaurant. Pre-order now to fund the first production run; you receive yours when the driver network goes live.',
    price: 120, currency: CURRENCY, emoji: '📦', gradient: G.agri, category: 'Hardware',
    sold: 0, rating: 0, reviews: [],
    includes: ['1 connected Smart Crate', 'Temperature + GPS tracking', 'Priority onboarding to the network'],
    estimatedDelivery: 'Ships Q2 2026', unitsGoal: 200, unitsReserved: 68, campaignId: 'c_agrix',
    tags: ['preorder', 'hardware', 'agritech'], featured: true,
  },
  {
    id: 'pr_shamsi_unit', startupId: 's_shamsi', sellerId: 'p_hamza', type: 'preorder',
    title: 'Shamsi 1kW Solar Starter (pre-order)', tagline: 'Reserve a small solar unit at the launch price.',
    description: 'A compact 1kW solar kit for a workshop or small farm, offered at the early-supporter price. Pre-orders fund the first batch of installations; delivery follows the community round.',
    price: 900, currency: CURRENCY, compareAt: 1200, emoji: '☀️', gradient: G.climate, category: 'Hardware',
    sold: 0, rating: 0, reviews: [],
    includes: ['1kW panel + inverter', 'Installation in southern Tunisia', 'Remote monitoring for 12 months'],
    estimatedDelivery: 'Ships late 2026', unitsGoal: 40, unitsReserved: 7, campaignId: 'c_shamsi',
    tags: ['preorder', 'solar', 'climatetech'],
  },
  {
    id: 'pr_nafhem_pack', startupId: 's_nafhem', sellerId: 'p_sami', type: 'digital',
    title: 'Bac Maths Revision Pack', tagline: 'Teacher-reviewed, curriculum-aligned.',
    description: 'A full term of maths revision aligned to the Tunisian bac curriculum, reviewed by practising teachers. Arabic + French.',
    price: 25, currency: CURRENCY, emoji: '📐', gradient: G.edu, category: 'Education',
    sold: 418, rating: 4.8, includes: ['12 chapters', 'Step-by-step solutions', 'Practice exams'],
    deliveryNote: 'Access unlocked in your Nafhem account (simulated).', tags: ['education', 'bac', 'maths'],
    reviews: [],
  },
];

/* ------------------------------------------------------------
   LIVE STREAMS
   ------------------------------------------------------------ */
export const LIVES: LiveStream[] = [
  {
    id: 'lv_agrix', hostId: ME_ID, startupId: 's_agrix', title: 'Live: packing the Saturday farm boxes 🧺',
    category: 'Behind the scenes', emoji: '🧺', gradient: G.agri, status: 'live', viewers: 214, raised: 340, currency: CURRENCY,
    hearts: 1820, startedAt: 'now', tags: ['agritech', 'behind the scenes'],
    seedChat: [
      { id: 'lc1', authorId: 's_leila', text: 'This is so satisfying to watch 😍' },
      { id: 'lc2', authorId: 'p_ines', text: 'How many boxes per Saturday now?' },
      { id: 'lc3', authorId: 's_fatma', text: '', giftId: 'g_rocket', amount: 25 },
      { id: 'lc4', authorId: 'e_dina', text: 'Great cadence Ahmed 👏' },
    ],
  },
  {
    id: 'lv_yassine', hostId: 'p_yassine', startupId: 's_darija', title: 'Live coding: a Derja voice agent from scratch',
    category: 'Building', emoji: '🗣️', gradient: G.ai, status: 'live', viewers: 486, raised: 720, currency: CURRENCY,
    hearts: 3140, startedAt: 'now', tags: ['ai', 'live coding'],
    seedChat: [
      { id: 'lc5', authorId: 's_bilal', text: 'The accuracy on that last phrase was wild' },
      { id: 'lc6', authorId: ME_ID, text: 'Following this closely 🔥', giftId: 'g_fire', amount: 10 },
    ],
  },
  {
    id: 'lv_layla', hostId: 'p_layla', startupId: 's_qard', title: 'AMA: raising a community round in MENA',
    category: 'Fundraising', emoji: '💰', gradient: G.night, status: 'upcoming', viewers: 0, raised: 0, currency: CURRENCY,
    hearts: 0, scheduledFor: 'Tomorrow · 18:00', tags: ['fundraising', 'ama'], seedChat: [],
  },
];

/* ------------------------------------------------------------
   COMMUNITY CHAT ROOMS
   ------------------------------------------------------------ */
export const ROOMS: ChatRoom[] = [
  {
    id: 'room_agritech', name: 'AgriTech Founders', kind: 'topic', emoji: '🌾', gradient: G.agri,
    topic: 'Everything farm-to-market, logistics and produce in MENA.',
    memberIds: [ME_ID, 'p_hamza', 'p_rania', 's_leila'], memberCount: 128, joined: true,
    messages: [
      { id: 'gm1', fromId: 'p_hamza', text: 'Anyone dealt with seasonal cash flow in supplier contracts?', at: '2h' },
      { id: 'gm2', fromId: ME_ID, text: 'Yes — we moved 3 restaurants to monthly invoicing. Happy to share the template.', at: '1h' },
      { id: 'gm3', fromId: 's_leila', text: 'Would love that template Ahmed 🙏', at: '54m' },
    ],
  },
  {
    id: 'room_orbit26', name: 'Orbit Labs · Cohort 2026', kind: 'cohort', emoji: '🛰️', gradient: G.ink,
    topic: 'Private room for the 2026 cohort. Mentors drop in weekly.', refId: 'co_orbit26',
    memberIds: [ME_ID, 'p_mariem', 'p_ines', 'p_rania', 'p_hamza', 'e_karim'], memberCount: 9, joined: true,
    messages: [
      { id: 'gm4', fromId: 'e_karim', text: 'Reminder: unit economics review is Week 10. Bring real numbers, not projections.', at: '3h' },
      { id: 'gm5', fromId: 'p_mariem', text: 'Will the session be recorded? Clashes with a clinic shift.', at: '2h' },
      { id: 'gm6', fromId: 'org_orbit', text: 'Yes, recording shared in this room after.', at: '2h', system: true },
    ],
  },
  {
    id: 'room_mvp', name: 'Build MVP in 30 Days', kind: 'challenge', emoji: '🚀', gradient: G.night,
    topic: 'Challenge participants keeping each other accountable.', refId: 'ch_mvp',
    memberIds: [ME_ID, 'p_yassine', 'p_ines', 'p_mariem'], memberCount: 104, joined: true,
    messages: [
      { id: 'gm7', fromId: 'p_yassine', text: 'Day 19 streak. Shipped the voice agent demo today.', at: '5h' },
      { id: 'gm8', fromId: 'p_ines', text: 'Nice! I hit 10 tested users this morning 🎉', at: '4h' },
    ],
  },
  {
    id: 'room_fundraising', name: 'Fundraising & Community Rounds', kind: 'topic', emoji: '💰', gradient: G.fin,
    topic: 'Decks, term sheets, crowdfunding tactics.',
    memberIds: ['p_nour', 'p_layla', 'e_walid'], memberCount: 214, joined: false,
    messages: [
      { id: 'gm9', fromId: 'e_walid', text: 'The #1 reason MENA rounds stall: opening cold. Line up 30% before you launch.', at: '1d' },
      { id: 'gm10', fromId: 'p_layla', text: 'Can confirm. We had 40% committed before day one.', at: '1d' },
    ],
  },
];

/* ------------------------------------------------------------
   JOBS  (talent board)
   ------------------------------------------------------------ */
export const JOBS: Job[] = [
  {
    id: 'job_agrix_flutter', startupId: 's_agrix', posterId: ME_ID, title: 'Flutter Developer — Driver App',
    kind: 'contract', location: 'Tunis', remote: true, skills: ['Flutter', 'Offline sync', 'Maps'],
    description: 'Own the AgriX driver app: offline order sync, route view, proof of delivery. 6–8 weeks, part-time, paid. Drivers lose signal constantly on rural routes, so offline-first is the whole job.',
    pay: '3,000–4,500 TND for the engagement', postedAt: '2d', applicants: 7, open: true,
  },
  {
    id: 'job_darija_ml', startupId: 's_darija', posterId: 'p_yassine', title: 'ML Engineer — Speech',
    kind: 'full-time', location: 'Casablanca', remote: true, skills: ['PyTorch', 'ASR', 'Arabic dialects'],
    description: 'Join the team pushing dialect speech recognition past 95%. You will own data pipelines and model evaluation for Maghrebi dialects.',
    equity: '0.5–1.2%', pay: 'Competitive + equity', postedAt: '4d', applicants: 14, open: true,
  },
  {
    id: 'job_sahti_cofounder', startupId: 's_sahti', posterId: 'p_mariem', title: 'Technical Co-founder',
    kind: 'co-founder', location: 'Sousse', remote: false, skills: ['Full-stack', 'HealthTech', 'Product'],
    description: 'Doctor-founder looking for a technical co-founder to own product and engineering for specialist teleconsultation. Real traction: 340 consultations, 11 partner points.',
    equity: '15–30%', postedAt: '1w', applicants: 21, open: true,
  },
  {
    id: 'job_kaissa_design', startupId: 's_kaissa', posterId: 'p_ines', title: 'Product Designer (part-time)',
    kind: 'part-time', location: 'Monastir', remote: true, skills: ['UI', 'Mobile', 'Design systems'],
    description: 'Shape the Kaissa POS mobile experience for shopkeepers who have never used an app. Offline-first, one-handed, fast.',
    pay: '800–1,200 TND/month', postedAt: '5d', applicants: 9, open: true,
  },
];

/* ------------------------------------------------------------
   EVENTS
   ------------------------------------------------------------ */
export const EVENTS: AppEvent[] = [
  {
    id: 'ev_orbit_demo', title: 'Orbit Labs Cohort 2026 — Demo Day', kind: 'demo-day', hostId: 'org_orbit',
    incubatorId: 'inc_orbit', emoji: '🛰️', gradient: G.ink, when: '24 Jun 2026 · 17:00', dateSort: 20260624,
    location: 'Lac 2, Tunis + livestream', online: true,
    description: '5 startups pitch to 40+ supporters and investors. AgriX pitches 4th. Public livestream on Nawa Live.',
    attendees: 214, capacity: 300, going: true, tags: ['demo day', 'pitch'],
  },
  {
    id: 'ev_walid_ama', title: 'Ex-VC AMA: Why investors passed on your deck', kind: 'ama', hostId: 'e_walid',
    emoji: '🎤', gradient: G.night, when: 'Tomorrow · 18:00', dateSort: 20260921, location: 'Nawa Live', online: true,
    description: 'Walid Zribi reviews the 3 slides investors actually read, live, and takes questions.',
    attendees: 486, going: false, tags: ['fundraising', 'ama'],
  },
  {
    id: 'ev_pitch_night', title: 'MENA Pitch Night — September', kind: 'pitch', hostId: 'org_maghreb',
    incubatorId: 'inc_maghreb', emoji: '🔥', gradient: G.sunset, when: '28 Sep 2026 · 19:00', dateSort: 20260928,
    location: 'Casablanca + online', online: true,
    description: '8 founders, 90 seconds each, community votes live. Winner gets an intro to 3 supporters.',
    attendees: 142, capacity: 200, going: false, tags: ['pitch', 'competition'],
  },
  {
    id: 'ev_agritech_meetup', title: 'AgriTech Founders Meetup', kind: 'meetup', hostId: ME_ID, startupId: 's_agrix',
    emoji: '🌾', gradient: G.agri, when: '2 Oct 2026 · 10:00', dateSort: 20261002, location: 'Tunis', online: false,
    description: 'Informal meetup for founders working on farm-to-market, logistics and produce. Coffee on AgriX.',
    attendees: 32, capacity: 40, going: true, tags: ['agritech', 'meetup'],
  },
];

/* ------------------------------------------------------------
   ORDERS / DONATIONS / TRANSACTIONS  (seed history for the wallet)
   ------------------------------------------------------------ */
export const DONATIONS: Donation[] = [
  { id: 'dn1', fromId: 's_fatma', toStartupId: 's_agrix', amount: 50, currency: CURRENCY, message: 'Keep shipping — I read every update.', source: 'startup', at: '2d' },
  { id: 'dn2', fromId: 's_leila', toStartupId: 's_agrix', amount: 20, currency: CURRENCY, giftId: 'g_rocket', source: 'live', at: '1d' },
  { id: 'dn3', fromId: 's_bilal', toPersonId: ME_ID, amount: 15, currency: CURRENCY, message: 'For the logistics playbook, thank you!', source: 'profile', at: '5d' },
];

export const TRANSACTIONS: Transaction[] = [
  { id: 'tx1', kind: 'campaign', amount: 18500, currency: CURRENCY, label: 'Community round — AgriX', at: 'ongoing', ts: 5 },
  { id: 'tx2', kind: 'sale', amount: 45, currency: CURRENCY, label: 'Farm Box × 1', counterpartyId: 's_leila', at: '2d', ts: 40 },
  { id: 'tx3', kind: 'sale', amount: 30, currency: CURRENCY, label: 'Logistics Playbook', counterpartyId: 's_bilal', at: '3d', ts: 60 },
  { id: 'tx4', kind: 'donation', amount: 50, currency: CURRENCY, label: 'Donation from Fatma Jlassi', counterpartyId: 's_fatma', at: '2d', ts: 42 },
  { id: 'tx5', kind: 'gift', amount: 25, currency: CURRENCY, label: 'Rocket gift on live', counterpartyId: 's_leila', at: '1d', ts: 30 },
];
