import { AfterViewChecked, Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Store } from '../core/store';
import { ME_ID } from '../core/mock-data';
import { ChatMessage, Person, Thread } from '../core/models';
import { UI } from '../ui/ui';

const QUICK = [
  'Sent — happy to walk through the numbers this week.',
  'Thanks for backing the round. Next update goes out Friday.',
  'Could you look at our onboarding flow before we ship it?',
];

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [RouterLink, FormsModule, UI],
  template: `
    <div class="page page--narrow">
      <div class="page-head">
        <div class="col g-6">
          <h1 class="display-lg">Messages</h1>
          <span class="muted sm">
            Conversations that came out of your build — supporters, mentors and programmes.
          </span>
        </div>
      </div>

      <div class="msgrid">
        <!-- ---------------- thread list ---------------- -->
        <div class="card mlist" [class.mlist--hidden]="mobileChat()">
          <div class="card__head" style="padding:12px 14px">
            <span class="up faint">Inbox</span>
            @if (store.unreadMsgs()) { <span class="tag tag--brand">{{ store.unreadMsgs() }} unread</span> }
          </div>
          <div class="col" style="padding:6px">
            @for (t of store.threads(); track t.id) {
              <div class="thread-i" [class.on]="t.id === activeId()" (click)="open(t.id)">
                <app-av [name]="name(t.withId)" [size]="42" [verified]="verified(t.withId)" />
                <div class="grow col g-2" style="min-width:0">
                  <div class="row between g-8">
                    <span class="sm b clamp-1">{{ name(t.withId) }}</span>
                    <span class="tiny faint nowrap">{{ last(t)?.at }}</span>
                  </div>
                  <span class="tiny faint clamp-1">{{ preview(t) }}</span>
                  <span class="tiny brand-text clamp-1">{{ t.context }}</span>
                </div>
                @if (t.unread) { <span class="unread-dot"></span> }
              </div>
            }
          </div>
        </div>

        <!-- ---------------- chat pane ---------------- -->
        @if (active(); as t) {
          <div class="card mchat" [class.mchat--hidden]="!mobileChat()">
            <div class="card__head" style="padding:11px 14px">
              <div class="row g-10" style="min-width:0">
                <button class="btn btn--icon btn--xs mobile-only" (click)="mobileChat.set(false)">
                  <app-icon name="chevR" [size]="14" style="transform:rotate(180deg)" />
                </button>
                <app-av [name]="name(t.withId)" [size]="38" [verified]="verified(t.withId)" />
                <div class="col g-2" style="min-width:0">
                  <a class="sm b hoverline" [routerLink]="['/u', handle(t.withId)]">{{ name(t.withId) }}</a>
                  <span class="tiny faint clamp-1">{{ title(t.withId) }}</span>
                </div>
              </div>
              <span class="tag tag--outline nowrap">{{ t.context }}</span>
            </div>

            <div class="mbody" #scroller>
              <div class="chat">
                <div class="row center">
                  <span class="tiny faint">Conversation started around this startup</span>
                </div>
                @for (m of t.messages; track m.id) {
                  <div class="msg" [class.msg--me]="mine(m)">
                    @if (!mine(m)) { <app-av [name]="name(t.withId)" [size]="30" /> }
                    <div class="msg__b">
                      @if (!mine(m)) { <div class="msg__h">{{ name(t.withId) }}</div> }
                      {{ m.text }}
                      <div class="tiny" style="opacity:.6;margin-top:5px">{{ m.at }}</div>
                    </div>
                  </div>
                }
                @if (waiting()) {
                  <div class="msg">
                    <app-av [name]="name(t.withId)" [size]="30" />
                    <div class="msg__b"><span class="typing"><i></i><i></i><i></i></span></div>
                  </div>
                }
              </div>
            </div>

            <div class="col g-10" style="padding:12px 14px;border-top:1px solid var(--line-2)">
              <div class="scroll-x row g-6">
                @for (q of quick; track q) {
                  <button class="chip chip--sm nowrap" (click)="draft = q">{{ q }}</button>
                }
              </div>
              <div class="composer-bar">
                <textarea class="textarea" rows="1" [(ngModel)]="draft" placeholder="Write a message…"
                  style="border:0;box-shadow:none;padding:6px 4px;min-height:38px;resize:none"
                  (keydown.enter)="onEnter($event)"></textarea>
                <button class="btn btn--primary btn--icon" [disabled]="!draft.trim()" (click)="send()">
                  <app-icon name="send" [size]="16" />
                </button>
              </div>
              <span class="mock-note"><app-icon name="lock" [size]="11" /> Replies are simulated locally — no messages leave this browser</span>
            </div>
          </div>
        } @else {
          <div class="card mchat">
            <app-empty icon="message" title="No conversation selected" text="Pick a thread on the left." />
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .msgrid { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 16px; align-items: start; }
    .mlist { max-height: calc(100vh - 190px); overflow-y: auto; }
    .mchat { display: flex; flex-direction: column; height: calc(100vh - 190px); }
    .mbody { flex: 1; overflow-y: auto; padding: 18px 16px; }
    .unread-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--brand-500); align-self: center; flex: none; }
    @media (max-width: 900px) {
      .msgrid { grid-template-columns: 1fr; }
      .mchat { height: calc(100vh - 240px); }
      .mlist--hidden, .mchat--hidden { display: none; }
    }
  `],
})
export class MessagesPage implements AfterViewChecked {
  readonly store = inject(Store);
  private route = inject(ActivatedRoute);
  private scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  readonly quick = QUICK;

  private query = toSignal(this.route.queryParamMap);
  private picked = signal<string | null>(null);
  readonly mobileChat = signal(false);
  readonly waiting = signal(false);
  private lastCount = 0;
  draft = '';

  readonly activeId = computed(() =>
    this.picked() ?? this.query()?.get('t') ?? this.store.threads()[0]?.id ?? '');
  readonly active = computed<Thread | undefined>(() =>
    this.store.threads().find(t => t.id === this.activeId()));

  constructor() {
    // Opening a thread clears its unread badge, the same way a real inbox would.
    effect(() => {
      const t = this.active();
      if (t && t.unread) this.store.markThreadRead(t.id);
    });
  }

  ngAfterViewChecked(): void {
    const n = this.active()?.messages.length ?? 0;
    if (n === this.lastCount) return;
    this.lastCount = n;
    const el = this.scroller()?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  open(id: string): void {
    this.picked.set(id);
    this.mobileChat.set(true);
    this.draft = '';
  }

  send(): void {
    const text = this.draft.trim();
    const t = this.active();
    if (!text || !t) return;
    this.draft = '';
    this.store.sendMessage(t.id, text);
    this.waiting.set(true);
    setTimeout(() => this.waiting.set(false), 2400);
  }

  onEnter(e: Event): void {
    const ev = e as KeyboardEvent;
    if (ev.shiftKey) return;
    ev.preventDefault();
    this.send();
  }

  mine = (m: ChatMessage) => m.fromId === ME_ID;
  private p = (id: string): Person | undefined => this.store.person(id);
  name = (id: string) => this.p(id)?.name ?? this.store.incubatorById(id)?.name ?? 'Someone';
  handle = (id: string) => this.p(id)?.handle ?? '';
  title = (id: string) => this.p(id)?.title ?? '';
  verified = (id: string) => this.p(id)?.verified ?? false;
  last = (t: Thread): ChatMessage | undefined => t.messages[t.messages.length - 1];
  preview(t: Thread): string {
    const m = this.last(t);
    if (!m) return 'No messages yet';
    return (this.mine(m) ? 'You: ' : '') + m.text;
  }
}
