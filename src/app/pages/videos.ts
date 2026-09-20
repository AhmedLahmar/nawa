import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '../core/store';
import { fmt, UI } from '../ui/ui';

@Component({
  selector: 'app-videos-page',
  standalone: true,
  imports: [RouterLink, UI],
  template: `
    <div class="reels">
      <!-- top overlay: title + category filter -->
      <div class="reels__top">
        <div class="row g-8">
          <span class="brandmark-sm">🎬</span>
          <span class="bb" style="font-family:var(--display);font-size:16px;color:#fff">Reels</span>
        </div>
        <div class="row g-6 scroll-x reels__cats">
          <button class="rchip" [class.rchip--on]="cat() === 'all'" (click)="cat.set('all')">For you</button>
          @for (c of categories(); track c) {
            <button class="rchip" [class.rchip--on]="cat() === c" (click)="cat.set(c)">{{ c }}</button>
          }
        </div>
      </div>

      <!-- vertical snap feed -->
      <div class="reels__feed">
        @for (v of list(); track v.id) {
          <section class="reel-full" [style.background]="v.gradient">
            <div class="reel-full__scene">
              <span class="reel-full__hero">{{ v.emoji }}</span>
              <button class="reel-full__play" (click)="toggleTip(v.title)">
                <app-icon name="play" [size]="30" [weight]="0" />
              </button>
              <span class="reel-full__dur">{{ v.duration }}</span>
            </div>

            <!-- right action rail -->
            <div class="rail">
              <a class="rail__av" [routerLink]="['/u', handle(v.authorId)]">
                <app-av [name]="name(v.authorId)" [size]="46" [verified]="verified(v.authorId)" />
                @if (!isFollowing(v.authorId) && v.authorId !== 'u_me') {
                  <button class="rail__follow" (click)="follow($event, v.authorId)"><app-icon name="plus" [size]="12" [weight]="3" /></button>
                }
              </a>
              <button class="rail__btn" [class.on]="store.isVideoSupported(v.id)" (click)="support(v.id)">
                <span class="rail__ic"><app-icon name="rocket" [size]="24" /></span>
                <span class="rail__n">{{ fmt.k(v.supports) }}</span>
              </button>
              <button class="rail__btn" (click)="openComments(v.id)">
                <span class="rail__ic"><app-icon name="comment" [size]="24" /></span>
                <span class="rail__n">{{ v.comments }}</span>
              </button>
              <button class="rail__btn" (click)="store.shareVideo(v.id)">
                <span class="rail__ic"><app-icon name="share" [size]="23" /></span>
                <span class="rail__n">Share</span>
              </button>
              @if (v.startupId) {
                <a class="rail__btn" [routerLink]="['/s', slug(v.startupId)]">
                  <span class="rail__ic rail__ic--sq" [style.background]="v.gradient">{{ startupEmoji(v.startupId) }}</span>
                </a>
              }
            </div>

            <!-- bottom creator overlay -->
            <div class="reel-full__meta">
              <div class="row g-8" style="align-items:center">
                <a class="b" style="color:#fff;text-decoration:none" [routerLink]="['/u', handle(v.authorId)]">{{ name(v.authorId) }}</a>
                @if (v.startupId) {
                  <span class="tiny" style="color:rgba(255,255,255,.7)">·</span>
                  <a class="tiny b" style="color:#fff;text-decoration:none" [routerLink]="['/s', slug(v.startupId)]">{{ startupEmoji(v.startupId) }} {{ startupName(v.startupId) }}</a>
                }
              </div>
              <div class="sm b" style="color:#fff;line-height:1.4;margin-top:6px;max-width:78%">{{ v.title }}</div>
              <div class="tiny" style="color:rgba(255,255,255,.82);margin-top:4px;max-width:78%">{{ v.caption }}</div>
              <div class="row g-8 mt-8" style="flex-wrap:wrap">
                @if (v.milestone) { <span class="reel-tag">🏁 {{ v.milestone }}</span> }
                <span class="reel-tag">{{ v.category }}</span>
                <span class="reel-tag"><app-icon name="eye" [size]="11" /> {{ fmt.k(v.views) }}</span>
              </div>
            </div>
          </section>
        }

        @if (!list().length) {
          <section class="reel-full" style="background:var(--ink,#14151f)">
            <div class="center col g-10" style="color:#fff;align-items:center">
              <app-icon name="video" [size]="30" />
              <span class="sm">No clips in this category</span>
              <button class="btn btn--sm" (click)="cat.set('all')">Show all</button>
            </div>
          </section>
        }
      </div>

      <!-- record FAB -->
      <button class="reels__record" (click)="store.toast('Recording is mocked in this demo', '🎬')">
        <app-icon name="camera" [size]="18" /> Record
      </button>

      <!-- comment sheet -->
      @if (comments(); as v) {
        <div class="sheet-scrim" (click)="comments.set(null)">
          <div class="sheet" (click)="$event.stopPropagation()">
            <div class="sheet__grab"></div>
            <div class="row between">
              <span class="b">{{ v.comments }} comments</span>
              <button class="btn btn--ghost btn--icon btn--sm" (click)="comments.set(null)"><app-icon name="x" [size]="16" /></button>
            </div>
            <div class="col g-12 mt-12" style="max-height:44vh;overflow:auto">
              @for (c of sampleComments; track c.who) {
                <div class="row-t g-10">
                  <app-av [name]="c.who" [size]="32" />
                  <div class="grow"><span class="sm b">{{ c.who }}</span><div class="sm muted">{{ c.text }}</div></div>
                </div>
              }
              <span class="tiny faint center">Comments are illustrative in this demo</span>
            </div>
            <div class="composer-bar mt-8">
              <app-av [name]="store.me().name" [size]="28" />
              <input class="input" placeholder="Add a comment…" style="border:0;box-shadow:none;background:transparent"
                [value]="draft()" (input)="draft.set($any($event.target).value)" (keydown.enter)="addComment(v.id)" />
              <button class="btn btn--primary btn--icon" [disabled]="!draft().trim()" (click)="addComment(v.id)">
                <app-icon name="send" [size]="16" />
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .reels { position: fixed; inset: 0; top: 0; background: #05060a; z-index: 40; }
    /* leave room for the app's own top bar / bottom tabbar on mobile via env-safe padding */
    .reels__feed { height: 100%; overflow-y: auto; scroll-snap-type: y mandatory; scroll-behavior: smooth; }
    .reels__feed::-webkit-scrollbar { display: none; }
    .reel-full { position: relative; height: 100%; scroll-snap-align: start; scroll-snap-stop: always;
      display: flex; overflow: hidden; }
    .reel-full__scene { position: absolute; inset: 0; display: grid; place-items: center; }
    .reel-full__hero { font-size: 128px; opacity: .55; filter: drop-shadow(0 14px 44px rgba(0,0,0,.45));
      animation: reelbob 5s ease-in-out infinite; }
    @keyframes reelbob { 0%,100% { transform: translateY(-8px) } 50% { transform: translateY(8px) } }
    .reel-full__play { position: absolute; width: 74px; height: 74px; border-radius: 50%; border: 0; cursor: pointer;
      background: rgba(255,255,255,.16); backdrop-filter: blur(6px); color: #fff; display: grid; place-items: center; }
    .reel-full__play app-icon { margin-left: 4px } .reel-full__play svg { fill: currentColor }
    .reel-full__dur { position: absolute; top: 74px; right: 16px; background: rgba(0,0,0,.45); color: #fff;
      font-size: 11px; padding: 3px 8px; border-radius: 999px; }
    .reels__top { position: absolute; top: 0; left: 0; right: 0; z-index: 5; display: flex; align-items: center;
      gap: 14px; padding: 14px 16px; background: linear-gradient(rgba(0,0,0,.4), transparent); }
    .brandmark-sm { width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center;
      background: linear-gradient(140deg,#14b87a,#5a46f0 120%); font-size: 13px; }
    .reels__cats { flex: 1; }
    .rchip { flex: none; background: rgba(255,255,255,.14); color: #fff; border: 0; border-radius: 999px;
      padding: 6px 13px; font-size: 12.5px; font-weight: 600; cursor: pointer; }
    .rchip--on { background: #fff; color: var(--ink); }
    .rail { position: absolute; right: 10px; bottom: 96px; z-index: 4; display: flex; flex-direction: column;
      align-items: center; gap: 18px; }
    .rail__av { position: relative; display: block; }
    .rail__follow { position: absolute; left: 50%; bottom: -8px; transform: translateX(-50%); width: 20px; height: 20px;
      border-radius: 50%; border: 2px solid #fff; background: var(--rose-500); color: #fff; display: grid; place-items: center; cursor: pointer; padding: 0; }
    .rail__btn { background: none; border: 0; color: #fff; display: flex; flex-direction: column; align-items: center;
      gap: 3px; cursor: pointer; }
    .rail__ic { filter: drop-shadow(0 2px 6px rgba(0,0,0,.4)); transition: transform .15s; }
    .rail__btn:active .rail__ic { transform: scale(.82); }
    .rail__btn.on { color: var(--seed-400, #5ce0a8); }
    .rail__ic--sq { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; font-size: 17px; }
    .rail__n { font-size: 11.5px; font-weight: 600; text-shadow: 0 1px 4px rgba(0,0,0,.4); }
    .reel-full__meta { position: absolute; left: 0; right: 66px; bottom: 22px; z-index: 4; padding: 0 16px;
      background: linear-gradient(transparent, rgba(0,0,0,.35)); }
    .reel-tag { background: rgba(255,255,255,.18); color: #fff; font-size: 11px; padding: 3px 9px; border-radius: 999px;
      display: inline-flex; align-items: center; gap: 4px; }
    .reels__record { position: absolute; top: 12px; right: 16px; z-index: 6; display: none; align-items: center; gap: 6px;
      background: var(--rose-500); color: #fff; border: 0; border-radius: 999px; padding: 8px 14px; font-weight: 600;
      font-size: 13px; cursor: pointer; }
    @media (min-width: 900px) {
      .reels__record { display: inline-flex; top: auto; bottom: 22px; }
      .reel-full { justify-content: center; }
      .reel-full__scene, .rail, .reel-full__meta { max-width: 480px; margin-inline: auto; left: 50%; transform: translateX(-50%); }
      .rail { left: auto; right: max(16px, calc(50% - 232px)); transform: none; }
      .reel-full__meta { left: 50%; right: auto; width: 480px; transform: translateX(-50%); padding-right: 80px; }
    }
    .sheet-scrim { position: absolute; inset: 0; z-index: 8; background: rgba(0,0,0,.4); display: flex; align-items: flex-end; }
    .sheet { width: 100%; background: var(--surface); border-radius: 18px 18px 0 0; padding: 12px 16px 16px;
      max-height: 66%; display: flex; flex-direction: column; animation: sheetup .28s ease; }
    @keyframes sheetup { from { transform: translateY(30px); opacity: .6 } to { transform: none; opacity: 1 } }
    .sheet__grab { width: 40px; height: 4px; border-radius: 999px; background: var(--line-2); margin: 2px auto 10px; }
  `],
})
export class VideosPage {
  readonly store = inject(Store);
  readonly fmt = fmt;
  readonly cat = signal('all');
  readonly comments = signal<import('../core/models').Video | null>(null);
  readonly draft = signal('');

  readonly sampleComments = [
    { who: 'Fatma Jlassi', text: 'This is exactly the kind of transparency I back founders for 🙌' },
    { who: 'Karim Mansour', text: 'Great cadence. The specific number at 0:40 is what makes it credible.' },
    { who: 'Ines Chaabane', text: 'Saving this — the offline part is genius.' },
  ];

  readonly categories = computed(() => [...new Set(this.store.videos().map(v => v.category))]);
  readonly list = computed(() => {
    const c = this.cat();
    return c === 'all' ? this.store.videos() : this.store.videos().filter(v => v.category === c);
  });

  name = (id: string) => this.store.person(id)?.name ?? '';
  handle = (id: string) => this.store.person(id)?.handle ?? '';
  verified = (id: string) => this.store.person(id)?.verified ?? false;
  slug = (id: string) => this.store.startup(id)?.slug ?? '';
  startupName = (id: string) => this.store.startup(id)?.name ?? '';
  startupEmoji = (id: string) => this.store.startup(id)?.emoji ?? '🚀';
  isFollowing = (id: string) => this.store.isFollowing(id);

  support(id: string): void { this.store.toggleVideoSupport(id); }
  follow(e: Event, id: string): void { e.preventDefault(); e.stopPropagation(); this.store.toggleFollow(id, this.name(id)); }
  openComments(id: string): void { this.comments.set(this.store.videos().find(v => v.id === id) ?? null); }
  toggleTip(title: string): void { this.store.toast(`"${title}" — playback is mocked in this demo`, '🎬'); }

  addComment(id: string): void {
    if (!this.draft().trim()) return;
    this.store.videos.update(list => list.map(v => v.id === id ? { ...v, comments: v.comments + 1 } : v));
    this.draft.set('');
    this.store.toast('Comment posted', '💬');
    this.comments.set(this.store.videos().find(v => v.id === id) ?? null);
  }
}
