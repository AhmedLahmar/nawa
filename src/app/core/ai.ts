/* ============================================================
   NAWA — simulated startup copilot
   Deterministic, offline "AI": intent matching + templating over
   the founder's real (mock) startup data. No network calls.
   ============================================================ */

import { IdeaAnalysis, Industry, Kpi, Roadmap, RoadmapPhase, Startup } from './models';

/* ---------- tiny deterministic hash so the same idea always scores the same ---------- */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/* ---------- industry detection ---------- */
const INDUSTRY_HINTS: { industry: Industry; emoji: string; words: string[] }[] = [
  { industry: 'AgriTech', emoji: '🌾', words: ['farm', 'farmer', 'agri', 'crop', 'produce', 'harvest', 'olive', 'date', 'irrigation', 'livestock', 'fish'] },
  { industry: 'FinTech', emoji: '💳', words: ['pay', 'payment', 'invoice', 'lend', 'loan', 'credit', 'bank', 'wallet', 'finance', 'financing', 'insurance', 'remittance', 'saving'] },
  { industry: 'HealthTech', emoji: '🩺', words: ['health', 'patient', 'doctor', 'clinic', 'medical', 'pharmacy', 'nurse', 'therapy', 'diagnos'] },
  { industry: 'EdTech', emoji: '📚', words: ['student', 'school', 'learn', 'teach', 'course', 'tutor', 'exam', 'bac', 'university', 'training', 'education'] },
  { industry: 'Logistics', emoji: '📦', words: ['deliver', 'logistic', 'shipping', 'fleet', 'driver', 'route', 'warehouse', 'transport', 'last-mile'] },
  { industry: 'E-commerce', emoji: '🛍️', words: ['marketplace', 'shop online', 'store', 'sell online', 'e-commerce', 'ecommerce', 'artisan', 'boutique', 'export'] },
  { industry: 'ClimateTech', emoji: '☀️', words: ['solar', 'energy', 'climate', 'waste', 'recycl', 'water', 'carbon', 'green', 'diesel'] },
  { industry: 'AI', emoji: '🤖', words: ['ai', 'artificial intelligence', 'machine learning', 'model', 'predict', 'forecast', 'chatbot', 'voice', 'llm', 'nlp', 'vision'] },
  { industry: 'SaaS', emoji: '🧩', words: ['saas', 'platform', 'dashboard', 'software', 'crm', 'erp', 'pos', 'management tool', 'automate'] },
];

/* ---------- customer segments we can name back to the founder ---------- */
const SEGMENTS: { words: string[]; label: string; single: string }[] = [
  { words: ['restaurant', 'restaurants', 'café', 'cafe', 'hotel'], label: 'restaurant owners', single: 'restaurant owner' },
  { words: ['farmer', 'farmers', 'farm', 'farms'], label: 'farmers', single: 'farmer' },
  { words: ['retailer', 'retailers', 'shop', 'shops', 'grocer', 'grocery', 'épicerie'], label: 'shop owners', single: 'shop owner' },
  { words: ['student', 'students', 'pupil'], label: 'students and parents', single: 'student' },
  { words: ['patient', 'patients'], label: 'patients', single: 'patient' },
  { words: ['doctor', 'doctors', 'pharmacist', 'pharmacy'], label: 'clinicians', single: 'doctor' },
  { words: ['driver', 'drivers', 'courier'], label: 'drivers', single: 'driver' },
  { words: ['artisan', 'artisans', 'craft'], label: 'artisans', single: 'artisan' },
  { words: ['merchant', 'merchants', 'vendor'], label: 'merchants', single: 'merchant' },
  { words: ['sme', 'smes', 'small business', 'business owner'], label: 'small business owners', single: 'business owner' },
  { words: ['freelancer', 'freelance'], label: 'freelancers', single: 'freelancer' },
  { words: ['teacher', 'teachers'], label: 'teachers', single: 'teacher' },
  { words: ['tourist', 'tourists', 'traveller', 'traveler'], label: 'travellers', single: 'traveller' },
];

const PLACES = [
  { words: ['tunis'], city: 'Tunis', country: 'Tunisia', currency: 'TND' },
  { words: ['sfax'], city: 'Sfax', country: 'Tunisia', currency: 'TND' },
  { words: ['sousse'], city: 'Sousse', country: 'Tunisia', currency: 'TND' },
  { words: ['monastir'], city: 'Monastir', country: 'Tunisia', currency: 'TND' },
  { words: ['gabes', 'gabès'], city: 'Gabès', country: 'Tunisia', currency: 'TND' },
  { words: ['tunisia', 'tunisian'], city: 'Tunis', country: 'Tunisia', currency: 'TND' },
  { words: ['casablanca', 'morocco', 'moroccan', 'rabat'], city: 'Casablanca', country: 'Morocco', currency: 'MAD' },
  { words: ['algiers', 'algeria', 'algerian'], city: 'Algiers', country: 'Algeria', currency: 'DZD' },
  { words: ['cairo', 'egypt', 'egyptian'], city: 'Cairo', country: 'Egypt', currency: 'EGP' },
  { words: ['dubai', 'uae', 'emirates', 'abu dhabi'], city: 'Dubai', country: 'UAE', currency: 'AED' },
  { words: ['riyadh', 'saudi', 'jeddah'], city: 'Riyadh', country: 'Saudi Arabia', currency: 'SAR' },
];

const NAME_POOL: Record<Industry, string[]> = {
  AgriTech: ['Ghalla', 'Sabla', 'Zitouna Flow', 'Hasad'],
  FinTech: ['Sanadi', 'Dinari', 'Wasla Pay', 'Rizq'],
  HealthTech: ['Sahtek', 'Chifa', 'Nabd', 'Rafik Santé'],
  EdTech: ['Nafhem+', 'Darsi', 'Fahim', 'Madrasti'],
  Logistics: ['Wassalni', 'Tariq', 'Barqa', 'Mishwar'],
  'E-commerce': ['SoukNow', 'Dukan', 'Medina Direct', 'Sanaa'],
  ClimateTech: ['Shams Flow', 'Nafas', 'Riyah', 'Akhdar'],
  AI: ['Fikra AI', 'Sawt', 'Basira', 'Nawat AI'],
  SaaS: ['Kaissa+', 'Mizan', 'Daftar', 'Nizam'],
};

const MARKET_BASE: Record<Industry, { tam: string; sam: string; som: string; note: string }> = {
  AgriTech: { tam: '210M TND', sam: '48M TND', som: '2.4M TND', note: 'fresh produce flowing through Greater Tunis, Nabeul and Sousse yearly' },
  FinTech: { tam: '4.2B TND', sam: '310M TND', som: '6.1M TND', note: 'receivables and short-term credit demand among registered SMEs' },
  HealthTech: { tam: '640M TND', sam: '92M TND', som: '3.2M TND', note: 'out-of-pocket outpatient spend outside the three coastal hubs' },
  EdTech: { tam: '520M TND', sam: '76M TND', som: '2.8M TND', note: 'private tutoring spend by families of secondary students' },
  Logistics: { tam: '1.1B TND', sam: '140M TND', som: '4.6M TND', note: 'urban last-mile and regional distribution spend' },
  'E-commerce': { tam: '890M TND', sam: '120M TND', som: '3.9M TND', note: 'online retail plus artisan export to European buyers' },
  ClimateTech: { tam: '760M TND', sam: '88M TND', som: '2.1M TND', note: 'diesel and grid spend by small farms and workshops' },
  AI: { tam: '1.4B TND', sam: '96M TND', som: '2.6M TND', note: 'automation budgets of call centres, banks and public services in the Maghreb' },
  SaaS: { tam: '680M TND', sam: '104M TND', som: '3.4M TND', note: 'software spend by the 42,000 small retailers and 78,000 SMEs' },
};

const COMPETITORS: Record<Industry, { name: string; note: string; kind: string }[]> = {
  AgriTech: [
    { name: 'The status quo', note: '3–4 intermediaries and a WhatsApp group. Free, trusted, and terrible at planning.', kind: 'Informal' },
    { name: 'Regional distributors', note: 'Own the trucks and the relationships. Slow to digitise, strong on credit terms.', kind: 'Incumbent' },
    { name: 'Generic delivery apps', note: 'Consumer-focused, wrong unit economics for 40kg crates.', kind: 'Adjacent' },
  ],
  FinTech: [
    { name: 'Banks', note: 'Will not underwrite tickets under ~20,000 TND. Your wedge is exactly what they refuse.', kind: 'Incumbent' },
    { name: 'Informal lenders', note: 'Instant but expensive. Your competition on speed, not on price.', kind: 'Informal' },
    { name: 'Regional fintechs', note: '2–3 credible players in the Maghreb. Licensing is the real moat.', kind: 'Direct' },
  ],
  HealthTech: [
    { name: 'Travel to the capital', note: 'The default: 7-week wait and a 180 km trip. Free at the point of care, brutal in reality.', kind: 'Status quo' },
    { name: 'Private clinics', note: 'Well trusted, urban only, no interest in low-ticket remote consults.', kind: 'Incumbent' },
    { name: 'Global telehealth apps', note: 'No local specialist supply and no reimbursement pathway.', kind: 'Adjacent' },
  ],
  EdTech: [
    { name: 'Private tutors', note: '40–80 TND/hour, personal relationship, zero scalability. Your real competitor.', kind: 'Informal' },
    { name: 'YouTube and PDFs', note: 'Free and abundant. You must beat "free" with structure and accountability.', kind: 'Free' },
    { name: 'Regional EdTech apps', note: 'Content rarely matches the national curriculum.', kind: 'Direct' },
  ],
  Logistics: [
    { name: 'Own driver / cousin with a van', note: 'The default. Cheap until it fails on a busy Saturday.', kind: 'Informal' },
    { name: 'Delivery platforms', note: '20–25% commissions and they own the customer.', kind: 'Incumbent' },
    { name: 'Courier companies', note: 'Built for parcels, not same-hour groceries.', kind: 'Adjacent' },
  ],
  'E-commerce': [
    { name: 'Facebook and Instagram selling', note: 'Where the market actually is. No logistics, no payment, huge trust.', kind: 'Informal' },
    { name: 'Regional marketplaces', note: 'Traffic advantage, weak curation and export support.', kind: 'Incumbent' },
    { name: 'Global marketplaces', note: 'Reach Europe but crush artisan margins with fees.', kind: 'Direct' },
  ],
  ClimateTech: [
    { name: 'Diesel generators', note: 'Known, financed by nobody, 300+ TND/month. Your benchmark price.', kind: 'Status quo' },
    { name: 'Solar installers', note: 'Sell hardware up front — 14,000 TND wall your customer cannot climb.', kind: 'Incumbent' },
    { name: 'Utility programmes', note: 'Subsidised but slow and paperwork-heavy.', kind: 'Adjacent' },
  ],
  AI: [
    { name: 'Global foundation models', note: 'Strong at everything except your dialect and your data residency requirement.', kind: 'Incumbent' },
    { name: 'Local integrators', note: 'Own the enterprise relationships. Likely your channel, not your enemy.', kind: 'Channel' },
    { name: 'In-house teams', note: 'Big clients try first, fail on data, then buy.', kind: 'Build-vs-buy' },
  ],
  SaaS: [
    { name: 'Paper notebook / Excel', note: 'Free, offline, familiar. The hardest competitor you will face.', kind: 'Status quo' },
    { name: 'Cash-register vendors', note: 'Hardware-led, expensive, no mobile, strong installed base.', kind: 'Incumbent' },
    { name: 'Regional POS apps', note: '2–3 players; differentiation is offline mode and local credit ledgers.', kind: 'Direct' },
  ],
};

const PRICING: Record<Industry, string> = {
  AgriTech: 'Commission on volume (7–10%) beats a subscription here: it scales with the value you create and survives seasonality. Add a small monthly logistics fee once retention is proven.',
  FinTech: 'Price per transaction (3–4% discount fee) rather than monthly. Your customer compares you to waiting 90 days, not to software.',
  HealthTech: 'Per-consultation pricing shared with the partner point, 30–40 TND. Subscriptions only for chronic follow-up.',
  EdTech: 'Low monthly price (15–25 TND) with an annual option before exam season. Families budget monthly, schools budget yearly.',
  Logistics: 'Per-delivery pricing paid by the shop, never a commission on basket value — shops refuse to share margin.',
  'E-commerce': 'Commission (10–14%) plus a small storefront fee. The fee filters out sellers who will never ship.',
  ClimateTech: 'Monthly leasing priced just under the customer’s current diesel bill, with a seasonal component if income is seasonal.',
  AI: 'Usage-based API pricing with an enterprise licence tier. Enterprises in the region prefer an annual invoice to a metered bill.',
  SaaS: 'Per-location pricing (29–79 TND/month), not per user. Small retailers understand "per shop" instantly.',
};

const MVP_TEMPLATES: Record<Industry, { label: string; why: string }[]> = {
  AgriTech: [
    { label: 'Demand aggregation (orders in by 18:00)', why: 'This is the only piece that creates the value: one van instead of nine.' },
    { label: 'Simple forecast dashboard', why: 'Enough to show tomorrow’s volume. Accuracy can be human at first.' },
    { label: 'Stock / spoilage alerts', why: 'The retention hook — the thing they open every morning.' },
  ],
  FinTech: [
    { label: 'Invoice upload + buyer verification', why: 'Verification is the risk engine. Do it by phone before you code it.' },
    { label: 'Manual underwriting sheet', why: 'Your first 20 decisions should be human, so the model learns from real losses.' },
    { label: 'Payout + repayment tracking', why: 'Trust is built here. Nothing else matters if a payment is late.' },
  ],
  HealthTech: [
    { label: 'Booking with a real specialist calendar', why: 'Supply, not demand, is your constraint. Start with 3 doctors.' },
    { label: 'Video consultation with a local assistant', why: 'The nurse at the partner point is the product, the video is the pipe.' },
    { label: 'Consultation summary the patient keeps', why: 'Drives the 40%+ repeat rate that makes the unit economics work.' },
  ],
  EdTech: [
    { label: 'One subject, one level, done well', why: 'Depth beats breadth. Maths bac before anything else.' },
    { label: 'Step-by-step guided answers', why: 'Not answers — the reasoning. That is what parents pay a tutor for.' },
    { label: 'Weekly progress message to the parent', why: 'The parent pays. Retention lives in their inbox, not the student’s.' },
  ],
  Logistics: [
    { label: 'Order intake from the shop (WhatsApp is fine)', why: 'Do not force an app on day one. Meet them where they work.' },
    { label: 'Manual dispatch board', why: 'You are the routing algorithm for the first 300 deliveries.' },
    { label: 'Proof of delivery + daily reconciliation', why: 'Cash handling is where informal delivery breaks. Win there.' },
  ],
  'E-commerce': [
    { label: '10 curated storefronts', why: 'Curation is the product. 10 sellers who ship beats 200 who might.' },
    { label: 'Checkout with one payment method that works', why: 'Add methods only when a real order fails.' },
    { label: 'Shared shipping to one destination country', why: 'One corridor, priced properly, before you promise the world.' },
  ],
  ClimateTech: [
    { label: 'Site assessment + savings estimate', why: 'Your pitch is a number: what they pay now vs what they will pay.' },
    { label: '3 monitored installations', why: 'Real generation data is what unlocks financing and referrals.' },
    { label: 'Monthly billing with remote monitoring', why: 'Ownership stays with you, so monitoring is not optional.' },
  ],
  AI: [
    { label: 'One narrow task, benchmarked publicly', why: 'A number beats a demo. Publish the benchmark and the failures.' },
    { label: 'API with 3 pilot customers', why: 'Pilots pay for the dataset that becomes the moat.' },
    { label: 'Human-in-the-loop fallback', why: 'Below 95% accuracy you sell a workflow, not autonomy.' },
  ],
  SaaS: [
    { label: 'The single workflow that loses them money today', why: 'Stock or credit ledger — pick one, replace the notebook for it.' },
    { label: 'Offline-first mobile', why: 'If it needs signal to make a sale, it will be abandoned in week two.' },
    { label: 'One-tap daily summary', why: 'The habit loop. Owners want to close the day in 30 seconds.' },
  ],
};

const RISK_BY_INDUSTRY: Record<Industry, 'Low' | 'Medium' | 'High'> = {
  AgriTech: 'Medium', FinTech: 'High', HealthTech: 'High', EdTech: 'Medium',
  Logistics: 'Medium', 'E-commerce': 'Medium', ClimateTech: 'Medium', AI: 'Medium', SaaS: 'Low',
};

const COMPETITION_BY_INDUSTRY: Record<Industry, 'Low' | 'Medium' | 'High'> = {
  AgriTech: 'Low', FinTech: 'High', HealthTech: 'Medium', EdTech: 'High',
  Logistics: 'High', 'E-commerce': 'High', ClimateTech: 'Low', AI: 'High', SaaS: 'Medium',
};

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ============================================================
   1. IDEA VALIDATOR
   ============================================================ */
export function analyzeIdea(rawIdea: string): IdeaAnalysis {
  const idea = rawIdea.trim();
  const t = idea.toLowerCase();
  const h = hash(t);

  /* industry */
  let best: { industry: Industry; emoji: string; score: number } = { industry: 'SaaS', emoji: '🧩', score: 0 };
  for (const hint of INDUSTRY_HINTS) {
    const score = hint.words.reduce((n, w) => (t.includes(w) ? n + (w.length > 4 ? 2 : 1) : n), 0);
    if (score > best.score) best = { industry: hint.industry, emoji: hint.emoji, score };
  }
  const industry = best.industry;

  /* segment + place */
  const seg = SEGMENTS.find(s => s.words.some(w => t.includes(w)));
  const segment = seg?.label ?? 'potential customers';
  const place = PLACES.find(p => p.words.some(w => t.includes(w)));
  const country = place?.country ?? 'Tunisia';
  const city = place?.city ?? 'Tunis';

  /* score */
  let score = 58 + (h % 22); // 58–79 base
  if (seg) score += 6;                                   // named a customer
  if (/\d/.test(t)) score += 3;                          // brought a number
  if (t.length > 120) score += 3;                        // thought it through
  if (t.length < 45) score -= 8;                         // one-liner
  if (t.includes('everyone') || t.includes('all people')) score -= 6;
  if (t.includes('uber for') || t.includes('like uber')) score -= 3;
  score = Math.max(34, Math.min(94, score));

  const market = MARKET_BASE[industry];
  const names = NAME_POOL[industry];
  const name = names[h % names.length];

  /* tagline from the founder's own words */
  const firstClause = idea.replace(/^i (want to|would like to|plan to)\s*/i, '').replace(/^(build|create|make|launch)\s*/i, '');
  const tagline = titleCase(firstClause.split(/[.;\n]/)[0].slice(0, 92).trim());

  const marketPotential: 'Low' | 'Medium' | 'High' = score >= 74 ? 'High' : score >= 60 ? 'Medium' : 'Low';

  return {
    idea,
    name,
    tagline,
    industry,
    emoji: best.emoji,
    opportunityScore: score,
    marketPotential,
    competition: COMPETITION_BY_INDUSTRY[industry],
    risk: RISK_BY_INDUSTRY[industry],
    timing:
      industry === 'AI'
        ? 'Strong. Regional language and data-residency requirements are creating a 12–18 month window before global players localise.'
        : industry === 'FinTech'
          ? 'Good, but regulation sets your pace. Start with the segment that needs no licence.'
          : `Good. Smartphone penetration and digital payment adoption in ${country} crossed the threshold this segment needed.`,
    marketSize: [
      { label: 'TAM', value: market.tam, note: `Total ${market.note}.` },
      { label: 'SAM', value: market.sam, note: `The portion reachable with your model in ${country} in 3 years.` },
      { label: 'SOM', value: market.som, note: 'A credible 18-month target — this is the only number investors will test.' },
    ],
    competitors: COMPETITORS[industry],
    strengths: [
      seg ? `You named a precise customer: ${segment}. Most ideas at this stage do not.` : 'The concept is clear enough to test this week.',
      `${industry} in ${country} is underserved by software — the incumbent is a notebook, a WhatsApp group or an intermediary.`,
      'The problem is expensive and recurring, which means someone already pays for a bad solution today.',
    ],
    risks: [
      RISK_BY_INDUSTRY[industry] === 'High'
        ? `Regulatory exposure: ${industry} in ${country} needs a compliance path before scale. Design your first version to avoid needing a licence.`
        : 'Willingness to pay is unproven. Your first experiment must be a price conversation, not a product.',
      `${segment} are hard to reach digitally. Your acquisition will start physical — plan for it in the unit economics.`,
      'Seasonality and cash-flow timing in this segment can break a flat monthly subscription.',
    ],
    nextStep: seg
      ? `Interview 20 ${segment} in ${city} this week. Ask what they do today and what it costs them — not whether they like your idea.`
      : `Interview 20 potential customers in ${city} this week. Ask what they do today and what it costs them.`,
    mvp: MVP_TEMPLATES[industry],
    pricing: PRICING[industry],
    segments: seg
      ? [`${titleCase(segment)} in ${city} (beachhead)`, `${titleCase(segment)} in the next two cities`, 'Suppliers and partners who serve them']
      : [`Early adopters in ${city}`, 'The same segment nationally', 'Partners who already serve them'],
  };
}

/* ============================================================
   2. ROADMAP GENERATOR
   ============================================================ */
export function generateRoadmap(a: IdeaAnalysis, startupId: string): Roadmap {
  const seg = a.segments[0].replace(/\s*\(beachhead\)$/, '');
  const phases: RoadmapPhase[] = [
    {
      id: 'gp1', name: 'Phase 1 — Validate', goal: 'Prove the problem costs real money', weeks: 'Weeks 1–3',
      tasks: [
        { id: 'gt1', label: `Interview 20 ${seg.toLowerCase()}`, done: false, hint: 'Ask about today, not about your idea' },
        { id: 'gt2', label: 'Write the one-sentence problem statement', done: false },
        { id: 'gt3', label: `Research the 3 alternatives: ${a.competitors.map(c => c.name).join(', ')}`, done: false },
        { id: 'gt4', label: 'Run one price conversation with 5 people', done: false, hint: 'What do they pay today for the workaround?' },
        { id: 'gt5', label: 'Publish your first Build in Public update', done: false, hint: 'Share what you learned, including the no’s' },
      ],
    },
    {
      id: 'gp2', name: 'Phase 2 — MVP', goal: 'One workflow, working, in someone else’s hands', weeks: 'Weeks 4–7',
      tasks: [
        { id: 'gt6', label: `Freeze scope to 3 features: ${a.mvp.map(m => m.label.split('(')[0].trim()).join(' · ')}`, done: false },
        { id: 'gt7', label: 'Build a manual version first (spreadsheet + phone)', done: false, hint: 'Do it by hand for 10 customers before automating' },
        { id: 'gt8', label: 'Ship the working version to 5 users', done: false },
        { id: 'gt9', label: 'Instrument the one metric that proves value', done: false },
        { id: 'gt10', label: 'Publish an MVP launch update with a demo video', done: false },
      ],
    },
    {
      id: 'gp3', name: 'Phase 3 — Launch', goal: 'Money in the account, repeatably', weeks: 'Weeks 8–11',
      tasks: [
        { id: 'gt11', label: 'Sign your first paying customer', done: false, hint: a.pricing.split('.')[0] },
        { id: 'gt12', label: 'Reach 10 paying customers', done: false },
        { id: 'gt13', label: 'Interview every churned user personally', done: false },
        { id: 'gt14', label: 'Publish your real numbers publicly', done: false, hint: 'Credibility compounds faster than growth' },
      ],
    },
    {
      id: 'gp4', name: 'Phase 4 — Growth', goal: 'A channel that repeats without you', weeks: 'Weeks 12–16',
      tasks: [
        { id: 'gt15', label: 'Test 2 acquisition channels with a fixed budget', done: false },
        { id: 'gt16', label: 'Write the onboarding script that converts', done: false },
        { id: 'gt17', label: 'Book a session with a growth expert', done: false },
        { id: 'gt18', label: 'Reach 50 paying customers', done: false },
      ],
    },
    {
      id: 'gp5', name: 'Phase 5 — Fundraising', goal: 'Raise from a community that already follows you', weeks: 'Weeks 17–20',
      tasks: [
        { id: 'gt19', label: 'Build a financial model and have it reviewed', done: false },
        { id: 'gt20', label: 'Prepare the pitch deck (10 slides maximum)', done: false },
        { id: 'gt21', label: 'Reach 500 followers before launching a campaign', done: false, hint: 'Campaigns are won before they open' },
        { id: 'gt22', label: 'Launch your crowdfunding campaign', done: false },
      ],
    },
  ];

  return { id: 'r_' + startupId, startupId, source: 'ai', sourceLabel: 'Generated by Copilot from your idea', phases };
}

/* ============================================================
   3. COPILOT CHAT
   ============================================================ */
export interface CopilotContext {
  startup?: Startup;
  nextTask?: string;
  followers: number;
  campaign?: { raised: number; goal: number; backers: number; pct: number };
  score: number;
}

export interface CopilotAnswer {
  title: string;
  body: string;
  followUps: string[];
  action?: { label: string; route: string };
}

export const COPILOT_PROMPTS: { label: string; q: string; emoji: string }[] = [
  { label: 'Is my idea good?', q: 'Is my idea good?', emoji: '💡' },
  { label: 'Who are my competitors?', q: 'Who are my competitors?', emoji: '⚔️' },
  { label: 'What should my MVP contain?', q: 'What should my MVP contain?', emoji: '🧩' },
  { label: 'How large is my market?', q: 'How large is my market?', emoji: '🌍' },
  { label: 'What should I do this week?', q: 'What should I do this week?', emoji: '🗓️' },
  { label: 'How should I price my product?', q: 'How should I price my product?', emoji: '🏷️' },
  { label: 'How do I validate my idea?', q: 'How do I validate my idea?', emoji: '🎯' },
  { label: 'Help me prepare for fundraising', q: 'Help me prepare for fundraising', emoji: '💰' },
  { label: 'Help me create a pitch deck', q: 'Help me create a pitch deck', emoji: '📊' },
  { label: 'Why am I not getting customers?', q: 'Why am I not getting customers?', emoji: '🤔' },
];

const num = (n: number) => n.toLocaleString('en-US');

function kpiLine(kpis: Kpi[]): string {
  return kpis.map(k => `${k.label} ${k.value}${k.delta ? ` (${k.delta})` : ''}`).join(' · ');
}

export function copilotAnswer(question: string, ctx: CopilotContext): CopilotAnswer {
  const q = question.toLowerCase();
  const s = ctx.startup;
  const name = s?.name ?? 'your startup';
  const day = s?.day ?? 1;
  const stage = s?.stages.find(x => x.status === 'active');
  const stageLabel = stage?.label ?? 'Idea';
  const industry = s?.industry ?? 'SaaS';

  const match = (...words: string[]) => words.some(w => q.includes(w));

  /* --- what should I do this week --- */
  if (match('this week', 'what should i do', 'next step', 'what now', 'priority')) {
    return {
      title: `Your week, based on Day ${day} of ${name}`,
      body:
        `You are in the ${stageLabel} stage, so there is exactly one question worth answering this week — and it is not a product question.\n\n` +
        `Do this:\n` +
        `1. ${ctx.nextTask ?? 'Interview 5 customers about what they do today'} — this is the next open task on your roadmap.\n` +
        `2. Publish one Build in Public update, even if the result is negative. Your streak is part of your Founder Score (currently ${ctx.score}/100).\n` +
        `3. Ask one specific question to the community instead of a general one. "Would you pay X?" gets opinions; "what did you pay last month for Y?" gets facts.\n\n` +
        `Do not do this week:\n` +
        `• Any new feature that no customer asked for by name.\n` +
        `• Redesigning your landing page.\n\n` +
        `If you only get one thing done, make it #1.`,
      followUps: ['Draft that update for me', 'What questions should I ask in the interviews?', 'Why am I not getting customers?'],
      action: { label: 'Open Build in Public', route: '/build' },
    };
  }

  /* --- idea quality --- */
  if (match('is my idea good', 'idea good', 'what do you think of my idea', 'validate my idea', 'how do i validate')) {
    return {
      title: match('how do i validate', 'validate my idea') ? `How to validate ${name} properly` : `An honest read on ${name}`,
      body:
        `The idea is not the asset — the evidence is. Here is how I would judge ${name} today.\n\n` +
        `What is working: you have ${day} days of public building and a defined customer. That already puts you ahead of most ideas at this stage.\n\n` +
        `What is unproven: whether the pain is expensive enough that someone changes their habits and pays.\n\n` +
        `The validation sequence that actually works:\n` +
        `1. 20 conversations with people who are not your friends. Ask about the last time the problem cost them money.\n` +
        `2. Count how many describe the problem without you prompting it. Under 12 of 20 means keep looking.\n` +
        `3. Ask for a commitment that hurts a little: a deposit, a scheduled pilot, a signed letter. Enthusiasm is free; commitment is data.\n` +
        `4. Publish what you heard — including the objections. The failure posts on this platform get 3× the engagement of the success ones, and they are what supporters trust.\n\n` +
        `Kill criteria (decide them now): if fewer than 8 of 20 confirm the problem and none will pre-commit, change the segment before you change the product.`,
      followUps: ['What questions should I ask in an interview?', 'Who are my competitors?', 'How should I price my product?'],
      action: { label: 'Run the AI Idea Validator', route: '/build/validate' },
    };
  }

  /* --- competitors --- */
  if (match('competitor', 'competition', 'who else is doing')) {
    const comps = COMPETITORS[industry as Industry] ?? COMPETITORS.SaaS;
    return {
      title: `Competitive picture for ${name}`,
      body:
        `In ${industry} the mistake is to list startups. Your real competitor is the current behaviour.\n\n` +
        comps.map(c => `• ${c.name} (${c.kind}) — ${c.note}`).join('\n') +
        `\n\nHow to position against them:\n` +
        `• Do not compete on features. Compete on the one job the incumbent does badly and cannot fix without breaking their model.\n` +
        `• Write your positioning as: "Unlike [the status quo], ${name} lets ${s?.tagline.toLowerCase() ?? 'customers do the job'} without [the cost they hate]."\n` +
        `• Ask 5 customers who they would use if you disappeared. Their answer, not your analysis, is your competitive set.`,
      followUps: ['How should I price against them?', 'What should my MVP contain?', 'Help me create a pitch deck'],
    };
  }

  /* --- MVP --- */
  if (match('mvp', 'minimum viable', 'what should i build', 'features')) {
    const mvp = MVP_TEMPLATES[industry as Industry] ?? MVP_TEMPLATES.SaaS;
    return {
      title: `The MVP I would build for ${name}`,
      body:
        `Three things, nothing else. If it takes more than 3–4 weeks, it is not an MVP.\n\n` +
        mvp.map((m, i) => `${i + 1}. ${m.label}\n   Why: ${m.why}`).join('\n\n') +
        `\n\nExplicitly cut for now: authentication niceties, admin panels, dashboards for you, a mobile app if the web works, and anything a customer has not asked for by name.\n\n` +
        `Before you write code, run the manual version for 10 customers. You will discover the real workflow, and you can charge while you learn.`,
      followUps: ['What should I do this week?', 'How should I price my product?', 'Should I hire a developer or an agency?'],
      action: { label: 'Add these to my roadmap', route: '/build/roadmap' },
    };
  }

  /* --- market size --- */
  if (match('market', 'tam', 'how big', 'market size')) {
    const m = MARKET_BASE[industry as Industry] ?? MARKET_BASE.SaaS;
    return {
      title: `Market sizing for ${name}`,
      body:
        `Built bottom-up, which is the only version that survives a real conversation with an investor.\n\n` +
        `• TAM ${m.tam} — total ${m.note}.\n` +
        `• SAM ${m.sam} — what your model can actually reach in 3 years.\n` +
        `• SOM ${m.som} — a credible 18-month target. This is the number you will be challenged on.\n\n` +
        `How to defend it: TAM = (number of customers you can name) × (what they already spend on the workaround). If you cannot count the customers, your market is a story, not a number.\n\n` +
        `For a MENA-first startup, a 2–4M TND SOM with strong retention is far more fundable than a 1B TND TAM with none.`,
      followUps: ['Help me prepare for fundraising', 'Who are my competitors?', 'How large should my first beachhead be?'],
    };
  }

  /* --- pricing --- */
  if (match('pric', 'charge', 'how much should i', 'monetiz', 'business model')) {
    return {
      title: `Pricing for ${name}`,
      body:
        `${PRICING[industry as Industry] ?? PRICING.SaaS}\n\n` +
        `Three rules for this market:\n` +
        `1. Price against the workaround, not against competitors. What does the notebook, the intermediary or the diesel bill cost them per month?\n` +
        `2. Never launch one price. Launch three and watch which one people argue about — that is the real one.\n` +
        `3. Match the billing rhythm to their cash flow. Seasonal income plus flat monthly fees is the most common silent killer in the region.\n\n` +
        `Test it like this: offer the middle price to the next 10 prospects and count how many say yes without negotiating. Zero means too cheap to be credible; more than 7 means you left money on the table.`,
      followUps: ['Why am I not getting customers?', 'What should I do this week?', 'Book a finance expert'],
      action: { label: 'Find a pricing expert', route: '/experts' },
    };
  }

  /* --- fundraising --- */
  if (match('fundrais', 'raise', 'investor', 'crowdfund', 'campaign')) {
    const c = ctx.campaign;
    return {
      title: `Fundraising readiness for ${name}`,
      body:
        (c
          ? `Your campaign is at ${c.pct}% — ${num(c.raised)} of ${num(c.goal)} TND from ${c.backers} supporters.\n\n`
          : `You do not have a campaign yet, which is fine. Campaigns are won before they open.\n\n`) +
        `What supporters here actually check, in order:\n` +
        `1. Have you been building visibly? You have ${day} days of journey and ${num(ctx.followers)} followers. This is your strongest asset — most first-time founders have nothing to show.\n` +
        `2. Do the numbers move? ${s ? kpiLine(s.kpis.slice(0, 3)) : 'Show one metric improving weekly.'}\n` +
        `3. Did you survive something? Your failure posts do more for trust than your wins. Keep them visible.\n` +
        `4. Is the ask specific? "60,000 TND to build offline mode for the 41% of students who lose connection" converts. "Raising to grow" does not.\n\n` +
        `Do this before you launch:\n` +
        `• Get 2 expert endorsements — they lift conversion more than any design change.\n` +
        `• Line up 30% of the goal from people who already follow you. Campaigns that open cold, stay cold.\n` +
        `• Break the goal into funded milestones so a partial raise is still a win.`,
      followUps: ['Help me create a pitch deck', 'What should be in my use of funds?', 'Find a fundraising expert'],
      action: { label: 'Open the campaign builder', route: '/build/campaign' },
    };
  }

  /* --- pitch deck --- */
  if (match('pitch deck', 'deck', 'pitch', 'slides')) {
    return {
      title: `A 10-slide deck for ${name}`,
      body:
        `1. One sentence: what you do, for whom, and the outcome.\n` +
        `2. The problem — with a number a customer said out loud.\n` +
        `3. Why now (regulation, adoption, cost curve).\n` +
        `4. The product — one screenshot of the core workflow, not a tour.\n` +
        `5. Traction — ${s ? kpiLine(s.kpis.slice(0, 3)) : 'your best three metrics'}.\n` +
        `6. The journey — Day 1 to Day ${day}. This slide is your unfair advantage; almost nobody has it.\n` +
        `7. Business model and unit economics.\n` +
        `8. Market, bottom-up.\n` +
        `9. Team, and why you specifically.\n` +
        `10. The ask, broken into milestones.\n\n` +
        `Two notes: put traction before product if the numbers are good, and never use a slide an investor cannot repeat to a colleague from memory.`,
      followUps: ['Help me prepare for fundraising', 'How large is my market?', 'Find a fundraising expert'],
      action: { label: 'Find a fundraising expert', route: '/experts' },
    };
  }

  /* --- not getting customers --- */
  if (match('not getting customers', 'no customers', 'no traction', 'no users', 'nobody', 'why am i not')) {
    return {
      title: `Why ${name} is not converting yet`,
      body:
        `Almost always one of five things. Diagnose in this order — it is cheapest to most expensive.\n\n` +
        `1. Wrong person. You are talking to someone who feels the problem but does not own the budget. In small businesses the owner signs, but the person who uses it daily decides whether it survives.\n` +
        `2. Wrong moment. The pain is real but not urgent this month. Find the trigger event — end of season, an audit, a lost customer — and show up then.\n` +
        `3. Unclear promise. If your first sentence contains "platform" or "solution", they cannot repeat it to a colleague. Rewrite it as: "we do X so you stop losing Y".\n` +
        `4. Too much switching cost. Every field in your onboarding costs you conversions. Do the migration for them, by hand, for the first 20.\n` +
        `5. Price shape, not price level. Same amount, wrong rhythm — try per-use or seasonal before you discount.\n\n` +
        `Fastest test: take your last 10 no's and call them. Ask "what would have had to be true?" You will hear the same sentence three times, and that sentence is your fix.`,
      followUps: ['How should I price my product?', 'What should I do this week?', 'Find a B2B sales expert'],
    };
  }

  /* --- hiring / team --- */
  if (match('hire', 'hiring', 'developer', 'co-founder', 'cofounder', 'team', 'agency')) {
    return {
      title: `Hiring for ${name} at Day ${day}`,
      body:
        `At your stage, hire scope, not people.\n\n` +
        `• Need software built? One strong contractor for 6–8 weeks with a hard, written scope. A CTO hired before product-market fit usually leaves before it.\n` +
        `• Need a co-founder? Work together on something small and paid for a month first. Equity conversations before that are guesses.\n` +
        `• Never outsource the customer conversations. That is the founder's job and the only real learning loop.\n\n` +
        `Practical move on this platform: post a Help Wanted update. They reach people already following your journey, which converts far better than a job board — and you can see their public work first.`,
      followUps: ['Draft a Help Wanted post', 'What should I do this week?', 'Find a technical expert'],
      action: { label: 'Post a Help Wanted update', route: '/build' },
    };
  }

  /* --- marketing / growth --- */
  if (match('marketing', 'growth', 'acquisition', 'ads', 'channel', 'audience')) {
    return {
      title: `Distribution for ${name}`,
      body:
        `In small markets, distribution is physical before it is digital.\n\n` +
        `• The highest-converting channel for most MENA B2B startups is someone who already visits your customers weekly — a supplier, a route salesperson, a wholesaler. Partner with one before you buy an ad.\n` +
        `• Build in public is a channel, not a diary. Every update you publish is a searchable, shareable proof point. You currently have ${num(ctx.followers)} followers; 500 is roughly where campaigns start working.\n` +
        `• Ads amplify a message you have already validated. Run them after 20 conversations, not before, or you will burn a small audience learning what to say.\n\n` +
        `This week: pick one channel, one metric, one budget cap. Two channels at once teaches you nothing about either.`,
      followUps: ['What should I post about?', 'Why am I not getting customers?', 'Find a growth expert'],
      action: { label: 'Find a growth expert', route: '/experts' },
    };
  }

  /* --- what should I post --- */
  if (match('post about', 'what should i post', 'content', 'update', 'draft')) {
    return {
      title: 'What to post this week',
      body:
        `The updates that build credibility fastest, in order:\n\n` +
        `1. A number and what caused it. "MRR ${s?.kpis[2]?.value ?? 'went up'} — because we changed the onboarding call."\n` +
        `2. A failed experiment with the lesson. These get the most support on this platform, and they are what supporters cite when they back you.\n` +
        `3. A specific question. "Would you invoice monthly or per delivery?" beats "any feedback welcome".\n` +
        `4. A behind-the-scenes story: an interview, a route, a workshop visit. Show the work, not the polish.\n\n` +
        `Draft you can use today:\n` +
        `"Day ${day} of building ${name}. ${ctx.nextTask ? `This week: ${ctx.nextTask.toLowerCase()}.` : ''} Here is what surprised me: [the thing you did not expect]. Here is what I am changing: [one decision]. If you know a ${s?.industry === 'AgriTech' ? 'restaurant owner' : 'potential customer'} who has this problem, introduce me."`,
      followUps: ['What should I do this week?', 'Help me create a pitch deck', 'Is my idea good?'],
      action: { label: 'Publish an update', route: '/build' },
    };
  }

  /* --- default --- */
  return {
    title: `Let me answer that in the context of ${name}`,
    body:
      `You are on Day ${day}, in the ${stageLabel} stage${s ? `, with ${kpiLine(s.kpis.slice(0, 2))}` : ''}.\n\n` +
      `Here is how I would think about "${question.trim()}":\n` +
      `1. Reduce it to a decision you can make this week. If it is not a decision, it is a distraction.\n` +
      `2. Find the cheapest evidence that would change your mind. Usually 5 phone calls, not a month of building.\n` +
      `3. Decide, publish the reasoning, and let the community correct you. That is the whole advantage of building in public.\n\n` +
      `${ctx.nextTask ? `Your next open roadmap task is: ${ctx.nextTask}. Unless what you asked about blocks it, do that first.` : 'Your roadmap has no open task — add one before you do anything else.'}\n\n` +
      `Ask me something more specific and I will be more concrete: pricing, competitors, MVP scope, this week's plan, or fundraising readiness.`,
    followUps: ['What should I do this week?', 'Is my idea good?', 'How should I price my product?'],
  };
}
