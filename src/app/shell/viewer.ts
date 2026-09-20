import { computed, Injectable, signal } from '@angular/core';
import { StoryGroup } from '../core/models';
import { Store } from '../core/store';

/** Story viewer state — lives above the router so any page can open it. */
@Injectable({ providedIn: 'root' })
export class Viewer {
  private timer: ReturnType<typeof setTimeout> | null = null;

  readonly groups = signal<StoryGroup[]>([]);
  readonly gi = signal(0);
  readonly ii = signal(0);
  readonly open = computed(() => this.groups().length > 0);
  readonly group = computed(() => this.groups()[this.gi()]);
  readonly item = computed(() => this.group()?.items[this.ii()]);

  constructor(private store: Store) {}

  show(groups: StoryGroup[], index = 0): void {
    this.groups.set(groups);
    this.gi.set(index);
    this.ii.set(0);
    this.arm();
  }

  close(): void {
    this.groups.set([]);
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  next(): void {
    const g = this.group();
    if (!g) return;
    if (this.ii() < g.items.length - 1) {
      this.ii.update(i => i + 1);
    } else {
      this.store.markStorySeen(g.id);
      if (this.gi() < this.groups().length - 1) {
        this.gi.update(i => i + 1);
        this.ii.set(0);
      } else {
        this.close();
        return;
      }
    }
    this.arm();
  }

  prev(): void {
    if (this.ii() > 0) this.ii.update(i => i - 1);
    else if (this.gi() > 0) {
      this.gi.update(i => i - 1);
      this.ii.set(0);
    }
    this.arm();
  }

  private arm(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.next(), 5200);
  }
}
