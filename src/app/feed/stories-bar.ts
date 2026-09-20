import { Component, inject } from '@angular/core';
import { Store } from '../core/store';
import { Viewer } from '../shell/viewer';
import { UI } from '../ui/ui';

@Component({
  selector: 'app-stories-bar',
  standalone: true,
  imports: [UI],
  template: `
    <div class="card pad-sm">
      <div class="stories">
        <div class="story story--add" (click)="add()">
          <div class="story__ring">
            <div class="story__inner" style="display:grid;place-items:center;background:var(--brand-50);color:var(--brand-600)">
              <app-icon name="plus" [size]="22" [weight]="2.2" />
            </div>
          </div>
          <div class="story__name">Your story</div>
        </div>

        @for (g of store.stories(); track g.id; let i = $index) {
          <div class="story" (click)="open(i)">
            <div class="story__ring" [class.story__ring--seen]="store.isStorySeen(g.id)">
              <div class="story__inner">
                <app-av [name]="store.person(g.authorId)?.name ?? ''" [size]="63"
                  [emoji]="store.startup(g.startupId)?.emoji ?? ''"
                  [gradient]="store.startup(g.startupId)?.gradient ?? ''" />
              </div>
            </div>
            <div class="story__name">{{ first(store.person(g.authorId)?.name) }}</div>
          </div>
        }
      </div>
      <div class="row g-6 tiny faint" style="padding:2px 2px 0">
        <app-icon name="zap" [size]="12" />
        Daily moments from founders you follow — milestones, demos, honest days.
      </div>
    </div>
  `,
})
export class StoriesBar {
  readonly store = inject(Store);
  private viewer = inject(Viewer);

  first = (name?: string) => (name ?? '').split(' ')[0];

  open(i: number): void {
    this.viewer.show(this.store.stories(), i);
  }

  add(): void {
    this.store.toast('Story capture is mocked in this demo — publish an update instead', '📸');
  }
}
