import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '../core/store';
import { UI } from '../ui/ui';
import { StoryViewer } from './story-viewer';
import { ToastHost } from './toast-host';

interface NavItem { path: string; label: string; icon: string; count?: () => number }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, UI, StoryViewer, ToastHost],
  template: `
    <div class="shell">
      <!-- ---------- desktop sidebar ---------- -->
      <aside class="side">
        <a class="side__brand" routerLink="/home">
          <span class="brandmark">🌱</span>
          <span class="brandname">
            <span class="bb" style="font-family:var(--display);font-size:17px;letter-spacing:-.03em">Nawa</span>
            <span class="tiny faint" style="display:block;line-height:1;margin-top:1px">build in public</span>
          </span>
        </a>

        @for (n of primary; track n.path) {
          <a class="nav-i" [routerLink]="n.path" routerLinkActive="on">
            <app-icon [name]="n.icon" [size]="19" />
            <span>{{ n.label }}</span>
            @if (n.count && n.count()) { <span class="nav-i__count">{{ n.count() }}</span> }
          </a>
        }

        <div class="side__group">Community</div>
        @for (n of secondary; track n.path) {
          <a class="nav-i" [routerLink]="n.path" routerLinkActive="on">
            <app-icon [name]="n.icon" [size]="19" />
            <span>{{ n.label }}</span>
            @if (n.count && n.count()) { <span class="nav-i__count">{{ n.count() }}</span> }
          </a>
        }

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
          <button class="btn btn--ghost btn--sm btn--block mt-8" (click)="reset()">
            <app-icon name="refresh" [size]="14" /> <span class="side__cta-label">Reset demo data</span>
          </button>
        </div>
      </aside>

      <!-- ---------- main column ---------- -->
      <div class="main">
        <header class="topbar">
          <a class="row g-8 mobile-only" routerLink="/home">
            <span class="brandmark">🌱</span>
            <span class="bb" style="font-family:var(--display);font-size:16px;letter-spacing:-.03em">Nawa</span>
          </a>

          <div class="searchbar grow desktop-only" style="max-width:420px">
            <app-icon name="search" [size]="16" />
            <input class="input" placeholder="Search startups, founders, experts…"
              [value]="q()" (input)="q.set($any($event.target).value)" (keydown.enter)="search()" />
          </div>

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
          <a class="btn btn--icon btn--sm rel" routerLink="/notifications" aria-label="Notifications">
            <app-icon name="bell" [size]="17" />
            @if (store.unreadNotifs()) {
              <span style="position:absolute;top:-3px;right:-3px;width:9px;height:9px;border-radius:50%;background:var(--rose-500);border:2px solid #fff"></span>
            }
          </a>
          <a routerLink="/me" aria-label="Profile">
            <app-av [name]="store.me().name" [size]="32" [verified]="store.me().verified" />
          </a>
        </header>

        <router-outlet />
      </div>

      <!-- ---------- mobile bottom nav ---------- -->
      <nav class="tabbar">
        <a routerLink="/home" routerLinkActive="on"><app-icon name="home" [size]="21" /><span>Home</span></a>
        <a routerLink="/live" routerLinkActive="on"><app-icon name="video" [size]="21" /><span>Live</span></a>
        <a routerLink="/build" [queryParams]="{ compose: 1 }"><span class="fab"><app-icon name="plus" [size]="21" [weight]="2.2" /></span></a>
        <a routerLink="/shop" routerLinkActive="on"><app-icon name="wallet" [size]="21" /><span>Shop</span></a>
        <a routerLink="/me" routerLinkActive="on"><app-icon name="user" [size]="21" /><span>You</span></a>
      </nav>
    </div>

    <app-story-viewer />
    <app-toast-host />
  `,
  styles: [`
    .brandmark { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center;
      background: linear-gradient(140deg, #14b87a, #5a46f0 120%); font-size: 15px; flex: none; }
    .side__brand { text-decoration: none }
  `],
})
export class Shell {
  readonly store = inject(Store);
  private router = inject(Router);
  readonly q = signal('');

  readonly primary: NavItem[] = [
    { path: '/home', label: 'Home', icon: 'home' },
    { path: '/discover', label: 'Discover', icon: 'compass' },
    { path: '/build', label: 'Build', icon: 'rocket' },
    { path: '/fund', label: 'Fund', icon: 'dollar' },
    { path: '/shop', label: 'Marketplace', icon: 'wallet' },
    { path: '/live', label: 'Live', icon: 'video', count: () => this.store.liveNow().length },
    { path: '/experts', label: 'Experts', icon: 'cap' },
    { path: '/incubators', label: 'Incubators', icon: 'building' },
  ];

  readonly secondary: NavItem[] = [
    { path: '/rooms', label: 'Chat rooms', icon: 'users' },
    { path: '/challenges', label: 'Challenges', icon: 'flag' },
    { path: '/jobs', label: 'Jobs', icon: 'briefcase' },
    { path: '/events', label: 'Events', icon: 'calendar' },
    { path: '/videos', label: 'Videos', icon: 'video' },
    { path: '/wallet', label: 'Wallet', icon: 'wallet' },
    { path: '/notifications', label: 'Notifications', icon: 'bell', count: () => this.store.unreadNotifs() },
    { path: '/messages', label: 'Messages', icon: 'message', count: () => this.store.unreadMsgs() },
    { path: '/me', label: 'Profile', icon: 'user' },
  ];

  search(): void {
    const term = this.q().trim();
    this.router.navigate(['/discover'], { queryParams: term ? { q: term } : {} });
  }

  reset(): void {
    this.store.resetDemo();
    this.router.navigate(['/home']);
  }
}
