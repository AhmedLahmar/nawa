import { AfterViewChecked, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ME_ID } from '../core/mock-data';
import { GroupMessage } from '../core/models';
import { Store } from '../core/store';
import { fmt, UI } from '../ui/ui';

/* ============================================================
   ROOMS LIST
   ============================================================ */
@Component({
  selector: 'app-rooms-page',
  standalone: true,
  imports: [RouterLink, UI],
  template: `
    <div class="page page--narrow">
      <div class="page-head">
        <div class="col g-6">
          <span class="kicker"><app-icon name="users" [size]="13" /> Community</span>
          <h1 class="display-lg">Chat rooms</h1>
          <span class="muted sm">Group conversations by topic, cohort and challenge. Meet founders working on the same things you are.</span>
        </div>
      </div>

      @if (mine().length) {
        <h4 class="mb-8">Your rooms</h4>
        <div class="grid grid-2 mb-16">
          @for (r of mine(); track r.id) {
            <a class="card card--hover row-t g-12 pad" [routerLink]="['/rooms', r.id]" style="text-decoration:none">
              <app-av [name]="r.name" [emoji]="r.emoji" [gradient]="r.gradient" [size]="44" [square]="true" />
              <div class="grow">
                <span class="b">{{ r.name }}</span>
                <div class="tiny faint clamp-2">{{ r.topic }}</div>
                <div class="tiny faint mt-4"><app-icon name="users" [size]="11" style="display:inline" /> {{ fmt.n(r.memberCount) }} members · {{ r.messages.length }} messages</div>
              </div>
            </a>
          }
        </div>
      }

      <h4 class="mb-8">Discover rooms</h4>
      <div class="grid grid-2">
        @for (r of others(); track r.id) {
          <div class="card card--hover col g-10 pad">
            <div class="row-t g-12">
              <app-av [name]="r.name" [emoji]="r.emoji" [gradient]="r.gradient" [size]="44" [square]="true" />
              <div class="grow">
                <a class="b hoverline" [routerLink]="['/rooms', r.id]">{{ r.name }}</a>
                <div class="tiny faint clamp-2">{{ r.topic }}</div>
              </div>
              <span class="tag tag--outline">{{ r.kind }}</span>
            </div>
            <div class="row between">
              <span class="tiny faint"><app-icon name="users" [size]="11" style="display:inline" /> {{ fmt.n(r.memberCount) }} members</span>
              <button class="btn btn--xs btn--seed" (click)="store.toggleRoom(r.id)">Join</button>
            </div>
          </div>
        }
      </div>

      @if (!others().length && !mine().length) {
        <app-empty icon="users" title="No rooms yet" text="Community rooms will appear here." />
      }

      <span class="mock-note mt-16"><app-icon name="lock" [size]="11" /> Rooms are simulated — messages stay in this browser</span>
    </div>
  `,
})
export class RoomsPage {
  readonly store = inject(Store);
  readonly fmt = fmt;
  readonly mine = computed(() => this.store.rooms().filter(r => r.joined));
  readonly others = computed(() => this.store.rooms().filter(r => !r.joined));
}

/* ============================================================
   ROOM DETAIL (group chat)
   ============================================================ */
@Component({
  selector: 'app-room-page',
  standalone: true,
  imports: [RouterLink, FormsModule, UI],
  template: `
    <div class="page page--narrow">
      @if (room(); as r) {
        <a class="link tiny row g-4 mb-16" routerLink="/rooms"><app-icon name="arrowL" [size]="13" /> All rooms</a>
        <div class="card mchat">
          <div class="card__head" style="padding:11px 14px">
            <div class="row g-10" style="min-width:0">
              <app-av [name]="r.name" [emoji]="r.emoji" [gradient]="r.gradient" [size]="40" [square]="true" />
              <div class="col g-2" style="min-width:0">
                <span class="sm b clamp-1">{{ r.name }}</span>
                <span class="tiny faint clamp-1">{{ fmt.n(r.memberCount) }} members · {{ r.topic }}</span>
              </div>
            </div>
            <button class="btn btn--sm" [class.btn--seed]="!r.joined" (click)="store.toggleRoom(r.id)">
              @if (r.joined) { Joined ✓ } @else { Join }
            </button>
          </div>

          <div class="mbody" #scroller>
            <div class="chat">
              <div class="row center"><span class="tiny faint">{{ r.topic }}</span></div>
              @for (m of r.messages; track m.id) {
                @if (m.system) {
                  <div class="row center"><span class="tiny faint" style="background:var(--brand-50);color:var(--brand-600);padding:3px 10px;border-radius:999px">{{ m.text }}</span></div>
                } @else {
                  <div class="msg" [class.msg--me]="mine(m)">
                    @if (!mine(m)) { <app-av [name]="name(m.fromId)" [size]="30" /> }
                    <div class="msg__b">
                      @if (!mine(m)) { <div class="msg__h">{{ name(m.fromId) }}</div> }
                      {{ m.text }}
                      <div class="tiny" style="opacity:.6;margin-top:5px">{{ m.at }}</div>
                    </div>
                  </div>
                }
              }
            </div>
          </div>

          @if (r.joined) {
            <div class="composer-bar" style="margin:12px 14px">
              <textarea class="textarea" rows="1" [(ngModel)]="draft" placeholder="Message the room…"
                style="border:0;box-shadow:none;padding:6px 4px;min-height:38px;resize:none"
                (keydown.enter)="onEnter($event)"></textarea>
              <button class="btn btn--primary btn--icon" [disabled]="!draft.trim()" (click)="send(r.id)">
                <app-icon name="send" [size]="16" />
              </button>
            </div>
          } @else {
            <div class="col g-8 center" style="padding:14px">
              <span class="tiny faint">Join the room to post a message.</span>
              <button class="btn btn--seed btn--sm" (click)="store.toggleRoom(r.id)">Join room</button>
            </div>
          }
        </div>
      } @else {
        <app-empty icon="users" title="Room not found" text="It may have been removed.">
          <a class="btn btn--primary btn--sm" routerLink="/rooms">Back to rooms</a>
        </app-empty>
      }
    </div>
  `,
  styles: [`
    .mchat { display: flex; flex-direction: column; height: calc(100vh - 210px); }
    .mbody { flex: 1; overflow-y: auto; padding: 18px 16px; }
  `],
})
export class RoomPage implements AfterViewChecked {
  readonly store = inject(Store);
  readonly fmt = fmt;
  private route = inject(ActivatedRoute);
  private scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  private id = toSignal(this.route.paramMap);
  private lastCount = 0;
  draft = '';

  readonly room = computed(() => this.store.room(this.id()?.get('id') ?? undefined));

  ngAfterViewChecked(): void {
    const n = this.room()?.messages.length ?? 0;
    if (n === this.lastCount) return;
    this.lastCount = n;
    const el = this.scroller()?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  mine = (m: GroupMessage) => m.fromId === ME_ID;
  name = (id: string) => this.store.person(id)?.name ?? this.store.incubatorById(id)?.name ?? 'Member';

  send(roomId: string): void {
    const t = this.draft.trim();
    if (!t) return;
    this.draft = '';
    this.store.postToRoom(roomId, t);
  }

  onEnter(e: Event): void {
    const ev = e as KeyboardEvent;
    if (ev.shiftKey) return;
    ev.preventDefault();
    const r = this.room();
    if (r) this.send(r.id);
  }
}
