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

const REACTIONS = ['👍', '❤️', '🚀', '😂', '🙏'];

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [RouterLink, FormsModule, UI],
  template: `
    <div class="page page--narrow">
      <div class="page-head">
        <div class="col g-6">
          <h1 class="display-lg">Messages</h1>
          <span class="muted sm">Conversations that came out of your build — supporters, mentors and programmes.</span>
        </div>
        <button class="btn btn--primary" (click)="composing.set(true)"><app-icon name="edit" [size]="15" /> New message</button>
      </div>

      <div class="msgrid">
        <!-- ---------------- thread list ---------------- -->
        <div class="card mlist" [class.mlist--hidden]="mobileChat()">
          <div class="col g-8" style="padding:12px 12px 6px">
            <div class="row between">
              <span class="up faint">Inbox</span>
              @if (store.unreadMsgs()) { <span class="tag tag--brand">{{ store.unreadMsgs() }} unread</span> }
            </div>
            <div class="searchbar">
              <app-icon name="search" [size]="15" />
              <input class="input" placeholder="Search conversations" [ngModel]="q()" (ngModelChange)="q.set($event)"
                style="border:0;box-shadow:none;background:transparent" />
            </div>
          </div>
          <div class="col" style="padding:6px">
            @for (t of threads(); track t.id) {
              <div class="thread-i" [class.on]="t.id === activeId()" (click)="open(t.id)">
                <div class="rel" style="flex:none">
                  <app-av [name]="name(t.withId)" [size]="44" [verified]="verified(t.withId)" />
                  @if (t.online) { <span class="presence"></span> }
                </div>
                <div class="grow col g-2" style="min-width:0">
                  <div class="row between g-8">
                    <span class="sm b clamp-1">
                      @if (t.pinned) { <app-icon name="bookmark" [size]="11" class="brand-text" /> }
                      {{ name(t.withId) }}
                    </span>
                    <span class="tiny faint nowrap">{{ last(t)?.at }}</span>
                  </div>
                  <span class="tiny faint clamp-1">{{ preview(t) }}</span>
                  <span class="tiny brand-text clamp-1">{{ t.context }}</span>
                </div>
                @if (t.unread) { <span class="unread-dot"></span> }
              </div>
            }
            @if (!threads().length) {
              <div class="center tiny faint" style="padding:20px">No conversations match "{{ q() }}"</div>
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
                <div class="rel" style="flex:none">
                  <app-av [name]="name(t.withId)" [size]="40" [verified]="verified(t.withId)" />
                  @if (t.online) { <span class="presence presence--lg"></span> }
                </div>
                <div class="col g-2" style="min-width:0">
                  <a class="sm b hoverline" [routerLink]="['/u', handle(t.withId)]">{{ name(t.withId) }}</a>
                  <span class="tiny clamp-1" [class.seed-text]="t.online" [class.faint]="!t.online">
                    {{ t.online ? 'Active now' : (t.lastSeen ? 'Active ' + t.lastSeen : title(t.withId)) }}
                  </span>
                </div>
              </div>
              <div class="row g-6">
                <button class="btn btn--icon btn--xs" (click)="store.togglePinThread(t.id)"
                  [title]="t.pinned ? 'Unpin' : 'Pin'">
                  <app-icon name="bookmark" [size]="15" [style.color]="t.pinned ? 'var(--brand-600)' : ''" />
                </button>
                <button class="btn btn--icon btn--xs" (click)="store.toast('Calls are not part of this demo', '📞')">
                  <app-icon name="video" [size]="15" />
                </button>
              </div>
            </div>

            <div class="mbody" #scroller>
              <div class="chat">
                <div class="row center"><span class="tiny faint">{{ t.context }}</span></div>
                @for (m of t.messages; track m.id; let last = $last) {
                  <div class="msg" [class.msg--me]="mine(m)" (dblclick)="react(t.id, m.id, '❤️')">
                    @if (!mine(m)) { <app-av [name]="name(t.withId)" [size]="30" /> }
                    <div class="col g-2" [style.align-items]="mine(m) ? 'flex-end' : 'flex-start'" style="min-width:0">
                      <div class="msg__b rel">
                        @if (!mine(m)) { <div class="msg__h">{{ name(t.withId) }}</div> }
                        @if (m.attachment) {
                          <div class="row g-8 attach">
                            <span style="font-size:18px">{{ m.attachment.emoji }}</span>
                            <span class="sm">{{ m.attachment.label }}</span>
                          </div>
                        }
                        @if (m.text) { <div>{{ m.text }}</div> }
                        <div class="row g-6" style="margin-top:5px;justify-content:flex-end">
                          <span class="tiny" style="opacity:.6">{{ m.at }}</span>
                          @if (mine(m)) {
                            <span class="tiny receipt" [class.receipt--read]="m.read">
                              {{ m.read ? '✓✓' : '✓' }}
                            </span>
                          }
                        </div>
                        @if (m.reaction) { <span class="msg__react">{{ m.reaction }}</span> }
                      </div>
                      <div class="react-bar">
                        @for (e of reactions; track e) {
                          <button (click)="react(t.id, m.id, e)">{{ e }}</button>
                        }
                      </div>
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
              @if (attachment()) {
                <div class="panel row g-8">
                  <span style="font-size:18px">{{ attachment()!.emoji }}</span>
                  <span class="sm grow">{{ attachment()!.label }}</span>
                  <button class="btn btn--ghost btn--icon btn--xs" (click)="attachment.set(null)"><app-icon name="x" [size]="14" /></button>
                </div>
              }
              <div class="scroll-x row g-6">
                @for (qk of quick; track qk) {
                  <button class="chip chip--sm nowrap" (click)="draft = qk">{{ qk }}</button>
                }
              </div>
              <div class="composer-bar">
                <button class="btn btn--ghost btn--icon btn--sm" (click)="attach()"><app-icon name="image" [size]="17" /></button>
                <textarea class="textarea" rows="1" [(ngModel)]="draft" placeholder="Write a message…"
                  style="border:0;box-shadow:none;padding:6px 4px;min-height:38px;resize:none"
                  (keydown.enter)="onEnter($event)"></textarea>
                <button class="btn btn--primary btn--icon" [disabled]="!draft.trim() && !attachment()" (click)="send()">
                  <app-icon name="send" [size]="16" />
                </button>
              </div>
              <span class="mock-note"><app-icon name="lock" [size]="11" /> Replies are simulated locally — no messages leave this browser</span>
            </div>
          </div>
        } @else {
          <div class="card mchat">
            <app-empty icon="message" title="No conversation selected" text="Pick a thread on the left, or start a new message." />
          </div>
        }
      </div>
    </div>

    <!-- new-message people picker -->
    @if (composing()) {
      <div class="modal-scrim" (click)="composing.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="row between">
            <div class="b">New message</div>
            <button class="btn btn--ghost btn--icon btn--sm" (click)="composing.set(false)"><app-icon name="x" [size]="16" /></button>
          </div>
          <div class="searchbar mt-8">
            <app-icon name="search" [size]="15" />
            <input class="input" placeholder="Search people" [ngModel]="pick()" (ngModelChange)="pick.set($event)"
              style="border:0;box-shadow:none;background:transparent" />
          </div>
          <div class="col g-2 mt-8" style="max-height:340px;overflow:auto">
            @for (p of pickList(); track p.id) {
              <button class="hl-row" style="width:100%;text-align:left;background:none;border:0;cursor:pointer" (click)="startWith(p.id)">
                <app-av [name]="p.name" [size]="36" [verified]="p.verified" />
                <span class="grow" style="min-width:0">
                  <span class="sm b" style="display:block">{{ p.name }}</span>
                  <span class="tiny faint clamp-1">{{ p.title }}</span>
                </span>
                <app-icon name="chevR" [size]="15" class="faint" />
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .msgrid { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 16px; align-items: start; }
    .mlist { max-height: calc(100vh - 190px); overflow-y: auto; }
    .mchat { display: flex; flex-direction: column; height: calc(100vh - 190px); }
    .mbody { flex: 1; overflow-y: auto; padding: 18px 16px; }
    .unread-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--brand-500); align-self: center; flex: none; }
    .presence { position: absolute; right: -1px; bottom: -1px; width: 12px; height: 12px; border-radius: 50%;
      background: var(--seed-500); border: 2px solid var(--surface); }
    .presence--lg { width: 13px; height: 13px; }
    .receipt { opacity: .55; }
    .receipt--read { color: var(--brand-600); opacity: 1; }
    .attach { background: var(--canvas-2); border: 1px solid var(--line); border-radius: 9px; padding: 7px 10px; margin-bottom: 5px; }
    .msg__react { position: absolute; bottom: -9px; right: 6px; background: var(--surface); border: 1px solid var(--line);
      border-radius: 999px; font-size: 11px; padding: 0 4px; line-height: 16px; }
    .react-bar { display: none; gap: 2px; margin-top: 3px; }
    .msg:hover .react-bar { display: flex; }
    .react-bar button { background: var(--surface); border: 1px solid var(--line); border-radius: 999px;
      font-size: 13px; line-height: 1; padding: 3px 5px; cursor: pointer; }
    .react-bar button:hover { transform: scale(1.15); }
    .modal-scrim { position: fixed; inset: 0; z-index: 60; background: rgba(10,10,18,.5); backdrop-filter: blur(3px);
      display: grid; place-items: center; padding: 18px; }
    .modal { width: min(420px, 100%); background: var(--surface); border: 1px solid var(--line);
      border-radius: 16px; padding: 16px; box-shadow: 0 24px 60px rgba(0,0,0,.28); }
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
  readonly reactions = REACTIONS;

  private query = toSignal(this.route.queryParamMap);
  private picked = signal<string | null>(null);
  readonly mobileChat = signal(false);
  readonly waiting = signal(false);
  readonly q = signal('');
  readonly composing = signal(false);
  readonly pick = signal('');
  readonly attachment = signal<import('../core/models').ChatAttachment | null>(null);
  private lastCount = 0;
  draft = '';

  /** threads sorted: pinned first, filtered by search */
  readonly threads = computed(() => {
    const term = this.q().toLowerCase().trim();
    return this.store.threads()
      .filter(t => !term || this.name(t.withId).toLowerCase().includes(term) || t.context.toLowerCase().includes(term))
      .slice()
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  });

  readonly activeId = computed(() =>
    this.picked() ?? this.query()?.get('t') ?? this.store.threads()[0]?.id ?? '');
  readonly active = computed<Thread | undefined>(() =>
    this.store.threads().find(t => t.id === this.activeId()));

  readonly pickList = computed(() => {
    const term = this.pick().toLowerCase().trim();
    return this.store.people()
      .filter(p => p.id !== ME_ID)
      .filter(p => !term || p.name.toLowerCase().includes(term) || p.title.toLowerCase().includes(term))
      .slice(0, 12);
  });

  constructor() {
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

  attach(): void {
    this.attachment.set({ kind: 'image', emoji: '📎', label: 'Attachment (simulated)' });
    this.store.toast('Attachment is represented visually in this demo', '📎');
  }

  send(): void {
    const text = this.draft.trim();
    const t = this.active();
    const att = this.attachment();
    if ((!text && !att) || !t) return;
    this.draft = '';
    this.attachment.set(null);
    this.store.sendMessage(t.id, text, att ?? undefined);
    this.waiting.set(true);
    setTimeout(() => this.waiting.set(false), 2400);
  }

  react(threadId: string, messageId: string, emoji: string): void {
    this.store.reactToMessage(threadId, messageId, emoji);
  }

  startWith(personId: string): void {
    const id = this.store.startThread(personId, 'Direct message');
    this.composing.set(false);
    this.pick.set('');
    this.open(id);
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
    const body = m.text || (m.attachment ? m.attachment.label : '');
    return (this.mine(m) ? 'You: ' : '') + body;
  }
}
