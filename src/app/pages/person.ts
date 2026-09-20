import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '../core/store';
import { CARDS } from '../feed/cards';
import { PostCard } from '../feed/post-card';
import { fmt, UI } from '../ui/ui';

@Component({
  selector: 'app-person-page',
  standalone: true,
  imports: [RouterLink, UI, CARDS, PostCard],
  template: `
    @if (p(); as p) {
      <div class="page page--narrow">
        <div class="card card--lg" style="overflow:hidden">
          <div class="cover"></div>
          <div class="pad-lg col g-16" style="margin-top:-42px">
            <div class="row between wrap g-16" style="align-items:flex-end">
              <div class="row g-14" style="align-items:flex-end">
                <app-av [name]="p.name" [size]="88" [verified]="p.verified" style="box-shadow:0 0 0 4px var(--surface)" />
                <div>
                  <h1 style="font-size:26px">{{ p.name }}</h1>
                  <div class="muted sm">{{ p.title }}</div>
                  <div class="row g-8 tiny faint mt-4">
                    <span><app-icon name="pin" [size]="11" style="display:inline" /> {{ p.city }}, {{ p.country }}</span>
                    <span class="dot-sep"></span>
                    <span>&#64;{{ p.handle }}</span>
                    <span class="dot-sep"></span>
                    <span>Joined {{ p.joined }}</span>
                  </div>
                </div>
              </div>
              <div class="row g-8">
                @if (isMe()) {
                  <a class="btn btn--primary" routerLink="/build"><app-icon name="rocket" [size]="15" /> Build workspace</a>
                  <button class="btn" (click)="store.toast('Profile editing is out of scope for this demo', '✏️')">
                    <app-icon name="edit" [size]="15" /> Edit profile
                  </button>
                } @else {
                  <button class="btn btn--primary" (click)="store.toggleFollow(p.id, p.name)">
                    @if (store.isFollowing(p.id)) { Following ✓ } @else { <app-icon name="plus" [size]="15" /> Follow }
                  </button>
                  <a class="btn" routerLink="/messages"><app-icon name="message" [size]="15" /> Message</a>
                  @if (expert(); as e) {
                    <a class="btn btn--outline-brand" [routerLink]="['/experts', e.id]"><app-icon name="cap" [size]="15" /> Book session</a>
                  }
                }
              </div>
            </div>

            <p class="sm">{{ p.bio }}</p>

            <div class="row g-6 wrap">
              @for (s of p.skills; track s) { <span class="tag">{{ s }}</span> }
            </div>

            @if (p.looking) {
              <div class="panel panel--amber row-t g-10">
                <span style="font-size:16px">🔎</span>
                <span class="sm"><b>Looking for:</b> {{ p.looking }}</span>
              </div>
            }

            <div class="divider"></div>

            <div class="row between wrap g-16">
              <div class="row g-14" style="align-items:center">
                <app-score-ring [value]="score()" [size]="86" caption="Founder Score" />
                <div class="col g-4" style="max-width:280px">
                  <span class="b sm">Reputation, not popularity</span>
                  <span class="tiny muted">
                    Built from consistency, completed milestones, verified achievements, community contribution,
                    expert endorsements and traction — not follower count.
                  </span>
                </div>
              </div>
              <div class="row g-20 wrap">
                <div class="stat"><span class="stat__v">{{ fmt.k(p.followers) }}</span><span class="stat__l">followers</span></div>
                <div class="stat"><span class="stat__v">{{ fmt.k(p.following) }}</span><span class="stat__l">following</span></div>
                <div class="stat"><span class="stat__v">{{ p.daysBuilding }}</span><span class="stat__l">days in public</span></div>
                <div class="stat"><span class="stat__v">{{ startups().length }}</span><span class="stat__l">startups</span></div>
              </div>
            </div>
          </div>

          <div class="tabs" style="padding:0 12px">
            @for (t of tabs; track t.key) {
              <button class="tab" [class.on]="tab() === t.key" (click)="tab.set(t.key)">{{ t.label }}</button>
            }
          </div>
        </div>

        <!-- ---------- overview ---------- -->
        @if (tab() === 'overview') {
          <div class="col g-16 mt-16">
            @if (startups().length) {
              <div class="col g-12">
                <div class="row between"><h4>Building right now</h4>
                  @if (isMe()) { <a class="link tiny" routerLink="/build">Open workspace →</a> }
                </div>
                <div class="grid grid-2">
                  @for (s of startups(); track s.id) { <app-startup-card [s]="s" /> }
                </div>
              </div>
            }

            <div class="card">
              <div class="card__head"><h4>How this score is built</h4><span class="tag tag--brand">Demo metric</span></div>
              <div class="card__body col g-14">
                @for (f of factors(); track f.label) {
                  <div class="col g-4">
                    <div class="row between">
                      <span class="sm b">{{ f.label }}</span>
                      <span class="tiny mono faint">{{ f.value }} / {{ f.max }}</span>
                    </div>
                    <app-bar [pct]="pct(f.value, f.max)" [tone]="f.value / f.max > 0.75 ? 'seed' : 'brand'" [thin]="true" />
                    <span class="tiny faint">{{ f.hint }}</span>
                  </div>
                }
                @if (isMe() && store.scoreEvents().length) {
                  <div class="divider"></div>
                  <span class="up faint">Recent points in this session</span>
                  @for (e of store.scoreEvents().slice(0, 5); track $index) {
                    <div class="row between tiny">
                      <span class="muted">{{ e.label }}</span>
                      <span class="b seed-text">+{{ e.points }}</span>
                    </div>
                  }
                }
              </div>
            </div>

            @if (journey().length) {
              <div class="card">
                <div class="card__head"><h4>Public journey</h4><span class="tiny faint">{{ p.daysBuilding }} days</span></div>
                <div class="card__body">
                  <div class="jstrip">
                    @for (n of journey(); track n.day) {
                      <div class="jnode" [class.done]="n.status === 'done'" [class.now]="n.status === 'now'">
                        <div class="jnode__dot">
                          @if (n.status === 'done') { <app-icon name="check" [size]="10" [weight]="3.4" /> }
                        </div>
                        <div class="tiny b" style="margin-top:8px">Day {{ n.day }}</div>
                        <div class="tiny muted">{{ n.emoji }} {{ n.label }}</div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }

            <div class="grid grid-2">
              <div class="card">
                <div class="card__head"><h4>Achievements</h4></div>
                <div class="card__body col g-10">
                  @for (a of p.achievements; track a.label) {
                    <div class="row-t g-10">
                      <span style="font-size:18px">{{ a.emoji }}</span>
                      <span class="grow">
                        <span class="row g-6">
                          <span class="sm b">{{ a.label }}</span>
                          @if (a.verified) { <span class="tag tag--seed">verified</span> }
                        </span>
                        @if (a.detail) { <span class="tiny muted">{{ a.detail }}</span> }
                      </span>
                    </div>
                  }
                  @if (!p.achievements.length) { <span class="tiny faint">No achievements recorded yet.</span> }
                </div>
              </div>

              <div class="card">
                <div class="card__head"><h4>Credibility signals</h4></div>
                <div class="card__body col g-12">
                  @if (endorsements().length) {
                    @for (e of endorsements(); track e.expertId) {
                      <div class="row-t g-10">
                        <app-av [name]="store.person(e.expertId)?.name ?? ''" [size]="32" [verified]="true" />
                        <span class="grow">
                          <span class="sm b">{{ store.person(e.expertId)?.name }}</span>
                          <span class="tiny muted" style="display:block">“{{ e.quote }}”</span>
                        </span>
                      </div>
                    }
                  } @else {
                    <span class="tiny faint">No expert endorsements yet — one session is usually enough to earn the first.</span>
                  }
                  @if (p.previously?.length) {
                    <div class="divider"></div>
                    <span class="up faint">Previously</span>
                    @for (x of p.previously ?? []; track x) {
                      <span class="sm row g-8"><app-icon name="briefcase" [size]="13" class="faint" /> {{ x }}</span>
                    }
                  }
                </div>
              </div>
            </div>
          </div>
        }

        <!-- ---------- updates ---------- -->
        @if (tab() === 'updates') {
          <div class="col g-16 mt-16" style="max-width:640px;margin-inline:auto">
            @if (posts().length) {
              @for (post of posts(); track post.id) { <app-post-card [post]="post" /> }
            } @else {
              <app-empty icon="edit" title="Nothing published yet"
                text="This founder has not shared a public update in the demo dataset." />
            }
          </div>
        }

        <!-- ---------- about ---------- -->
        @if (tab() === 'about') {
          <div class="col g-16 mt-16">
            <div class="card col g-14 pad-lg">
              <div>
                <span class="up faint">Bio</span>
                <p class="sm mt-4">{{ p.bio }}</p>
              </div>
              <div class="divider"></div>
              <div class="grid grid-2">
                <div><span class="up faint">Role</span><p class="sm mt-4">{{ p.role }}</p></div>
                <div><span class="up faint">Based in</span><p class="sm mt-4">{{ p.city }}, {{ p.country }}</p></div>
                <div><span class="up faint">Skills</span><p class="sm mt-4">{{ p.skills.join(' · ') }}</p></div>
                <div><span class="up faint">On Nawa since</span><p class="sm mt-4">{{ p.joined }}</p></div>
              </div>
              @if (expert(); as e) {
                <div class="divider"></div>
                <div class="row between wrap g-12">
                  <div>
                    <span class="up faint">Expert practice</span>
                    <p class="sm mt-4">{{ e.headline }} · {{ e.sessions }} sessions · ★ {{ e.rating }}</p>
                  </div>
                  <a class="btn btn--outline-brand btn--sm" [routerLink]="['/experts', e.id]">See availability</a>
                </div>
              }
            </div>
          </div>
        }
      </div>
    } @else {
      <div class="page">
        <app-empty icon="user" title="Profile not found" text="Try browsing founders in Discover instead.">
          <a class="btn btn--primary btn--sm" routerLink="/discover">Discover founders</a>
        </app-empty>
      </div>
    }
  `,
})
export class PersonPage {
  readonly store = inject(Store);
  private route = inject(ActivatedRoute);
  readonly fmt = fmt;

  private params = toSignal(this.route.paramMap);
  readonly tab = signal('overview');
  readonly tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'updates', label: 'Updates' },
    { key: 'about', label: 'About' },
  ];

  readonly p = computed(() => {
    const handle = this.params()?.get('handle');
    return handle ? this.store.personByHandle(handle) : this.store.me();
  });
  readonly isMe = computed(() => this.p()?.id === 'u_me');
  readonly score = computed(() => (this.isMe() ? this.store.myScore() : this.p()?.founderScore ?? 0));
  readonly factors = computed(() => this.p()?.scoreFactors ?? []);
  readonly startups = computed(() => {
    const p = this.p();
    return p ? this.store.startups().filter(s => s.founderId === p.id) : [];
  });
  readonly journey = computed(() => this.startups()[0]?.journey ?? []);
  readonly endorsements = computed(() => this.startups().flatMap(s => s.endorsements));
  readonly posts = computed(() => {
    const p = this.p();
    return p ? this.store.postsBy(p.id) : [];
  });
  readonly expert = computed(() => {
    const p = this.p();
    return p ? this.store.expertByPerson(p.id) : undefined;
  });

  pct = (a: number, b: number) => fmt.pct(a, b);
}
