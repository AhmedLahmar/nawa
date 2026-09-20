import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '../core/store';
import { NotifKind } from '../core/models';
import { fmt, UI } from '../ui/ui';

const META: Record<NotifKind, { icon: string; bg: string; fg: string; label: string }> = {
  follow: { icon: 'users', bg: 'var(--brand-50)', fg: 'var(--brand-600)', label: 'Community' },
  support: { icon: 'rocket', bg: 'var(--seed-100)', fg: 'var(--seed-600)', label: 'Support' },
  comment: { icon: 'comment', bg: 'var(--brand-50)', fg: 'var(--brand-600)', label: 'Community' },
  milestone: { icon: 'award', bg: 'var(--amber-100)', fg: 'var(--amber-600)', label: 'Milestone' },
  funding: { icon: 'dollar', bg: 'var(--seed-100)', fg: 'var(--seed-600)', label: 'Funding' },
  expert: { icon: 'cap', bg: 'var(--brand-50)', fg: 'var(--brand-600)', label: 'Expert' },
  challenge: { icon: 'flag', bg: 'var(--amber-100)', fg: 'var(--amber-600)', label: 'Challenge' },
  incubator: { icon: 'building', bg: 'var(--brand-50)', fg: 'var(--brand-600)', label: 'Programme' },
};

const FILTERS = [
  { key: 'all', label: 'Everything' },
  { key: 'community', label: 'Community' },
  { key: 'funding', label: 'Funding' },
  { key: 'expert', label: 'Experts & programmes' },
];

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [RouterLink, UI],
  template: `
    <div class="page page--narrow">
      <div class="page-head">
        <div class="col g-6">
          <h1 class="display-lg">Notifications</h1>
          <span class="muted sm">
            @if (store.unreadNotifs()) { {{ store.unreadNotifs() }} new since your last update } @else { You are all caught up }
          </span>
        </div>
        <div class="row g-8">
          @if (store.unreadNotifs()) {
            <button class="btn btn--sm" (click)="store.markNotifsRead()"><app-icon name="check" [size]="14" /> Mark all read</button>
          }
          <a class="btn btn--sm btn--primary" routerLink="/build" [queryParams]="{ compose: 1 }">
            <app-icon name="plus" [size]="14" /> Post update
          </a>
        </div>
      </div>

      <div class="seg mb-16">
        @for (f of filters; track f.key) {
          <button [class.on]="filter() === f.key" (click)="filter.set(f.key)">{{ f.label }}</button>
        }
      </div>

      <div class="card" style="overflow:hidden">
        @if (list().length) {
          @for (n of list(); track n.id) {
            <div class="notif" [class.unread]="n.unread" (click)="go(n.link)">
              <div class="notif__ic" [style.background]="meta(n.kind).bg" [style.color]="meta(n.kind).fg">
                <app-icon [name]="meta(n.kind).icon" [size]="17" />
              </div>
              <div class="grow col g-4" style="min-width:0">
                <span class="sm">
                  <b>{{ name(n.actorId) }}</b> {{ n.text }}
                </span>
                <span class="row g-8 tiny faint wrap">
                  <span class="tag tag--outline">{{ meta(n.kind).label }}</span>
                  <span>{{ n.at }}</span>
                  @if (n.meta) { <span class="dot-sep"></span><span>{{ n.meta }}</span> }
                </span>
              </div>
              <app-av [name]="name(n.actorId)" [size]="34" [verified]="verified(n.actorId)" />
            </div>
          }
        } @else {
          <app-empty icon="bell" title="Nothing here yet"
            text="Publish an update — reactions, questions and follows land here." />
        }
      </div>

      <span class="mock-note mt-16"><app-icon name="lock" [size]="11" /> Activity is generated locally for this demo</span>
    </div>
  `,
})
export class NotificationsPage {
  readonly store = inject(Store);
  private router = inject(Router);
  readonly fmt = fmt;
  readonly filters = FILTERS;
  readonly filter = signal('all');

  readonly list = computed(() => {
    const f = this.filter();
    const all = this.store.notifications();
    if (f === 'all') return all;
    if (f === 'community') return all.filter(n => ['follow', 'support', 'comment', 'milestone', 'challenge'].includes(n.kind));
    if (f === 'funding') return all.filter(n => n.kind === 'funding');
    return all.filter(n => n.kind === 'expert' || n.kind === 'incubator');
  });

  meta = (k: NotifKind) => META[k];
  name = (id: string) => this.store.person(id)?.name ?? this.store.incubatorById(id)?.name ?? 'Someone';
  verified = (id: string) => this.store.person(id)?.verified ?? false;

  go(link?: string): void {
    if (link) this.router.navigateByUrl(link);
    else this.store.toast('This notification has no target in the demo', '🔔');
  }
}
