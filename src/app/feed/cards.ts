import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Campaign, Challenge, ExpertProfile, Incubator, Person, Startup, Video } from '../core/models';
import { Store } from '../core/store';
import { fmt, UI } from '../ui/ui';

/* ------------------------------------------------------------ startup card */
@Component({
  selector: 'app-startup-card',
  standalone: true,
  imports: [RouterLink, UI],
  template: `
    @if (s(); as s) {
      <div class="card card--hover col" style="overflow:hidden">
        <a [routerLink]="['/s', s.slug]" style="display:block">
          <div style="height:64px;position:relative" [style.background]="s.gradient">
            <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px);background-size:22px 22px"></div>
            <span class="tag tag--ink" style="position:absolute;top:10px;right:10px;background:rgba(10,10,18,.5);backdrop-filter:blur(6px);color:#fff">
              Day {{ s.day }}
            </span>
          </div>
        </a>
        <div class="col g-10" style="padding:0 14px 14px;margin-top:-20px">
          <app-av [name]="s.name" [emoji]="s.emoji" [gradient]="s.gradient" [size]="44" [square]="true"
            style="box-shadow:0 0 0 3px var(--surface)" />
          <div>
            <a class="row g-6 hoverline" [routerLink]="['/s', s.slug]">
              <span class="bb" style="font-family:var(--display);font-size:15.5px">{{ s.name }}</span>
            </a>
            <div class="tiny muted clamp-2" style="margin-top:2px">{{ s.tagline }}</div>
          </div>
          <div class="row g-6" style="flex-wrap:wrap">
            <span class="tag tag--brand">{{ s.industry }}</span>
            <span class="tag"><app-icon name="pin" [size]="11" /> {{ s.city }}</span>
          </div>
          <app-stages [stages]="s.stages" [labels]="false" />
          <div class="row between tiny faint">
            <span><b class="num" style="color:var(--ink-2)">{{ fmt.k(s.followers) }}</b> followers</span>
            <span><b class="num" style="color:var(--ink-2)">{{ s.supporters }}</b> supporters</span>
          </div>
          @if (campaign(); as c) {
            <div class="col g-4">
              <app-bar [pct]="pct(c)" tone="amber" [thin]="true" />
              <div class="row between tiny">
                <span class="b amber-text">{{ pct(c) }}% funded</span>
                <span class="faint">{{ fmt.money(c.goal, c.currency) }} goal</span>
              </div>
            </div>
          }
          <button class="btn btn--sm btn--block" (click)="store.toggleFollow(s.id, s.name)">
            @if (store.isFollowing(s.id)) { Following } @else { <app-icon name="plus" [size]="14" /> Follow journey }
          </button>
        </div>
      </div>
    }
  `,
})
export class StartupCard {
  readonly s = input.required<Startup>();
  readonly store = inject(Store);
  readonly fmt = fmt;
  readonly campaign = computed(() => this.store.campaignOf(this.s().id));
  pct = (c: Campaign) => fmt.pct(c.raised, c.goal);
}

/* ------------------------------------------------------------ compact startup row */
@Component({
  selector: 'app-startup-row',
  standalone: true,
  imports: [RouterLink, UI],
  template: `
    @if (s(); as s) {
      <a class="hl-row" [routerLink]="['/s', s.slug]">
        <app-av [name]="s.name" [emoji]="s.emoji" [gradient]="s.gradient" [size]="36" [square]="true" />
        <span class="grow" style="min-width:0">
          <span class="row g-6">
            <span class="sm b">{{ s.name }}</span>
            <span class="tiny faint">Day {{ s.day }}</span>
          </span>
          <span class="tiny muted" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ s.tagline }}</span>
        </span>
        <span class="tiny faint num nowrap">{{ fmt.k(s.followers) }} <app-icon name="users" [size]="11" style="display:inline" /></span>
      </a>
    }
  `,
})
export class StartupRow {
  readonly s = input.required<Startup>();
  readonly fmt = fmt;
}

/* ------------------------------------------------------------ campaign card */
@Component({
  selector: 'app-campaign-card',
  standalone: true,
  imports: [RouterLink, UI],
  template: `
    @if (c(); as c) {
      <div class="card card--hover col" style="overflow:hidden">
        <a [routerLink]="['/fund', c.id]">
          <app-media [emoji]="startup()?.emoji ?? '🚀'" [caption]="c.headline"
            [gradient]="startup()?.gradient ?? ''" ratio="16x9" [radius]="0"
            [tag]="c.status === 'live' ? c.daysLeft + ' days left' : c.status === 'funded' ? 'Funded' : 'Coming soon'" />
        </a>
        <div class="col g-10 pad-sm">
          <div class="row g-8">
            <app-av [name]="founder()?.name ?? ''" [size]="26" [verified]="founder()?.verified ?? false" />
            <span class="tiny muted grow">{{ founder()?.name }} · Day {{ startup()?.day }} in public</span>
            @if (c.trending) { <span class="tag tag--rose">🔥 Trending</span> }
          </div>
          <a class="b hoverline" [routerLink]="['/fund', c.id]" style="font-size:14.5px;line-height:1.35">{{ startup()?.name }} — {{ c.headline }}</a>
          <app-bar [pct]="pct()" [tone]="c.status === 'funded' ? 'seed' : 'amber'" />
          <div class="row between">
            <span class="sm b">{{ fmt.money(c.raised, c.currency) }}</span>
            <span class="sm faint">of {{ fmt.n(c.goal) }} · {{ pct() }}%</span>
          </div>
          <div class="row g-10 tiny faint">
            <span><app-icon name="users" [size]="12" style="display:inline" /> {{ c.backers }} backers</span>
            <span class="dot-sep"></span>
            <span>{{ startup()?.city }}</span>
            <span class="dot-sep"></span>
            <span>{{ startup()?.industry }}</span>
          </div>
        </div>
      </div>
    }
  `,
})
export class CampaignCard {
  readonly c = input.required<Campaign>();
  private store = inject(Store);
  readonly fmt = fmt;
  readonly startup = computed(() => this.store.startup(this.c().startupId));
  readonly founder = computed(() => {
    const s = this.startup();
    return s ? this.store.person(s.founderId) : undefined;
  });
  readonly pct = computed(() => fmt.pct(this.c().raised, this.c().goal));
}

/* ------------------------------------------------------------ expert card */
@Component({
  selector: 'app-expert-card',
  standalone: true,
  imports: [RouterLink, UI],
  template: `
    @if (e(); as e) {
      <div class="card card--hover col g-12 pad">
        <div class="row g-11" style="align-items:flex-start;gap:11px">
          <app-av [name]="p()?.name ?? ''" [size]="46" [verified]="true" [gradient]="e.gradient" />
          <div class="grow">
            <a class="b hoverline" [routerLink]="['/experts', e.id]">{{ p()?.name }}</a>
            <div class="tiny muted clamp-2">{{ e.headline }}</div>
            <div class="row g-6 tiny faint mt-4">
              <span class="b amber-text">★ {{ e.rating }}</span>
              <span>({{ e.reviews }})</span>
              <span class="dot-sep"></span>
              <span>{{ e.sessions }} sessions</span>
            </div>
          </div>
        </div>
        <div class="row g-6" style="flex-wrap:wrap">
          @for (c of e.categories; track c) { <span class="tag tag--brand">{{ c }}</span> }
          <span class="tag">{{ p()?.city }}</span>
        </div>
        <div class="divider"></div>
        <div class="row between">
          <span class="tiny faint">from <b class="num" style="color:var(--ink);font-size:13px">{{ e.price30 }} TND</b> / 30 min</span>
          <a class="btn btn--sm btn--outline-brand" [routerLink]="['/experts', e.id]">Book</a>
        </div>
      </div>
    }
  `,
})
export class ExpertCard {
  readonly e = input.required<ExpertProfile>();
  private store = inject(Store);
  readonly p = computed(() => this.store.person(this.e().personId));
}

/* ------------------------------------------------------------ person card */
@Component({
  selector: 'app-person-card',
  standalone: true,
  imports: [RouterLink, UI],
  template: `
    @if (p(); as p) {
      <div class="card card--hover col g-12 pad center" style="align-items:center">
        <app-av [name]="p.name" [size]="56" [verified]="p.verified" />
        <div>
          <a class="b hoverline" [routerLink]="['/u', p.handle]">{{ p.name }}</a>
          <div class="tiny muted clamp-2">{{ p.title }}</div>
          <div class="tiny faint mt-4">{{ p.city }}, {{ p.country }}</div>
        </div>
        <div class="row g-14">
          <div class="center">
            <div class="b num">{{ p.founderScore }}</div>
            <div class="tiny faint">Score</div>
          </div>
          <div class="center">
            <div class="b num">{{ fmt.k(p.followers) }}</div>
            <div class="tiny faint">Followers</div>
          </div>
          <div class="center">
            <div class="b num">{{ p.daysBuilding }}</div>
            <div class="tiny faint">Days</div>
          </div>
        </div>
        <button class="btn btn--sm btn--block" (click)="store.toggleFollow(p.id, p.name)">
          @if (store.isFollowing(p.id)) { Following } @else { <app-icon name="plus" [size]="14" /> Follow }
        </button>
      </div>
    }
  `,
})
export class PersonCard {
  readonly p = input.required<Person>();
  readonly store = inject(Store);
  readonly fmt = fmt;
}

/* ------------------------------------------------------------ challenge card */
@Component({
  selector: 'app-challenge-card',
  standalone: true,
  imports: [RouterLink, UI],
  template: `
    @if (c(); as c) {
      <div class="card card--hover col" style="overflow:hidden">
        <a [routerLink]="['/challenges', c.slug]">
          <app-media [emoji]="c.emoji" [caption]="c.window" [gradient]="c.gradient" ratio="21x9" [radius]="0"
            [tag]="c.daysLeft + ' days left'" />
        </a>
        <div class="col g-10 pad-sm">
          <a class="b hoverline" [routerLink]="['/challenges', c.slug]">{{ c.title }}</a>
          <div class="tiny muted clamp-2">{{ c.subtitle }}</div>
          <div class="row between">
            <span class="tiny faint"><app-icon name="users" [size]="12" style="display:inline" /> {{ fmt.n(c.participants) }} founders</span>
            <button class="btn btn--xs" [class.btn--seed]="!store.isJoined(c.id)" (click)="store.toggleChallenge(c.id)">
              @if (store.isJoined(c.id)) { Joined ✓ } @else { Join }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ChallengeCard {
  readonly c = input.required<Challenge>();
  readonly store = inject(Store);
  readonly fmt = fmt;
}

/* ------------------------------------------------------------ video card */
@Component({
  selector: 'app-video-card',
  standalone: true,
  imports: [UI],
  template: `
    @if (v(); as v) {
      <div class="reel" (click)="clicked()">
        <app-media [emoji]="v.emoji" [caption]="''" [gradient]="v.gradient" ratio="9x16"
          [play]="true" [duration]="v.duration" />
        <div class="reel__grad"></div>
        <div class="reel__body">
          <div class="row g-6" style="margin-bottom:5px">
            <app-av [name]="author()?.name ?? ''" [size]="22" />
            <span class="tiny b" style="color:#fff">{{ author()?.name }}</span>
          </div>
          <div class="sm b clamp-2" style="color:#fff;line-height:1.35">{{ v.title }}</div>
          @if (v.milestone) {
            <span class="tag" style="background:rgba(255,255,255,.2);color:#fff;margin-top:6px">🏁 {{ v.milestone }}</span>
          }
          <div class="row g-10 tiny" style="color:rgba(255,255,255,.72);margin-top:6px">
            <span>{{ fmt.k(v.views) }} views</span>
            <span>🚀 {{ fmt.k(v.supports) }}</span>
          </div>
        </div>
      </div>
    }
  `,
})
export class VideoCard {
  readonly v = input.required<Video>();
  private store = inject(Store);
  readonly fmt = fmt;
  readonly author = computed(() => this.store.person(this.v().authorId));
  clicked(): void {
    this.store.toast('Video playback is mocked in this demo', '🎬');
  }
}

/* ------------------------------------------------------------ incubator card */
@Component({
  selector: 'app-incubator-card',
  standalone: true,
  imports: [RouterLink, UI],
  template: `
    @if (i(); as i) {
      <div class="card card--hover col g-12 pad">
        <div class="row g-12">
          <app-av [name]="i.logoText" [gradient]="i.gradient" [size]="48" [square]="true" />
          <div class="grow">
            <a class="b hoverline" [routerLink]="['/incubators', i.slug]">{{ i.name }}</a>
            <div class="tiny faint">{{ i.city }}, {{ i.country }}</div>
          </div>
          @if (i.openCall) { <span class="tag tag--seed">Open call</span> }
        </div>
        <div class="tiny muted clamp-3">{{ i.about }}</div>
        <div class="row g-6" style="flex-wrap:wrap">
          @for (f of i.focus.slice(0, 3); track f) { <span class="tag tag--brand">{{ f }}</span> }
        </div>
        <div class="divider"></div>
        <div class="row between tiny faint">
          <span>{{ i.cohorts.length }} cohorts · {{ startupCount() }} startups</span>
          <a class="link" [routerLink]="['/incubators', i.slug]">Open portal →</a>
        </div>
      </div>
    }
  `,
})
export class IncubatorCard {
  readonly i = input.required<Incubator>();
  readonly startupCount = computed(() =>
    this.i().cohorts.reduce((n, c) => n + c.startupIds.length, 0));
}

/* ------------------------------------------------------------ next steps (guidance) */
@Component({
  selector: 'app-next-steps',
  standalone: true,
  imports: [RouterLink, UI],
  template: `
    <div class="card card--tint">
      <div class="card__head" style="border-bottom:0;padding-bottom:6px">
        <div class="row g-8">
          <app-icon name="target" [size]="17" class="brand-text" />
          <h4>What's your next step?</h4>
        </div>
        <span class="tiny faint">Day {{ store.activeStartup().day }}</span>
      </div>
      <div class="col g-10" style="padding:6px 16px 16px">
        @for (n of store.nextSteps(); track n.title; let i = $index) {
          <div class="step" [class.step--first]="i === 0">
            <div class="row g-8">
              <span style="font-size:16px">{{ n.emoji }}</span>
              <span class="sm b grow">{{ n.title }}</span>
            </div>
            <div class="tiny muted" style="margin:4px 0 8px">{{ n.why }}</div>
            <a class="btn btn--xs" [class.btn--primary]="i === 0" [routerLink]="n.route">
              {{ n.cta }} <app-icon name="arrowR" [size]="12" />
            </a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .step { background: var(--surface); border: 1px solid var(--line); border-radius: 11px; padding: 11px 12px; }
    .step--first { border-color: var(--brand-300); box-shadow: 0 0 0 3px var(--brand-50); }
  `],
})
export class NextSteps {
  readonly store = inject(Store);
}

export const CARDS = [
  StartupCard, StartupRow, CampaignCard, ExpertCard, PersonCard,
  ChallengeCard, VideoCard, IncubatorCard, NextSteps,
] as const;
