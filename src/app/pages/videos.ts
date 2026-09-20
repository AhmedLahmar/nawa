import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '../core/store';
import { fmt, UI } from '../ui/ui';

@Component({
  selector: 'app-videos-page',
  standalone: true,
  imports: [RouterLink, UI],
  template: `
    <div class="page">
      <div class="page-head">
        <div class="col g-6">
          <span class="kicker"><app-icon name="video" [size]="13" /> Build clips</span>
          <h1 class="display-lg">Sixty seconds of real product</h1>
          <span class="muted sm" style="max-width:520px">
            Short vertical updates: demos, teardowns, honest days. Faster to watch than a pitch deck and far harder
            to fake.
          </span>
        </div>
        <button class="btn btn--primary" (click)="store.toast('Recording is mocked in this demo', '🎬')">
          <app-icon name="camera" [size]="15" /> Record a clip
        </button>
      </div>

      <div class="row g-6 wrap mb-16">
        <button class="chip" [class.chip--on]="cat() === 'all'" (click)="cat.set('all')">Everything</button>
        @for (c of categories(); track c) {
          <button class="chip" [class.chip--on]="cat() === c" (click)="cat.set(c)">{{ c }}</button>
        }
      </div>

      <div class="vgrid">
        @for (v of list(); track v.id) {
          <div class="col g-8">
            <div class="reel" (click)="play(v.title)">
              <app-media [emoji]="v.emoji" caption="" [gradient]="v.gradient" ratio="9x16" [play]="true"
                [duration]="v.duration" [radius]="14" />
              <div class="reel__grad"></div>
              <div class="reel__stats tiny" style="color:#fff">
                <span class="col g-2 center"><app-icon name="rocket" [size]="15" />{{ fmt.k(v.supports) }}</span>
                <span class="col g-2 center"><app-icon name="comment" [size]="15" />{{ v.comments }}</span>
                <span class="col g-2 center"><app-icon name="eye" [size]="15" />{{ fmt.k(v.views) }}</span>
              </div>
              <div class="reel__body col g-6">
                <div class="row g-8">
                  <app-av [name]="name(v.authorId)" [size]="24" />
                  <span class="tiny b" style="color:#fff">{{ name(v.authorId) }}</span>
                </div>
                <span class="sm b clamp-2" style="color:#fff;line-height:1.35">{{ v.title }}</span>
                @if (v.milestone) {
                  <span class="tag" style="background:rgba(255,255,255,.2);color:#fff;align-self:flex-start">🏁 {{ v.milestone }}</span>
                }
              </div>
            </div>
            <div class="row between">
              <span class="tiny faint clamp-2">{{ v.caption }}</span>
              @if (v.startupId) {
                <a class="link tiny nowrap" [routerLink]="['/s', slug(v.startupId)]">{{ startupName(v.startupId) }} →</a>
              }
            </div>
          </div>
        }
      </div>

      @if (!list().length) {
        <app-empty icon="video" title="No clips in this category" text="Try another filter." />
      }

      <div class="mockbar mt-24" style="border:1px dashed var(--line);border-radius:10px">
        <app-icon name="lock" [size]="12" /> Video playback is mocked — thumbnails are generated, nothing streams
      </div>
    </div>
  `,
  styles: [`
    .vgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(196px, 1fr)); gap: 16px; }
    @media (max-width: 560px) { .vgrid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; } }
  `],
})
export class VideosPage {
  readonly store = inject(Store);
  readonly fmt = fmt;
  readonly cat = signal('all');

  readonly categories = computed(() => [...new Set(this.store.videos().map(v => v.category))]);
  readonly list = computed(() => {
    const c = this.cat();
    return c === 'all' ? this.store.videos() : this.store.videos().filter(v => v.category === c);
  });

  name = (id: string) => this.store.person(id)?.name ?? '';
  slug = (id: string) => this.store.startup(id)?.slug ?? '';
  startupName = (id: string) => this.store.startup(id)?.name ?? '';
  play = (title: string) => this.store.toast(`"${title}" — playback is mocked in this demo`, '🎬');
}
