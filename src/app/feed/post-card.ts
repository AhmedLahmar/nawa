import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Post, PostType } from '../core/models';
import { Store } from '../core/store';
import { fmt, UI } from '../ui/ui';

const TYPE_META: Record<PostType, { label: string; tag: string; icon: string }> = {
  progress: { label: 'Progress', tag: 'tag--brand', icon: 'trending' },
  build: { label: 'Build in Public', tag: 'tag--ink', icon: 'rocket' },
  question: { label: 'Validation', tag: 'tag--sky', icon: 'help' },
  failure: { label: 'Failure & lesson', tag: 'tag--rose', icon: 'alert' },
  achievement: { label: 'Achievement', tag: 'tag--seed', icon: 'award' },
  help: { label: 'Help wanted', tag: 'tag--amber', icon: 'users' },
  funding: { label: 'Funding', tag: 'tag--seed', icon: 'dollar' },
  educational: { label: 'Playbook', tag: 'tag--outline', icon: 'book' },
};

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [RouterLink, FormsModule, UI],
  template: `
    <article class="post fade-up">
      @if (post().reason) {
        <div class="row g-6 tiny faint" style="padding:9px 16px 0">
          <app-icon name="sparkles" [size]="12" /> {{ post().reason }}
        </div>
      }

      <!-- head -->
      <header class="post__head">
        <a [routerLink]="['/u', author()?.handle]">
          <app-av [name]="author()?.name ?? ''" [size]="42" [verified]="author()?.verified ?? false" />
        </a>
        <div class="grow">
          <div class="row g-6" style="flex-wrap:wrap;row-gap:2px">
            <a class="b hoverline" [routerLink]="['/u', author()?.handle]">{{ author()?.name }}</a>
            @if (startup(); as s) {
              <span class="faint tiny">·</span>
              <a class="tiny b brand-text hoverline" [routerLink]="['/s', s.slug]">{{ s.emoji }} {{ s.name }}</a>
            }
          </div>
          <div class="row g-6 tiny faint">
            <span>{{ author()?.title }}</span>
            <span class="dot-sep"></span>
            <span>{{ post().at }} ago</span>
            @if (post().day) {
              <span class="dot-sep"></span>
              <span class="b" style="color:var(--ink-2)">Day {{ post().day }}</span>
            }
          </div>
        </div>
        <span class="post__type" [class]="meta().tag">
          <app-icon [name]="meta().icon" [size]="12" /> {{ meta().label }}
        </span>
      </header>

      <!-- body -->
      <div class="post__body col g-12">
        <div class="post__text">{{ post().text }}</div>

        @if (post().milestone; as m) {
          <div class="panel panel--brand col g-6">
            <div class="row between tiny">
              <span class="b brand-text">🎯 {{ m.label }}</span>
              <span class="mono b brand-text">{{ m.pct }}%</span>
            </div>
            <app-bar [pct]="m.pct" tone="brand" [thin]="true" />
          </div>
        }

        @if (post().kpiChip; as k) {
          <div class="row g-8">
            <span class="tag tag--seed"><app-icon name="trending" [size]="12" /> {{ k.label }} {{ k.value }}</span>
            @if (startup(); as s) {
              <a class="tag tag--outline hoverline" [routerLink]="['/s', s.slug]">See all KPIs</a>
            }
          </div>
        }

        @if (post().ask; as ask) {
          <div class="panel col g-8">
            <span class="up faint">What I need</span>
            @for (a of ask; track a.label) {
              <div class="row between sm">
                <span class="muted">{{ a.label }}</span>
                <span class="b">{{ a.value }}</span>
              </div>
            }
          </div>
        }

        @if (post().poll; as poll) {
          <div class="panel col g-8">
            <span class="sm b">{{ poll.question }}</span>
            @for (o of poll.options; track o.label; let i = $index) {
              <button class="poll" [class.poll--on]="vote() === i" (click)="castVote(i)">
                <span class="poll__fill" [style.width.%]="share(i)"></span>
                <span class="poll__t row between">
                  <span class="row g-6">
                    @if (vote() === i) { <app-icon name="check" [size]="12" [weight]="3" /> }
                    {{ o.label }}
                  </span>
                  @if (vote() !== null) { <span class="mono tiny b">{{ share(i) }}%</span> }
                </span>
              </button>
            }
            <span class="tiny faint">{{ fmt.n(totalVotes()) }} founders voted · {{ vote() === null ? 'your answer helps them decide' : 'thanks — your vote was recorded' }}</span>
          </div>
        }
      </div>

      @if (post().media; as m) {
        <div class="post__media">
          @if (m.kind === 'chart') {
            <div class="card card--flat pad">
              <app-chart [series]="m.series ?? []" [label]="m.seriesLabel ?? m.caption" [height]="130" />
            </div>
          } @else {
            <app-media [emoji]="m.emoji" [caption]="m.caption" [gradient]="m.gradient"
              [play]="m.kind === 'video'" [duration]="m.duration ?? ''" ratio="16x9" />
          }
        </div>
      }

      <!-- actions -->
      <div class="post__acts">
        <button class="act" [class.on]="store.isSupported(post().id)" (click)="store.toggleSupport(post().id)">
          <span class="pop"><app-icon name="rocket" [size]="17" /></span>
          {{ fmt.n(post().supports) }}
        </button>
        <button class="act" (click)="open.set(!open())">
          <app-icon name="comment" [size]="17" /> {{ post().comments.length }}
        </button>
        <button class="act" (click)="store.sharePost(post().id)">
          <app-icon name="share" [size]="17" /> {{ post().shares }}
        </button>
        <div class="grow"></div>
        @switch (post().type) {
          @case ('question') {
            <button class="btn btn--outline-brand btn--sm" (click)="open.set(true)">
              <app-icon name="bulb" [size]="14" /> Give feedback
            </button>
          }
          @case ('help') {
            <button class="btn btn--outline-brand btn--sm" (click)="offer()">
              <app-icon name="cap" [size]="14" /> Offer expertise
            </button>
          }
          @case ('funding') {
            @if (campaignId()) {
              <a class="btn btn--seed btn--sm" [routerLink]="['/fund', campaignId()]">
                <app-icon name="rocket" [size]="14" /> Support campaign
              </a>
            }
          }
          @case ('build') {
            @if (startup(); as s) {
              <a class="btn btn--sm" [routerLink]="['/s', s.slug]" [queryParams]="{ tab: 'journey' }">
                Follow the journey <app-icon name="chevR" [size]="14" />
              </a>
            }
          }
          @case ('failure') {
            @if (author(); as a) {
              <button class="btn btn--sm" (click)="encourage()">
                <app-icon name="heart" [size]="14" /> Send encouragement
              </button>
            }
          }
          @default {
            @if (author(); as a) {
              @if (a.id !== 'u_me') {
                <button class="btn btn--sm" (click)="store.toggleFollow(a.id, a.name)">
                  @if (store.isFollowing(a.id)) { Following } @else { <app-icon name="plus" [size]="14" /> Follow }
                </button>
              }
            }
          }
        }
      </div>

      <!-- comments -->
      @if (post().comments.length) {
        @for (c of shown(); track c.id) {
          <div class="comment">
            <a [routerLink]="['/u', store.person(c.authorId)?.handle]">
              <app-av [name]="store.person(c.authorId)?.name ?? ''" [size]="30" />
            </a>
            <div class="grow">
              <div class="comment__bubble">
                <div class="row g-6" style="margin-bottom:2px">
                  <a class="b sm hoverline" [routerLink]="['/u', store.person(c.authorId)?.handle]">
                    {{ store.person(c.authorId)?.name }}
                  </a>
                  @if (c.expert) { <span class="tag tag--brand" style="padding:1px 6px">Expert</span> }
                  <span class="tiny faint">{{ c.at }}</span>
                </div>
                {{ c.text }}
              </div>
              <div class="row g-10 tiny faint" style="padding:4px 4px 0">
                <span class="link" style="font-size:11.5px">Support · {{ c.supports }}</span>
                <span class="link" style="font-size:11.5px">Reply</span>
              </div>
            </div>
          </div>
        }
        @if (post().comments.length > 2 && !open()) {
          <button class="btn btn--ghost btn--sm btn--block" (click)="open.set(true)">
            Show all {{ post().comments.length }} comments
          </button>
        }
      }

      @if (open()) {
        <div class="comment">
          <app-av [name]="store.me().name" [size]="30" />
          <input class="input" placeholder="Add specific, useful feedback…"
            [(ngModel)]="draft" (keydown.enter)="send()" />
          <button class="btn btn--primary btn--icon" [disabled]="!draft.trim()" (click)="send()">
            <app-icon name="send" [size]="16" />
          </button>
        </div>
      }
    </article>
  `,
  styles: [`
    .poll { position: relative; border: 1px solid var(--line); background: var(--surface);
      border-radius: 9px; padding: 9px 11px; cursor: pointer; overflow: hidden; text-align: left; font-size: 13px; }
    .poll:hover { border-color: var(--brand-300) }
    .poll--on { border-color: var(--brand-500) }
    .poll__fill { position: absolute; inset: 0 auto 0 0; background: var(--brand-50); transition: width .5s ease; }
    .poll__t { position: relative }
  `],
})
export class PostCard {
  readonly post = input.required<Post>();
  readonly store = inject(Store);
  private router = inject(Router);
  readonly fmt = fmt;

  readonly open = signal(false);
  readonly vote = signal<number | null>(null);
  draft = '';

  readonly author = computed(() => this.store.person(this.post().authorId));
  readonly startup = computed(() => this.store.startup(this.post().startupId));
  readonly meta = computed(() => TYPE_META[this.post().type]);
  readonly campaignId = computed(() => {
    const s = this.startup();
    return s ? this.store.campaignOf(s.id)?.id : undefined;
  });
  readonly shown = computed(() => {
    const c = this.post().comments;
    return this.open() ? c : c.slice(0, 2);
  });
  readonly extra = signal(0);
  readonly totalVotes = computed(() =>
    (this.post().poll?.options.reduce((n, o) => n + o.votes, 0) ?? 0) + this.extra());

  share(i: number): number {
    const poll = this.post().poll;
    if (!poll) return 0;
    const bonus = this.vote() === i ? 1 : 0;
    const total = this.totalVotes() || 1;
    return Math.round(((poll.options[i].votes + bonus) / total) * 100);
  }

  castVote(i: number): void {
    if (this.vote() !== null) return;
    this.vote.set(i);
    this.extra.set(1);
    this.store.toast('Vote recorded — the founder sees the split live', '🗳️');
    this.store.addScore('Community contribution', 1);
  }

  send(): void {
    const t = this.draft.trim();
    if (!t) return;
    this.store.addComment(this.post().id, t);
    this.draft = '';
    this.open.set(true);
  }

  offer(): void {
    const a = this.author();
    this.store.toast(`Offer sent to ${a?.name ?? 'the founder'} — continue in Messages`, '🤝');
    this.router.navigate(['/messages']);
  }

  encourage(): void {
    if (!this.store.isSupported(this.post().id)) this.store.toggleSupport(this.post().id);
    this.store.toast('Encouragement sent. Failure posts are how founders earn trust here.', '💛');
  }
}
