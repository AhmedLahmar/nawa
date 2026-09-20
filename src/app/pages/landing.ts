import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '../core/store';
import { fmt, UI } from '../ui/ui';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, UI],
  template: `
    <div class="dark">
      <!-- ---------------- nav ---------------- -->
      <nav class="lp-nav">
        <a class="row g-9" routerLink="/">
          <span class="mark">🌱</span>
          <span class="bb" style="font-family:var(--display);font-size:18px;letter-spacing:-.03em;color:#fff">Nawa</span>
        </a>
        <div class="row g-18 desktop-only" style="margin-left:22px">
          <a class="lp-link" href="#loop">How it works</a>
          <a class="lp-link" href="#public">Build in public</a>
          <a class="lp-link" href="#tools">Tools</a>
          <a class="lp-link" href="#who">Who it's for</a>
        </div>
        <div class="grow"></div>
        <a class="btn btn--sm" routerLink="/discover">Explore startups</a>
        <a class="btn btn--primary btn--sm" routerLink="/onboarding">Start Building</a>
      </nav>

      <!-- ---------------- hero ---------------- -->
      <section class="lp-sec" style="padding-top:clamp(38px,5vw,72px)">
        <div class="lp-wrap lp-hero">
          <div class="col g-20">
            <span class="kicker"><span>🇹🇳</span> Tunisia first · then MENA</span>
            <h1 class="display-xl">
              Build your startup<br />
              <span style="background:linear-gradient(96deg,#8f7dff,#2ee6a8);-webkit-background-clip:text;background-clip:text;color:transparent">in public.</span>
            </h1>
            <p class="lg muted" style="max-width:520px">
              Get feedback. Build credibility. Find experts. Grow your community. Get funded —
              in one place, from the first idea to the first cheque.
            </p>
            <div class="row g-10 wrap">
              <a class="btn btn--primary btn--lg" routerLink="/onboarding">
                Start Building <app-icon name="arrowR" [size]="17" />
              </a>
              <a class="btn btn--lg" routerLink="/discover">Explore Startups</a>
            </div>
            <div class="row g-12">
              <div class="av-stack">
                @for (p of faces(); track p.id) {
                  <app-av [name]="p.name" [size]="30" />
                }
              </div>
              <span class="sm muted">
                <b style="color:#fff">1,284 founders</b> shared an update this month · Tunis, Sfax, Casablanca, Cairo, Dubai
              </span>
            </div>
          </div>

          <!-- hero stage: the product, alive -->
          <div class="hero-stage">
            <div class="glow-orb" style="width:340px;height:340px;background:#6e5cf7;top:-40px;right:-20px"></div>
            <div class="glow-orb" style="width:280px;height:280px;background:#14b87a;bottom:-30px;left:0"></div>

            @if (agrix(); as s) {
              <!-- founder + startup card -->
              <div class="card card--lg floaty" style="padding:16px;position:relative;z-index:2">
                <div class="row g-11">
                  <app-av [name]="founder()?.name ?? ''" [size]="46" [verified]="true" />
                  <div class="grow">
                    <div class="row g-6">
                      <span class="b" style="color:#fff">{{ founder()?.name }}</span>
                      <span class="tag tag--seed">Score {{ founder()?.founderScore }}</span>
                    </div>
                    <div class="tiny muted">Founder @ {{ s.name }} · {{ s.city }}</div>
                  </div>
                  <span class="day-pill" style="background:rgba(255,255,255,.14)">🌱 Day {{ s.day }}</span>
                </div>

                <div class="row g-8 mt-16" style="align-items:flex-start">
                  <app-av [name]="s.name" [emoji]="s.emoji" [gradient]="s.gradient" [size]="34" [square]="true" />
                  <div class="grow">
                    <div class="sm b" style="color:#fff">{{ s.name }}</div>
                    <div class="tiny muted">{{ s.tagline }}</div>
                  </div>
                </div>

                <div class="mt-16">
                  <app-stages [stages]="s.stages" [labels]="false" />
                </div>

                <div class="row between mt-16">
                  @for (k of s.kpis.slice(0, 3); track k.label) {
                    <div>
                      <div class="bb" style="font-family:var(--display);font-size:18px;color:#fff">{{ k.value }}</div>
                      <div class="tiny muted">{{ k.label }}</div>
                    </div>
                  }
                </div>

                <div class="divider mt-16"></div>

                <div class="mt-16 col g-6">
                  <div class="row between tiny">
                    <span class="muted">Community round</span>
                    <span class="b" style="color:#2ee6a8">{{ pct() }}% funded</span>
                  </div>
                  <app-bar [pct]="pct()" tone="seed" />
                  <div class="row between tiny muted">
                    <span>{{ fmt.money(campaign()?.raised ?? 0) }} raised</span>
                    <span>{{ campaign()?.backers }} supporters</span>
                  </div>
                </div>
              </div>

              <!-- floating post -->
              <div class="card float-card floaty-2 desktop-only"
                style="width:290px;padding:13px;left:-58px;bottom:-46px">
                <div class="row g-8">
                  <app-av [name]="founder()?.name ?? ''" [size]="26" />
                  <span class="tiny b" style="color:#fff">Day {{ s.day }} update</span>
                  <span class="tag tag--ink" style="margin-left:auto;background:rgba(255,255,255,.1);color:#cfd0e6">Build in public</span>
                </div>
                <div class="tiny muted mt-8" style="line-height:1.5">
                  “Two cooperatives signed this week. Route accuracy is at 91% — the last 9% is where the money is.”
                </div>
                <div class="row g-12 tiny mt-12" style="color:#9fa0bb">
                  <span>🚀 218</span><span>💬 34</span><span>🔁 12</span>
                </div>
              </div>

              <!-- floating copilot -->
              <div class="card float-card floaty-3 desktop-only"
                style="width:262px;padding:13px;right:-42px;top:-34px">
                <div class="row g-8">
                  <span class="mark" style="width:24px;height:24px;border-radius:8px;font-size:12px">✨</span>
                  <span class="tiny b" style="color:#fff">Copilot</span>
                </div>
                <div class="tiny muted mt-8" style="line-height:1.5">
                  “Your next step: interview 20 cooperative managers in Béja this week. I drafted the questions.”
                </div>
                <div class="row g-6 mt-12">
                  <span class="tag" style="font-size:10.5px">Roadmap · Phase 3</span>
                  <span class="tag" style="font-size:10.5px">2 of 5 done</span>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- ---------------- positioning ---------------- -->
      <section class="lp-sec" id="public" style="padding-top:0">
        <div class="lp-wrap">
          <div class="card card--lg" style="padding:clamp(24px,4vw,46px)">
            <div class="grid grid-2" style="gap:clamp(24px,4vw,46px);align-items:center">
              <div class="col g-16">
                <h2 class="display-lg">Don't just ask people to fund your idea.<br />Let them follow you while you build it.</h2>
                <p class="muted">
                  A campaign page is the last 5% of a startup story. Nawa is the other 95% —
                  the days, the numbers, the questions, the failures, the milestones — published as you go.
                  By the time you ask for support, your community has already watched you earn it.
                </p>
                <div class="row g-10 wrap">
                  <a class="btn btn--primary" routerLink="/onboarding">Start your journey</a>
                  <a class="btn" routerLink="/s/agrix">See a real journey</a>
                </div>
              </div>
              <div class="col g-12">
                @for (row of contrast; track row.a) {
                  <div class="row-t g-12 panel-dark">
                    <div class="grow">
                      <div class="tiny up" style="color:#f2506b">Elsewhere</div>
                      <div class="sm muted">{{ row.a }}</div>
                    </div>
                    <app-icon name="arrowR" [size]="16" style="color:#63647f;margin-top:14px" />
                    <div class="grow">
                      <div class="tiny up" style="color:#2ee6a8">On Nawa</div>
                      <div class="sm" style="color:#fff">{{ row.b }}</div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ---------------- the loop ---------------- -->
      <section class="lp-sec" id="loop" style="padding-top:0">
        <div class="lp-wrap col g-24">
          <div class="col g-10" style="max-width:640px">
            <span class="up" style="color:#8f7dff">The loop</span>
            <h2 class="display-lg">One loop, nine steps, no dead ends.</h2>
            <p class="muted">Every feature on Nawa exists to move you one step further around this loop — and then start it again with more credibility than last time.</p>
          </div>
          <div class="row g-8 wrap">
            @for (s of loop; track s; let i = $index) {
              <span class="loop-step">
                <span class="mono" style="color:#8f7dff">{{ i + 1 }}</span> {{ s }}
              </span>
              @if (i < loop.length - 1) { <app-icon name="chevR" [size]="14" style="color:#4a4b63" /> }
            }
          </div>
        </div>
      </section>

      <!-- ---------------- tools ---------------- -->
      <section class="lp-sec" id="tools" style="padding-top:0">
        <div class="lp-wrap col g-24">
          <div class="col g-10" style="max-width:640px">
            <span class="up" style="color:#2ee6a8">What you get</span>
            <h2 class="display-lg">A social network that actually builds the company.</h2>
          </div>
          <div class="grid grid-2" style="gap:18px">
            @for (f of features; track f.title) {
              <div class="card card--lg col g-12" style="padding:22px">
                <span class="mark" style="width:38px;height:38px;border-radius:12px;font-size:18px">{{ f.emoji }}</span>
                <h3 style="color:#fff">{{ f.title }}</h3>
                <p class="sm muted">{{ f.text }}</p>
                <div class="row g-6 wrap mt-4">
                  @for (t of f.tags; track t) { <span class="tag">{{ t }}</span> }
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- ---------------- marquee ---------------- -->
      <section class="lp-sec" style="padding-top:0;padding-bottom:clamp(40px,6vw,72px)">
        <div class="lp-wrap col g-16">
          <span class="up" style="color:#8f7dff">Building publicly right now</span>
          <div class="marquee-mask">
            <div class="marquee">
              @for (s of marquee(); track $index) {
                <div class="card row g-10" style="padding:11px 14px;min-width:246px">
                  <app-av [name]="s.name" [emoji]="s.emoji" [gradient]="s.gradient" [size]="32" [square]="true" />
                  <div>
                    <div class="sm b" style="color:#fff">{{ s.name }}</div>
                    <div class="tiny muted">Day {{ s.day }} · {{ s.city }} · {{ s.industry }}</div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- ---------------- who it's for ---------------- -->
      <section class="lp-sec" id="who" style="padding-top:0">
        <div class="lp-wrap col g-24">
          <h2 class="display-lg" style="max-width:620px">Four people, one platform, one shared story.</h2>
          <div class="grid grid-4" style="gap:16px">
            @for (r of roles; track r.title) {
              <div class="card card--lg col g-10" style="padding:20px">
                <span style="font-size:24px">{{ r.emoji }}</span>
                <h4 style="color:#fff">{{ r.title }}</h4>
                <p class="tiny muted">{{ r.text }}</p>
                <div class="col g-6 mt-4">
                  @for (b of r.bullets; track b) {
                    <span class="tiny row g-6" style="color:#c3c4d8">
                      <app-icon name="check" [size]="12" style="color:#2ee6a8" /> {{ b }}
                    </span>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- ---------------- final CTA ---------------- -->
      <section class="lp-sec" style="padding-top:0">
        <div class="lp-wrap card card--lg center" style="padding:clamp(30px,5vw,60px)">
          <h2 class="display-lg">Your first update is 60 seconds away.</h2>
          <p class="muted mt-12" style="max-width:520px;margin-inline:auto">
            Tell Nawa about your idea. Copilot validates it, builds your roadmap, and your journey starts
            publishing itself — one honest day at a time.
          </p>
          <div class="row g-10 mid mt-24 wrap">
            <a class="btn btn--primary btn--lg" routerLink="/onboarding">Start Building <app-icon name="arrowR" [size]="17" /></a>
            <a class="btn btn--lg" routerLink="/home">Enter the demo</a>
          </div>
          <div class="row g-8 mid mt-24 tiny muted wrap">
            <app-icon name="lock" [size]="13" /> Concept demo · fictional data · crowdfunding, payments and AI are simulated
          </div>
        </div>
      </section>

      <footer class="lp-sec" style="padding-top:0">
        <div class="lp-wrap row between wrap g-16" style="border-top:1px solid rgba(255,255,255,.08);padding-top:26px">
          <div class="row g-9">
            <span class="mark">🌱</span>
            <div>
              <div class="sm b" style="color:#fff">Nawa</div>
              <div class="tiny muted">Where MENA founders build in public.</div>
            </div>
          </div>
          <div class="row g-16 tiny muted wrap">
            <a class="lp-link" routerLink="/home">Feed</a>
            <a class="lp-link" routerLink="/discover">Discover</a>
            <a class="lp-link" routerLink="/fund">Fund</a>
            <a class="lp-link" routerLink="/experts">Experts</a>
            <a class="lp-link" routerLink="/incubators">Incubators</a>
            <a class="lp-link" routerLink="/challenges">Challenges</a>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .mark { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center;
      background: linear-gradient(140deg, #14b87a, #5a46f0 120%); font-size: 15px; flex: none; }
    .lp-link { font-size: 13.5px; font-weight: 540; color: #a3a4bb; }
    .lp-link:hover { color: #fff; }
    .panel-dark { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
      border-radius: 12px; padding: 12px 14px; }
    .g-9 { gap: 9px } .g-18 { gap: 18px }
  `],
})
export class Landing {
  private store = inject(Store);
  readonly fmt = fmt;

  readonly agrix = computed(() => this.store.startupBySlug('agrix'));
  readonly founder = computed(() => this.store.person('u_me'));
  readonly campaign = computed(() => {
    const s = this.agrix();
    return s ? this.store.campaignOf(s.id) : undefined;
  });
  readonly pct = computed(() => {
    const c = this.campaign();
    return c ? fmt.pct(c.raised, c.goal) : 0;
  });
  readonly faces = computed(() => this.store.people().filter(p => p.role === 'founder').slice(0, 5));
  readonly marquee = computed(() => {
    const list = this.store.startups();
    return [...list, ...list];
  });

  readonly loop = ['Idea', 'Validate', 'Build', 'Share', 'Community', 'Credibility', 'Support', 'Fund', 'Grow'];

  readonly contrast = [
    { a: 'A pitch page nobody has seen before launch day', b: 'A public journey people followed for months' },
    { a: 'Followers who liked a photo', b: 'Supporters who watched you hit each milestone' },
    { a: 'Advice from strangers in comments', b: 'Endorsements from verified experts you worked with' },
    { a: 'A roadmap in a private document', b: 'A roadmap your community can hold you to' },
  ];

  readonly features = [
    {
      emoji: '🛠️', title: 'Build in Public workspace',
      text: 'A day counter, milestones, tasks and KPIs — and a Publish button that turns today\'s work into today\'s post.',
      tags: ['Day counter', 'Milestones', 'KPIs', 'One-tap update'],
    },
    {
      emoji: '✨', title: 'AI Startup Copilot',
      text: 'Validates the idea, scores the opportunity, generates a five-phase roadmap, and answers the question you are actually stuck on.',
      tags: ['Idea validator', 'Roadmap', 'Pitch help', 'Simulated in demo'],
    },
    {
      emoji: '🎓', title: 'Experts & mentors',
      text: 'Book a 30-minute session with someone who has already solved your problem — and carry their endorsement on your profile.',
      tags: ['8 categories', 'Sessions', 'Endorsements'],
    },
    {
      emoji: '💰', title: 'Community rounds',
      text: 'Raise from the people who followed the build. Your campaign page shows the journey, the numbers and the proof — not just the ask.',
      tags: ['Use of funds', 'Rewards', 'Updates', 'Mock payments'],
    },
    {
      emoji: '📣', title: 'A feed with a job',
      text: 'Progress, validation questions, failures, achievements, help wanted, playbooks. Every post type moves the startup forward.',
      tags: ['8 post types', 'Stories', 'Short video'],
    },
    {
      emoji: '🏢', title: 'Incubator portal',
      text: 'Cohorts, custom roadmaps, mentor assignment and startup health at a glance — the programme lives where the founders already are.',
      tags: ['Cohorts', 'Health', 'Demo day'],
    },
  ];

  readonly roles = [
    {
      emoji: '🚀', title: 'Founders', text: 'Build the company and the audience at the same time.',
      bullets: ['Publish daily progress', 'Validate with real people', 'Raise from your community'],
    },
    {
      emoji: '🤝', title: 'Supporters', text: 'Back people, not pitch decks.',
      bullets: ['Follow journeys', 'Give useful feedback', 'Support early'],
    },
    {
      emoji: '🎓', title: 'Experts', text: 'Turn experience into sessions and reputation.',
      bullets: ['Set your rates', 'Answer publicly', 'Endorse founders'],
    },
    {
      emoji: '🏢', title: 'Incubators', text: 'Run the programme where the work happens.',
      bullets: ['Invite founders', 'Assign mentors', 'Track cohort health'],
    },
  ];
}
