import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PostType } from '../core/models';
import { Store } from '../core/store';
import { CARDS } from '../feed/cards';
import { Composer } from '../feed/composer';
import { PostCard } from '../feed/post-card';
import { StoriesBar } from '../feed/stories-bar';
import { fmt, UI } from '../ui/ui';

const FILTERS: { key: string; label: string; types?: PostType[] }[] = [
  { key: 'all', label: 'Everything' },
  { key: 'build', label: '🛠️ Building', types: ['build', 'progress'] },
  { key: 'ask', label: '❓ Validation', types: ['question', 'help'] },
  { key: 'real', label: '💥 Failures', types: ['failure'] },
  { key: 'wins', label: '🏆 Wins', types: ['achievement', 'funding'] },
  { key: 'learn', label: '📚 Playbooks', types: ['educational'] },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, UI, CARDS, PostCard, StoriesBar, Composer],
  template: `
    <div class="page">
      <div class="feed-layout">
        <!-- ------------- feed column ------------- -->
        <div class="feed-col col g-16">
          <app-stories-bar />
          <app-composer />

          <div class="row g-6 scroll-x">
            @for (f of filters; track f.key) {
              <button class="chip chip--sm" [class.chip--on]="filter() === f.key" (click)="filter.set(f.key)">
                {{ f.label }}
              </button>
            }
          </div>

          <!-- mobile guidance card: the rail is hidden on small screens -->
          <div class="mobile-only"><app-next-steps /></div>

          @for (p of posts(); track p.id) {
            <app-post-card [post]="p" />
          }

          @if (!posts().length) {
            <app-empty icon="compass" title="Nothing in this filter yet"
              text="Switch filter, or follow a few founders in Discover to fill your feed.">
              <a class="btn btn--primary btn--sm" routerLink="/discover">Discover founders</a>
            </app-empty>
          }

          <div class="center tiny faint" style="padding:12px 0 0">
            You have reached the end of today's journeys · {{ posts().length }} updates
          </div>
        </div>

        <!-- ------------- right rail ------------- -->
        <aside class="rail">
          <app-next-steps />

          @if (store.activeStartup(); as s) {
            <div class="card">
              <div class="card__head">
                <div class="row g-8">
                  <app-av [name]="s.name" [emoji]="s.emoji" [gradient]="s.gradient" [size]="30" [square]="true" />
                  <h4>{{ s.name }}</h4>
                </div>
                <span class="day-pill">Day {{ s.day }}</span>
              </div>
              <div class="card__body col g-12">
                <app-stages [stages]="s.stages" [labels]="false" />
                <div class="row between">
                  @for (k of s.kpis.slice(0, 3); track k.label) {
                    <div class="stat">
                      <span class="stat__v">{{ k.value }}</span>
                      <span class="stat__l">{{ k.label }}</span>
                      @if (k.delta) { <span class="stat__d seed-text">{{ k.delta }}</span> }
                    </div>
                  }
                </div>
                <div class="row g-8">
                  <a class="btn btn--sm grow" [routerLink]="['/s', s.slug]">Startup page</a>
                  <a class="btn btn--primary btn--sm grow" routerLink="/build">Build workspace</a>
                </div>
              </div>
            </div>
          }

          <div class="card">
            <div class="card__head"><h4>Trending in Tunisia</h4><a class="link tiny" routerLink="/discover">See all</a></div>
            <div class="card__body" style="padding:6px 14px 12px">
              @for (s of store.trendingStartups(); track s.id) {
                <app-startup-row [s]="s" />
              }
            </div>
          </div>

          @if (store.liveCampaigns()[0]; as c) {
            <div class="card card--seed-tint">
              <div class="card__head" style="border-bottom:0">
                <h4>Community round closing</h4>
                <span class="tag tag--amber">{{ c.daysLeft }}d left</span>
              </div>
              <div class="col g-10" style="padding:0 16px 16px">
                <div class="row g-10">
                  <app-av [name]="store.startup(c.startupId)?.name ?? ''"
                    [emoji]="store.startup(c.startupId)?.emoji ?? ''"
                    [gradient]="store.startup(c.startupId)?.gradient ?? ''" [size]="34" [square]="true" />
                  <div class="grow">
                    <div class="sm b">{{ store.startup(c.startupId)?.name }}</div>
                    <div class="tiny faint">{{ c.backers }} supporters · {{ store.startup(c.startupId)?.city }}</div>
                  </div>
                </div>
                <app-bar [pct]="pct(c.raised, c.goal)" tone="amber" />
                <div class="row between tiny">
                  <span class="b">{{ fmt.money(c.raised, c.currency) }}</span>
                  <span class="faint">{{ pct(c.raised, c.goal) }}% of {{ fmt.n(c.goal) }}</span>
                </div>
                <a class="btn btn--seed btn--sm btn--block" [routerLink]="['/fund', c.id]">See the journey behind it</a>
                <span class="mock-note"><app-icon name="lock" [size]="11" /> Funding is simulated in this demo</span>
              </div>
            </div>
          }

          <div class="card">
            <div class="card__head"><h4>Founders to follow</h4></div>
            <div class="card__body" style="padding:6px 14px 12px">
              @for (p of suggested(); track p.id) {
                <div class="hl-row">
                  <a [routerLink]="['/u', p.handle]"><app-av [name]="p.name" [size]="34" [verified]="p.verified" /></a>
                  <span class="grow" style="min-width:0">
                    <a class="sm b hoverline" [routerLink]="['/u', p.handle]">{{ p.name }}</a>
                    <span class="tiny faint" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ p.title }}</span>
                  </span>
                  <button class="btn btn--xs" (click)="store.toggleFollow(p.id, p.name)">
                    @if (store.isFollowing(p.id)) { ✓ } @else { Follow }
                  </button>
                </div>
              }
            </div>
          </div>

          @if (challenge(); as c) {
            <div class="card card--hover" style="overflow:hidden">
              <app-media [emoji]="c.emoji" [caption]="c.title" [gradient]="c.gradient" ratio="21x9" [radius]="0" />
              <div class="col g-8 pad-sm">
                <span class="up faint">Active challenge</span>
                <span class="sm b">{{ c.title }}</span>
                <div class="row between tiny faint">
                  <span>{{ fmt.n(c.participants) }} founders · {{ c.daysLeft }} days left</span>
                  <a class="link" [routerLink]="['/challenges', c.slug]">Leaderboard</a>
                </div>
              </div>
            </div>
          }

          <div class="card">
            <div class="card__head"><h4>Experts near your stage</h4><a class="link tiny" routerLink="/experts">All</a></div>
            <div class="card__body" style="padding:6px 14px 12px">
              @for (e of store.experts().slice(0, 3); track e.id) {
                <div class="hl-row">
                  <app-av [name]="store.person(e.personId)?.name ?? ''" [gradient]="e.gradient" [size]="34" [verified]="true" />
                  <span class="grow" style="min-width:0">
                    <a class="sm b hoverline" [routerLink]="['/experts', e.id]">{{ store.person(e.personId)?.name }}</a>
                    <span class="tiny faint" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ e.categories.join(' · ') }}</span>
                  </span>
                  <span class="tiny b nowrap">{{ e.price30 }} TND</span>
                </div>
              }
            </div>
          </div>

          <div class="tiny faint center" style="padding:0 8px 20px">
            Nawa demo · fictional founders, startups and numbers.<br />No real payments, no real accounts.
          </div>
        </aside>
      </div>
    </div>
  `,
})
export class Home {
  readonly store = inject(Store);
  readonly fmt = fmt;
  readonly filters = FILTERS;
  readonly filter = signal('all');

  readonly posts = computed(() => {
    const f = FILTERS.find(x => x.key === this.filter());
    const all = this.store.feed();
    return f?.types ? all.filter(p => f.types!.includes(p.type)) : all;
  });

  readonly suggested = computed(() =>
    this.store.people()
      .filter(p => p.role === 'founder' && p.id !== 'u_me' && !this.store.isFollowing(p.id))
      .slice(0, 4));

  readonly challenge = computed(() => this.store.challenges().find(c => c.joined) ?? this.store.challenges()[0]);

  pct = (a: number, b: number) => fmt.pct(a, b);
}
