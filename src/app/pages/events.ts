import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventKind } from '../core/models';
import { Store } from '../core/store';
import { fmt, UI } from '../ui/ui';

const KIND_META: Record<EventKind, { label: string; icon: string; tag: string }> = {
  'demo-day': { label: 'Demo Day', icon: 'award', tag: 'tag--brand' },
  'ama': { label: 'AMA', icon: 'mic', tag: 'tag--seed' },
  'pitch': { label: 'Pitch', icon: 'flag', tag: 'tag--amber' },
  'workshop': { label: 'Workshop', icon: 'book', tag: 'tag--outline' },
  'meetup': { label: 'Meetup', icon: 'users', tag: 'tag--outline' },
};

@Component({
  selector: 'app-events-page',
  standalone: true,
  imports: [RouterLink, UI],
  template: `
    <div class="page page--narrow">
      <div class="page-head">
        <div class="col g-6">
          <span class="kicker"><app-icon name="calendar" [size]="13" /> Events</span>
          <h1 class="display-lg">What's coming up</h1>
          <span class="muted sm">Demo days, AMAs, pitch nights and meetups from the Nawa community.</span>
        </div>
        @if (going().length) {
          <span class="tag tag--seed"><app-icon name="check" [size]="12" /> Going to {{ going().length }}</span>
        }
      </div>

      <div class="row g-6 scroll-x mb-16">
        @for (f of filters; track f.key) {
          <button class="chip chip--sm" [class.chip--on]="filter() === f.key" (click)="filter.set(f.key)">{{ f.label }}</button>
        }
      </div>

      <div class="col g-12">
        @for (e of list(); track e.id) {
          <div class="card card--hover row-t g-14 pad">
            <div class="ev-date">
              <span class="ev-date__d">{{ dayNum(e.dateSort) }}</span>
              <span class="ev-date__m">{{ monthShort(e.dateSort) }}</span>
            </div>
            <div class="grow">
              <div class="row between wrap g-8">
                <span class="b">{{ e.emoji }} {{ e.title }}</span>
                <span class="tag" [class]="km(e.kind).tag"><app-icon [name]="km(e.kind).icon" [size]="11" /> {{ km(e.kind).label }}</span>
              </div>
              <div class="row g-10 tiny faint mt-2">
                <span><app-icon name="clock" [size]="11" style="display:inline" /> {{ e.when }}</span>
                <span class="dot-sep"></span>
                <span><app-icon name="pin" [size]="11" style="display:inline" /> {{ e.location }}</span>
                @if (e.online) { <span class="tag tag--outline">Online</span> }
              </div>
              <p class="sm muted mt-4" style="line-height:1.5">{{ e.description }}</p>
              <div class="row between wrap g-10 mt-4">
                <span class="tiny faint">
                  <app-icon name="users" [size]="11" style="display:inline" /> {{ fmt.n(e.attendees) }} going
                  @if (e.capacity) { · {{ spotsLeft(e.attendees, e.capacity) }} spots left }
                </span>
                <div class="row g-8">
                  @if (e.online && e.kind === 'ama') {
                    <a class="btn btn--sm" routerLink="/live"><app-icon name="video" [size]="13" /> Watch on Live</a>
                  }
                  <button class="btn btn--sm" [class.btn--seed]="!e.going" (click)="store.toggleEvent(e.id)">
                    @if (e.going) { Going ✓ } @else { RSVP }
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      @if (!list().length) {
        <app-empty icon="calendar" title="No events in this filter" text="Check back soon or switch filter." />
      }

      <span class="mock-note mt-16"><app-icon name="lock" [size]="11" /> Events and attendee counts are part of the demo dataset</span>
    </div>
  `,
  styles: [`
    .ev-date { width: 54px; height: 58px; border-radius: 12px; background: var(--brand-50); color: var(--brand-600);
      display: flex; flex-direction: column; align-items: center; justify-content: center; flex: none; }
    .ev-date__d { font-size: 20px; font-weight: 720; font-family: var(--display); line-height: 1; }
    .ev-date__m { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
  `],
})
export class EventsPage {
  readonly store = inject(Store);
  readonly fmt = fmt;
  readonly filter = signal('all');
  readonly filters = [
    { key: 'all', label: 'Everything' },
    { key: 'demo-day', label: '🛰️ Demo days' },
    { key: 'ama', label: '🎤 AMAs' },
    { key: 'pitch', label: '🏁 Pitch nights' },
    { key: 'meetup', label: '👥 Meetups' },
  ];

  readonly list = computed(() => {
    const f = this.filter();
    const all = this.store.upcomingEvents();
    return f === 'all' ? all : all.filter(e => e.kind === f);
  });
  readonly going = computed(() => this.store.events().filter(e => e.going));

  km = (k: EventKind) => KIND_META[k];
  spotsLeft = (a: number, cap: number) => Math.max(0, cap - a);

  // dateSort is YYYYMMDD
  dayNum = (d: number) => d % 100;
  monthShort = (d: number) => {
    const m = Math.floor(d / 100) % 100;
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Math.max(0, m - 1)];
  };
}
