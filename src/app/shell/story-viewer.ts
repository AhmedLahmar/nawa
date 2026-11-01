import { Component, ElementRef, HostListener, effect, inject, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '../core/store';
import { Viewer } from './viewer';
import { UI } from '../ui/ui';

@Component({
  selector: 'app-story-viewer',
  standalone: true,
  imports: [UI],
  template: `
    @if (v.open() && v.group(); as g) {
      <div class="viewer" role="dialog" aria-modal="true" [attr.aria-label]="'Story from ' + author(g.authorId)">
        <button #closeBtn type="button" class="btn btn--icon viewer__x" (click)="v.close()" aria-label="Close story">
          <app-icon name="x" [size]="18" />
        </button>

        <div class="viewer__card" [style.background]="v.item().gradient">
          <div class="viewer__ticks">
            @for (it of g.items; track it.id; let i = $index) {
              <div class="viewer__tick" [class.done]="i < v.ii()" [class.now]="i === v.ii()"><i></i></div>
            }
          </div>

          <div class="viewer__top">
            <app-av [name]="author(g.authorId)" [size]="34" [emoji]="startupEmoji(g.startupId)" />
            <div class="grow">
              <div class="sm b" style="color:#fff">{{ author(g.authorId) }}</div>
              <div class="tiny" style="color:rgba(255,255,255,.72)">{{ g.label }} · {{ g.at }}</div>
            </div>
          </div>

          <div class="viewer__nav">
            <button type="button" (click)="v.prev()" aria-label="Previous story"></button>
            <button type="button" (click)="v.next()" aria-label="Next story"></button>
          </div>

          @if (v.item(); as it) {
            <div style="position:absolute;inset:0;display:grid;place-items:center;padding:40px 26px;text-align:center;z-index:3">
              <div class="col g-14" style="align-items:center">
                <div style="font-size:62px;line-height:1;filter:drop-shadow(0 6px 18px rgba(0,0,0,.35))">{{ it.emoji }}</div>
                @if (it.quote) {
                  <div style="font-family:var(--display);font-size:22px;font-weight:640;line-height:1.3;color:#fff;letter-spacing:-.02em">
                    “{{ it.quote }}”
                  </div>
                }
                @if (it.milestoneTag) {
                  <span class="day-pill" style="background:rgba(255,255,255,.18);backdrop-filter:blur(8px)">
                    <app-icon name="flag" [size]="12" /> {{ it.milestoneTag }}
                  </span>
                }
              </div>
            </div>

            <div class="viewer__foot">
              <div class="sm" style="color:#fff;font-weight:560">{{ it.caption }}</div>
              <div class="row g-8 mt-12">
                <button class="btn btn--sm" style="background:rgba(255,255,255,.16);border-color:transparent;color:#fff"
                  (click)="support()">
                  <app-icon name="rocket" [size]="14" /> Support
                </button>
                @if (g.startupId) {
                  <button type="button" class="btn btn--sm" style="background:#fff;border-color:#fff;color:#0c0d14"
                    (click)="openStartup(g.startupId!)">
                    View startup <app-icon name="chevR" [size]="14" />
                  </button>
                }
                <span class="tiny" style="color:rgba(255,255,255,.6);margin-left:auto">
                  {{ v.ii() + 1 }} / {{ g.items.length }}
                </span>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class StoryViewer {
  readonly v = inject(Viewer);
  private store = inject(Store);
  private router = inject(Router);
  private closeBtn = viewChild<ElementRef<HTMLButtonElement>>('closeBtn');
  private returnTo: HTMLElement | null = null;

  constructor() {
    // move focus into the viewer when it opens, and back to the trigger when it closes
    effect(() => {
      if (this.v.open()) {
        this.returnTo ??= document.activeElement as HTMLElement | null;
        setTimeout(() => this.closeBtn()?.nativeElement.focus());
      } else if (this.returnTo) {
        this.returnTo.focus();
        this.returnTo = null;
      }
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (!this.v.open()) return;
    if (e.key === 'Escape') this.v.close();
    else if (e.key === 'ArrowRight') this.v.next();
    else if (e.key === 'ArrowLeft') this.v.prev();
  }

  author = (id: string) => this.store.person(id)?.name ?? '';
  startupEmoji = (id?: string) => (id ? this.store.startup(id)?.emoji ?? '' : '');

  support(): void {
    this.store.toast('Story supported 🚀 — the founder is notified', '🚀');
    this.store.addScore('Community contribution', 1);
  }

  openStartup(id: string): void {
    const s = this.store.startup(id);
    this.v.close();
    if (s) this.router.navigate(['/s', s.slug]);
  }
}
