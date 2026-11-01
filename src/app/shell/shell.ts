import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { Store } from '../core/store';
import { UI } from '../ui/ui';
import { StoryViewer } from './story-viewer';
import { ToastHost } from './toast-host';

interface NavItem { path: string; label: string; icon: string; count?: () => number }
interface NavGroup { label: string; items: NavItem[] }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, UI, StoryViewer, ToastHost],
  template: `
    <button type="button" class="skip-link" (click)="skipToContent()">Skip to content</button>

    <div class="shell">
      <!-- ---------- desktop / tablet sidebar ---------- -->
      <aside class="side">
        <a class="side__brand" routerLink="/home" aria-label="Nawa home">
          <span class="brandmark" aria-hidden="true">🌱</span>
          <span class="brandname">
            <span class="bb" style="font-family:var(--display);font-size:17px;letter-spacing:-.03em">Nawa</span>
            <span class="tiny faint" style="display:block;line-height:1;margin-top:1px">build in public</span>
          </span>
        </a>

        <nav aria-label="Main">
          @for (g of groups; track g.label) {
            @if (g.label) { <div class="side__group">{{ g.label }}</div> }
            @for (n of g.items; track n.path) {
              <a class="nav-i" [routerLink]="n.path" routerLinkActive="on" [attr.aria-label]="label(n)">
                <app-icon [name]="n.icon" [size]="19" />
                <span>{{ n.label }}</span>
                @if (n.count && n.count()) { <span class="nav-i__count" aria-hidden="true">{{ n.count() }}</span> }
              </a>
            }
          }
        </nav>

        <!-- theme toggle stays visible in the compact (icon-only) sidebar -->
        <button type="button" class="nav-i nav-i--btn mt-8" (click)="store.toggleTheme()"
          [attr.aria-label]="store.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'">
          <app-icon [name]="store.theme() === 'dark' ? 'sun' : 'moon'" [size]="19" />
          <span>{{ store.theme() === 'dark' ? 'Light mode' : 'Dark mode' }}</span>
        </button>

        <div class="side__foot" style="margin-top:auto;padding-top:14px">
          @if (store.activeStartup(); as s) {
            <a class="panel row g-10" [routerLink]="['/s', s.slug]" style="text-decoration:none">
              <app-av [name]="s.name" [emoji]="s.emoji" [gradient]="s.gradient" [size]="34" [square]="true" />
              <span class="grow" style="min-width:0">
                <span class="sm b" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ s.name }}</span>
                <span class="tiny faint">Day {{ s.day }} · building in public</span>
              </span>
            </a>
          }
          <button type="button" class="btn btn--ghost btn--sm btn--block mt-8" (click)="reset()">
            <app-icon name="refresh" [size]="14" /> <span class="side__cta-label">Reset demo data</span>
          </button>
        </div>
      </aside>

      <!-- ---------- main column ---------- -->
      <div class="main">
        <header class="topbar">
          <a class="row g-8 mobile-only" routerLink="/home" aria-label="Nawa home">
            <span class="brandmark" aria-hidden="true">🌱</span>
            <span class="bb" style="font-family:var(--display);font-size:16px;letter-spacing:-.03em">Nawa</span>
          </a>

          <form class="searchbar grow desktop-only" style="max-width:420px" role="search" (submit)="$event.preventDefault(); search()">
            <app-icon name="search" [size]="16" />
            <label for="top-search" class="sr-only">Search startups, founders and experts</label>
            <input id="top-search" class="input" type="search" placeholder="Search startups, founders, experts…"
              [value]="q()" (input)="q.set($any($event.target).value)" />
          </form>

          <div class="grow"></div>

          @if (store.activeStartup(); as s) {
            <span class="day-pill desktop-only">🌱 Day {{ s.day }}</span>
          }
          <a class="btn btn--primary btn--sm desktop-only" routerLink="/build" [queryParams]="{ compose: 1 }">
            <app-icon name="plus" [size]="15" /> Post update
          </a>
          <a class="btn btn--icon btn--sm mobile-only" routerLink="/discover" aria-label="Search">
            <app-icon name="search" [size]="17" />
          </a>
          <a class="btn btn--icon btn--sm rel" routerLink="/notifications"
            [attr.aria-label]="store.unreadNotifs() ? 'Notifications, ' + store.unreadNotifs() + ' unread' : 'Notifications'">
            <app-icon name="bell" [size]="17" />
            @if (store.unreadNotifs()) { <span class="notif-dot" aria-hidden="true"></span> }
          </a>
          <a routerLink="/me" aria-label="Your profile">
            <app-av [name]="store.me().name" [size]="32" [verified]="store.me().verified" />
          </a>
        </header>

        <main #mainEl id="main" tabindex="-1" class="main__content">
          <router-outlet />
        </main>
      </div>

      <!-- ---------- mobile bottom nav ---------- -->
      <nav class="tabbar" aria-label="Quick navigation">
        <a routerLink="/home" routerLinkActive="on"><app-icon name="home" [size]="21" /><span>Home</span></a>
        <a routerLink="/live" routerLinkActive="on"><app-icon name="video" [size]="21" /><span>Live</span></a>
        <a routerLink="/build" [queryParams]="{ compose: 1 }" aria-label="Post an update">
          <span class="fab"><app-icon name="plus" [size]="21" [weight]="2.2" /></span>
        </a>
        <a routerLink="/shop" routerLinkActive="on"><app-icon name="bag" [size]="21" /><span>Shop</span></a>
        <button type="button" class="tabbar__more" [class.on]="more()" aria-haspopup="dialog"
          [attr.aria-expanded]="more()" (click)="more.set(true)">
          <app-icon name="menu" [size]="21" /><span>More</span>
          @if (store.unreadMsgs() || store.unreadNotifs()) { <span class="tabbar__dot" aria-hidden="true"></span> }
        </button>
      </nav>
    </div>

    <!-- mobile "More" sheet: every section + settings -->
    @if (more()) {
      <app-dialog title="Everything on Nawa" subtitle="Jump to any section." (close)="more.set(false)">
        <nav aria-label="All sections" class="col g-14">
          @for (g of groups; track g.label) {
            <div class="col g-6">
              @if (g.label) { <span class="up faint">{{ g.label }}</span> }
              <div class="more-grid">
                @for (n of g.items; track n.path) {
                  <a class="more-i" [routerLink]="n.path" routerLinkActive="on" (click)="more.set(false)" [attr.aria-label]="label(n)">
                    <app-icon [name]="n.icon" [size]="19" />
                    <span>{{ n.label }}</span>
                    @if (n.count && n.count()) { <span class="nav-i__count" aria-hidden="true">{{ n.count() }}</span> }
                  </a>
                }
              </div>
            </div>
          }
        </nav>
        <div class="divider mt-16"></div>
        <div class="row g-8 mt-12">
          <button type="button" class="btn btn--sm grow" (click)="store.toggleTheme()">
            <app-icon [name]="store.theme() === 'dark' ? 'sun' : 'moon'" [size]="15" />
            {{ store.theme() === 'dark' ? 'Light mode' : 'Dark mode' }}
          </button>
          <button type="button" class="btn btn--sm grow" (click)="reset(); more.set(false)">
            <app-icon name="refresh" [size]="15" /> Reset demo
          </button>
        </div>
      </app-dialog>
    }

    <app-story-viewer />
    <app-toast-host />
  `,
  styles: [`
    .side__brand { text-decoration: none }
    .nav-i--btn { background: none; border: 0; width: 100%; font: inherit; cursor: pointer; text-align: left; }
    .main__content { display: block; outline: none; min-width: 0; }
    .notif-dot { position: absolute; top: -3px; right: -3px; width: 9px; height: 9px; border-radius: 50%;
      background: var(--rose-500); border: 2px solid var(--surface); }
    .skip-link { position: fixed; top: 8px; left: 8px; z-index: 200; transform: translateY(-160%);
      background: var(--ink); color: var(--on-ink); border: 0; border-radius: 9px; padding: 9px 14px;
      font: inherit; font-weight: 600; font-size: 13px; cursor: pointer; transition: transform .15s; }
    .skip-link:focus-visible { transform: none; }
    .tabbar__more { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
      background: none; border: 0; color: var(--faint); font: inherit; font-size: 10px; font-weight: 600; cursor: pointer; position: relative; }
    .tabbar__more.on { color: var(--brand-600); }
    .tabbar__dot { position: absolute; top: 9px; right: calc(50% - 15px); width: 8px; height: 8px; border-radius: 50%; background: var(--rose-500); }
    .more-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    .more-i { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 6px;
      border: 1px solid var(--line); border-radius: 12px; background: var(--surface); color: var(--text);
      font-size: 12px; font-weight: 600; text-align: center; }
    .more-i:hover, .more-i.on { border-color: var(--brand-300); color: var(--brand-600); background: var(--brand-50); }
    .more-i .nav-i__count { position: absolute; top: 6px; right: 6px; margin: 0; }
  `],
})
export class Shell {
  readonly store = inject(Store);
  private router = inject(Router);
  private mainEl = viewChild<ElementRef<HTMLElement>>('mainEl');
  readonly q = signal('');
  readonly more = signal(false);

  /** One source of truth for the sidebar and the mobile "More" sheet. */
  readonly groups: NavGroup[] = [
    { label: '', items: [
      { path: '/home', label: 'Home', icon: 'home' },
      { path: '/discover', label: 'Discover', icon: 'compass' },
    ] },
    { label: 'Build', items: [
      { path: '/build', label: 'Workspace', icon: 'rocket' },
      { path: '/experts', label: 'Experts', icon: 'cap' },
      { path: '/incubators', label: 'Incubators', icon: 'building' },
      { path: '/challenges', label: 'Challenges', icon: 'flag' },
    ] },
    { label: 'Fund & sell', items: [
      { path: '/fund', label: 'Fund', icon: 'dollar' },
      { path: '/shop', label: 'Marketplace', icon: 'bag' },
      { path: '/wallet', label: 'Wallet', icon: 'wallet' },
    ] },
    { label: 'Community', items: [
      { path: '/live', label: 'Live', icon: 'video', count: () => this.store.liveNow().length },
      { path: '/videos', label: 'Reels', icon: 'play' },
      { path: '/rooms', label: 'Chat rooms', icon: 'users' },
      { path: '/messages', label: 'Messages', icon: 'message', count: () => this.store.unreadMsgs() },
      { path: '/jobs', label: 'Jobs', icon: 'briefcase' },
      { path: '/events', label: 'Events', icon: 'calendar' },
    ] },
    { label: 'You', items: [
      { path: '/notifications', label: 'Notifications', icon: 'bell', count: () => this.store.unreadNotifs() },
      { path: '/me', label: 'Profile', icon: 'user' },
    ] },
  ];

  constructor() {
    // close the mobile sheet whenever navigation completes
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.more.set(false));
  }

  /** Accessible name that includes live/unread counts (the badge itself is hidden from screen readers). */
  label(n: NavItem): string {
    const c = n.count?.() ?? 0;
    if (!c) return n.label;
    return n.path === '/live' ? `${n.label}, ${c} live now` : `${n.label}, ${c} unread`;
  }

  skipToContent(): void { this.mainEl()?.nativeElement.focus(); }

  search(): void {
    const term = this.q().trim();
    this.router.navigate(['/discover'], { queryParams: term ? { q: term } : {} });
  }

  reset(): void {
    this.store.resetDemo();
    this.router.navigate(['/home']);
  }
}
