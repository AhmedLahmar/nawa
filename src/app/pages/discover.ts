import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Store } from '../core/store';
import { Viewer } from '../shell/viewer';
import { CARDS } from '../feed/cards';
import { fmt, UI } from '../ui/ui';

const TABS = [
  { key: 'startups', label: 'Startups' },
  { key: 'founders', label: 'Founders' },
  { key: 'experts', label: 'Experts' },
  { key: 'incubators', label: 'Incubators' },
  { key: 'campaigns', label: 'Campaigns' },
  { key: 'videos', label: 'Videos' },
  { key: 'challenges', label: 'Challenges' },
];

const INDUSTRIES = ['AgriTech', 'FinTech', 'AI', 'SaaS', 'EdTech', 'HealthTech', 'ClimateTech', 'E-commerce', 'Logistics'];
const CITIES = ['Tunis', 'Sfax', 'Sousse', 'Monastir', 'Bizerte', 'Cairo', 'Casablanca', 'Dubai'];

@Component({
  selector: 'app-discover-page',
  standalone: true,
  imports: [RouterLink, FormsModule, UI, CARDS],
  template: `
    <div class="page">
      <div class="page-head">
        <div class="col g-6">
          <span class="kicker"><app-icon name="compass" [size]="13" /> Discover</span>
          <h1 class="display-lg">Find the builds worth following</h1>
          <span class="muted sm">Startups in the open, the founders behind them, and the people who help them ship.</span>
        </div>
      </div>

      <div class="searchbar mb-16" style="max-width:520px">
        <app-icon name="search" [size]="17" class="faint" />
        <input [(ngModel)]="q" placeholder="Search startups, founders, sectors, cities…" />
        @if (q) { <button class="btn btn--icon btn--xs" (click)="q = ''"><app-icon name="x" [size]="13" /></button> }
      </div>

      <div class="tabs mb-16">
        @for (t of tabs; track t.key) {
          <button class="tab" [class.on]="tab() === t.key" (click)="tab.set(t.key)">
            {{ t.label }}
            <span class="tiny faint">{{ count(t.key) }}</span>
          </button>
        }
      </div>

      @switch (tab()) {
        <!-- ---------------- startups ---------------- -->
        @case ('startups') {
          <div class="col g-14">
            <div class="row between wrap g-10">
              <div class="row g-6 wrap">
                <button class="chip" [class.chip--on]="ind() === 'all'" (click)="ind.set('all')">All sectors</button>
                @for (i of industries; track i) {
                  <button class="chip" [class.chip--on]="ind() === i" (click)="ind.set(i)">{{ i }}</button>
                }
              </div>
              <div class="seg">
                @for (s of ['Trending', 'Newest', 'Most followed']; track s) {
                  <button [class.on]="sort() === s" (click)="sort.set(s)">{{ s }}</button>
                }
              </div>
            </div>
            <div class="row g-6 wrap">
              <button class="chip chip--sm" [class.chip--on]="city() === 'all'" (click)="city.set('all')">Everywhere</button>
              @for (c of cities; track c) {
                <button class="chip chip--sm" [class.chip--on]="city() === c" (click)="city.set(c)">{{ c }}</button>
              }
            </div>
            @if (startups().length) {
              <div class="grid grid-auto">
                @for (s of startups(); track s.id) { <app-startup-card [s]="s" /> }
              </div>
            } @else { <app-empty icon="compass" title="Nothing here yet" text="Try widening your filters." /> }
          </div>
        }

        <!-- ---------------- founders ---------------- -->
        @case ('founders') {
          @if (founders().length) {
            <div class="grid grid-auto">
              @for (p of founders(); track p.id) { <app-person-card [p]="p" /> }
            </div>
          } @else { <app-empty icon="users" title="No founders match" text="Try another search term." /> }
        }

        <!-- ---------------- experts ---------------- -->
        @case ('experts') {
          @if (experts().length) {
            <div class="grid grid-auto">
              @for (e of experts(); track e.id) { <app-expert-card [e]="e" /> }
            </div>
          } @else { <app-empty icon="cap" title="No experts match" text="Try another skill or sector." /> }
        }

        <!-- ---------------- incubators ---------------- -->
        @case ('incubators') {
          @if (incubators().length) {
            <div class="grid grid-auto">
              @for (i of incubators(); track i.id) { <app-incubator-card [i]="i" /> }
            </div>
          } @else { <app-empty icon="building" title="No programmes match" text="Try another search term." /> }
        }

        <!-- ---------------- campaigns ---------------- -->
        @case ('campaigns') {
          <div class="col g-14">
            <span class="mock-note"><app-icon name="lock" [size]="11" /> Funding is simulated — no real transactions</span>
            @if (campaigns().length) {
              <div class="grid grid-auto">
                @for (c of campaigns(); track c.id) { <app-campaign-card [c]="c" /> }
              </div>
            } @else { <app-empty icon="dollar" title="No open rounds match" text="Try another search term." /> }
          </div>
        }

        <!-- ---------------- videos ---------------- -->
        @case ('videos') {
          @if (videos().length) {
            <div class="grid grid-auto" style="grid-template-columns:repeat(auto-fill,minmax(178px,1fr))">
              @for (v of videos(); track v.id) { <app-video-card [v]="v" /> }
            </div>
          } @else { <app-empty icon="video" title="No videos match" text="Try another search term." /> }
        }

        <!-- ---------------- challenges ---------------- -->
        @case ('challenges') {
          @if (challenges().length) {
            <div class="grid grid-auto">
              @for (c of challenges(); track c.id) { <app-challenge-card [c]="c" /> }
            </div>
          } @else { <app-empty icon="flag" title="No challenges match" text="Try another search term." /> }
        }
      }

      @if (!q) {
        <div class="card card--flat col g-12 pad-lg mt-24">
          <div class="row between">
            <h4>Stories from today</h4>
            <a class="link tiny" routerLink="/home">Open the feed →</a>
          </div>
          <div class="stories">
            @for (g of store.stories(); track g.id) {
              <div class="story" (click)="openStory($index)">
                <div class="story__ring" [class.story__ring--seen]="store.isStorySeen(g.id)">
                  <div class="story__inner">
                    <app-av [name]="name(g.authorId)" [size]="63" />
                  </div>
                </div>
                <span class="story__name">{{ name(g.authorId) }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class DiscoverPage {
  readonly store = inject(Store);
  private viewer = inject(Viewer);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly fmt = fmt;
  readonly tabs = TABS;
  readonly industries = INDUSTRIES;
  readonly cities = CITIES;

  private query = toSignal(this.route.queryParamMap);
  readonly tab = signal('startups');
  readonly ind = signal('all');
  readonly city = signal('all');
  readonly sort = signal('Trending');
  q = '';

  constructor() {
    effect(() => {
      const qp = this.query();
      const term = qp?.get('q');
      if (term !== null && term !== undefined) this.q = term;
      const t = qp?.get('tab');
      if (t && TABS.some(x => x.key === t)) this.tab.set(t);
    });
  }

  private match(...parts: (string | undefined)[]): boolean {
    const term = this.q.trim().toLowerCase();
    if (!term) return true;
    return parts.filter(Boolean).join(' ').toLowerCase().includes(term);
  }

  readonly startups = computed(() => {
    let list = this.store.startups().filter(s =>
      this.match(s.name, s.tagline, s.industry, s.city, s.description));
    if (this.ind() !== 'all') list = list.filter(s => s.industry === this.ind());
    if (this.city() !== 'all') list = list.filter(s => s.city === this.city());
    switch (this.sort()) {
      case 'Newest': return [...list].sort((a, b) => a.day - b.day);
      case 'Most followed': return [...list].sort((a, b) => b.followers - a.followers);
      default: return [...list].sort((a, b) => b.supporters - a.supporters);
    }
  });

  readonly founders = computed(() =>
    this.store.people().filter(p => p.role === 'founder' && this.match(p.name, p.title, p.city, p.bio, ...p.skills)));

  readonly experts = computed(() =>
    this.store.experts().filter(e => {
      const p = this.store.person(e.personId);
      return this.match(p?.name, p?.title, e.headline, ...e.categories, ...e.industries);
    }));

  readonly incubators = computed(() =>
    this.store.incubators().filter(i => this.match(i.name, i.city, i.about, ...i.focus)));

  readonly campaigns = computed(() =>
    this.store.campaigns().filter(c => {
      const s = this.store.startup(c.startupId);
      return c.status !== 'upcoming' && this.match(c.headline, c.pitch, s?.name, s?.industry);
    }));

  readonly videos = computed(() =>
    this.store.videos().filter(v => {
      const s = this.store.startup(v.startupId);
      return this.match(v.title, s?.name, s?.industry);
    }));

  readonly challenges = computed(() =>
    this.store.challenges().filter(c => this.match(c.title, c.subtitle, c.reward)));

  count(key: string): number {
    switch (key) {
      case 'startups': return this.startups().length;
      case 'founders': return this.founders().length;
      case 'experts': return this.experts().length;
      case 'incubators': return this.incubators().length;
      case 'campaigns': return this.campaigns().length;
      case 'videos': return this.videos().length;
      default: return this.challenges().length;
    }
  }

  name = (id: string) => this.store.person(id)?.name ?? '';
  openStory(index: number): void { this.viewer.show(this.store.stories(), index); }
}
