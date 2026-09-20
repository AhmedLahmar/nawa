import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LiveChatMessage } from '../core/models';
import { Store } from '../core/store';
import { fmt, UI } from '../ui/ui';

/* ============================================================
   LIVE DISCOVERY — grid of live + upcoming streams
   ============================================================ */
@Component({
  selector: 'app-live-page',
  standalone: true,
  imports: [RouterLink, UI],
  template: `
    <div class="page">
      <div class="page-head">
        <div class="col g-6">
          <span class="kicker"><span class="live-dot"></span> Nawa Live</span>
          <h1 class="display-lg">Live now</h1>
          <span class="muted sm">Founders building, coding and pitching in real time. Drop a gift to support them live.</span>
        </div>
        <button class="btn btn--primary" (click)="goLive()"><app-icon name="video" [size]="15" /> Go live</button>
      </div>

      @if (live().length) {
        <div class="grid grid-3 mb-16">
          @for (l of live(); track l.id) {
            <a class="live-card card card--hover" [routerLink]="['/live', l.id]">
              <div class="live-card__thumb" [style.background]="l.gradient">
                <span class="live-badge"><span class="live-dot"></span> LIVE</span>
                <span class="live-viewers"><app-icon name="eye" [size]="12" /> {{ fmt.k(l.viewers) }}</span>
                <span class="live-card__emoji">{{ l.emoji }}</span>
              </div>
              <div class="col g-6 pad-sm">
                <div class="row g-8">
                  <app-av [name]="host(l.hostId)" [size]="30" [verified]="verified(l.hostId)" />
                  <span class="grow" style="min-width:0">
                    <span class="sm b clamp-2" style="line-height:1.3">{{ l.title }}</span>
                    <span class="tiny faint">{{ host(l.hostId) }} · {{ l.category }}</span>
                  </span>
                </div>
                <div class="row g-10 tiny faint">
                  <span>❤️ {{ fmt.k(l.hearts) }}</span>
                  <span>🎁 {{ fmt.money(l.raised, l.currency) }}</span>
                </div>
              </div>
            </a>
          }
        </div>
      } @else {
        <app-empty icon="video" title="Nobody is live right now"
          text="Be the first — go live and show what you're building." />
      }

      @if (upcoming().length) {
        <h4 class="mt-16 mb-8">Scheduled</h4>
        <div class="grid grid-3">
          @for (l of upcoming(); track l.id) {
            <div class="card col g-8 pad-sm">
              <div class="row g-8">
                <app-av [name]="host(l.hostId)" [emoji]="l.emoji" [gradient]="l.gradient" [size]="34" [square]="true" />
                <span class="grow">
                  <span class="sm b clamp-2">{{ l.title }}</span>
                  <span class="tiny faint">{{ host(l.hostId) }}</span>
                </span>
              </div>
              <div class="row between">
                <span class="tag tag--amber"><app-icon name="clock" [size]="11" /> {{ l.scheduledFor }}</span>
                <button class="btn btn--xs" (click)="remind(l.title)"><app-icon name="bell" [size]="12" /> Remind me</button>
              </div>
            </div>
          }
        </div>
      }

      <span class="mock-note mt-16"><app-icon name="lock" [size]="11" /> Streams, viewers and gifts are simulated — no real video and no real payments</span>
    </div>
  `,
  styles: [`
    .live-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--rose-500); display: inline-block;
      box-shadow: 0 0 0 0 rgba(222,63,92,.6); animation: livepulse 1.6s infinite; }
    @keyframes livepulse { 0% { box-shadow: 0 0 0 0 rgba(222,63,92,.5) } 70% { box-shadow: 0 0 0 7px rgba(222,63,92,0) } 100% { box-shadow: 0 0 0 0 rgba(222,63,92,0) } }
    .live-card { overflow: hidden; text-decoration: none; }
    .live-card__thumb { position: relative; aspect-ratio: 16/10; display: grid; place-items: center; }
    .live-card__emoji { font-size: 44px; filter: drop-shadow(0 6px 18px rgba(0,0,0,.3)); }
    .live-badge { position: absolute; top: 9px; left: 9px; display: flex; align-items: center; gap: 5px;
      background: rgba(10,10,18,.55); backdrop-filter: blur(6px); color: #fff; font-size: 10.5px; font-weight: 700;
      padding: 3px 8px; border-radius: 999px; letter-spacing: .04em; }
    .live-viewers { position: absolute; top: 9px; right: 9px; display: flex; align-items: center; gap: 4px;
      background: rgba(10,10,18,.55); backdrop-filter: blur(6px); color: #fff; font-size: 11px; padding: 3px 8px; border-radius: 999px; }
  `],
})
export class LivePage {
  readonly store = inject(Store);
  private router = inject(Router);
  readonly fmt = fmt;
  readonly live = computed(() => this.store.liveNow());
  readonly upcoming = computed(() => this.store.upcomingLives());

  host = (id: string) => this.store.person(id)?.name ?? 'Host';
  verified = (id: string) => this.store.person(id)?.verified ?? false;

  remind(title: string): void { this.store.toast(`We'll remind you before "${title}"`, '🔔'); }
  goLive(): void {
    this.store.toast('Live capture is simulated — jump into a live stream to see the experience', '🎬');
    const first = this.live()[0];
    if (first) this.router.navigate(['/live', first.id]);
  }
}

/* ============================================================
   LIVE VIEWER — full-screen TikTok-style stream
   ============================================================ */
interface FloatHeart { id: number; left: number; }

@Component({
  selector: 'app-live-viewer-page',
  standalone: true,
  imports: [RouterLink, FormsModule, UI],
  template: `
    @if (stream(); as l) {
      <div class="lv" [style.background]="l.gradient">
        <!-- ambient backdrop -->
        <div class="lv__scene">
          <span class="lv__hero">{{ l.emoji }}</span>
        </div>

        <!-- top bar -->
        <div class="lv__top">
          <a class="lv__host" [routerLink]="['/u', hostHandle()]">
            <app-av [name]="hostName()" [size]="38" [verified]="hostVerified()" />
            <span class="col" style="min-width:0">
              <span class="sm b" style="color:#fff">{{ hostName() }}</span>
              <span class="tiny" style="color:rgba(255,255,255,.75)">{{ l.category }}</span>
            </span>
          </a>
          <span class="lv__badge"><span class="live-dot"></span> LIVE</span>
          <span class="lv__viewers"><app-icon name="eye" [size]="13" /> {{ fmt.k(viewers()) }}</span>
          <button class="btn btn--icon" style="background:rgba(0,0,0,.35);color:#fff;border:0" (click)="close()">
            <app-icon name="x" [size]="18" />
          </button>
        </div>

        <div class="lv__title">{{ l.title }}</div>

        <!-- floating hearts -->
        <div class="lv__hearts">
          @for (h of hearts(); track h.id) {
            <span class="lv__heart" [style.left.%]="h.left">❤️</span>
          }
        </div>

        <!-- chat stream -->
        <div class="lv__chat">
          @for (m of chat(); track m.id) {
            <div class="lv__msg" [class.lv__msg--gift]="m.giftId" [class.lv__msg--sys]="m.system">
              @if (m.system) {
                <span class="lv__sys">{{ m.text }}</span>
              } @else if (m.giftId) {
                <span><b>{{ author(m.authorId) }}</b> sent {{ giftEmoji(m.giftId) }} <b class="amber">{{ m.amount }} {{ l.currency }}</b></span>
              } @else {
                <span><b>{{ author(m.authorId) }}</b> {{ m.text }}</span>
              }
            </div>
          }
        </div>

        <!-- raised chip -->
        <div class="lv__raised">🎁 {{ fmt.money(raised(), l.currency) }} raised this stream</div>

        <!-- gift bar -->
        <div class="lv__gifts">
          @for (g of store.gifts; track g.id) {
            <button class="lv__gift" (click)="sendGift(g.id)">
              <span style="font-size:20px">{{ g.emoji }}</span>
              <span class="tiny">{{ g.amount }}</span>
            </button>
          }
        </div>

        <!-- composer + heart -->
        <div class="lv__bar">
          <input class="lv__input" [(ngModel)]="msg" placeholder="Say something…" (keydown.enter)="say()" />
          <button class="lv__send" (click)="say()"><app-icon name="send" [size]="18" /></button>
          <button class="lv__like" (click)="like()"><app-icon name="heart" [size]="20" /></button>
        </div>

        <span class="lv__mock"><app-icon name="lock" [size]="11" /> Simulated live — no real video or payment</span>
      </div>
    } @else {
      <div class="page">
        <app-empty icon="video" title="Stream not found" text="It may have ended.">
          <a class="btn btn--primary btn--sm" routerLink="/live">Back to Live</a>
        </app-empty>
      </div>
    }
  `,
  styles: [`
    .lv { position: fixed; inset: 0; z-index: 55; overflow: hidden; display: flex; flex-direction: column; }
    .lv__scene { position: absolute; inset: 0; display: grid; place-items: center; }
    .lv__hero { font-size: 132px; opacity: .5; filter: drop-shadow(0 12px 40px rgba(0,0,0,.4)); animation: bob 4s ease-in-out infinite; }
    @keyframes bob { 0%,100% { transform: translateY(-6px) } 50% { transform: translateY(6px) } }
    .lv__top { position: relative; z-index: 3; display: flex; align-items: center; gap: 10px; padding: 14px 14px 0; }
    .lv__host { display: flex; align-items: center; gap: 9px; text-decoration: none; flex: 1; min-width: 0; }
    .lv__badge { display: flex; align-items: center; gap: 5px; background: rgba(10,10,18,.5); color: #fff;
      font-size: 10.5px; font-weight: 700; padding: 4px 9px; border-radius: 999px; letter-spacing: .04em; }
    .lv__viewers { display: flex; align-items: center; gap: 4px; background: rgba(10,10,18,.5); color: #fff;
      font-size: 12px; padding: 4px 9px; border-radius: 999px; }
    .live-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--rose-500); display: inline-block; animation: livepulse 1.6s infinite; }
    @keyframes livepulse { 0% { box-shadow: 0 0 0 0 rgba(222,63,92,.5) } 70% { box-shadow: 0 0 0 7px rgba(222,63,92,0) } 100% { box-shadow: 0 0 0 0 rgba(222,63,92,0) } }
    .lv__title { position: relative; z-index: 3; color: #fff; font-weight: 640; padding: 10px 16px 0; max-width: 640px;
      text-shadow: 0 2px 12px rgba(0,0,0,.4); font-family: var(--display); }
    .lv__hearts { position: absolute; inset: 0; z-index: 2; pointer-events: none; }
    .lv__heart { position: absolute; bottom: 150px; font-size: 26px; animation: rise 3.2s ease-out forwards; }
    @keyframes rise { 0% { transform: translateY(0) scale(.6); opacity: 0 } 12% { opacity: 1 } 100% { transform: translateY(-46vh) scale(1.2) rotate(18deg); opacity: 0 } }
    .lv__chat { position: relative; z-index: 3; margin-top: auto; padding: 0 16px 8px; max-width: 560px;
      display: flex; flex-direction: column; gap: 6px; max-height: 42vh; overflow: hidden; -webkit-mask-image: linear-gradient(transparent, #000 24%); mask-image: linear-gradient(transparent, #000 24%); }
    .lv__msg { color: #fff; font-size: 13px; line-height: 1.35; background: rgba(10,10,18,.32); backdrop-filter: blur(4px);
      padding: 6px 10px; border-radius: 12px; width: fit-content; max-width: 100%; text-shadow: 0 1px 4px rgba(0,0,0,.3); animation: msgin .28s ease; }
    @keyframes msgin { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
    .lv__msg--gift { background: rgba(245,165,36,.32); }
    .lv__msg--sys { background: rgba(90,70,240,.34); }
    .lv__sys { font-weight: 600; }
    .lv .amber { color: #ffd98a; }
    .lv__raised { position: relative; z-index: 3; margin: 0 16px 8px; align-self: flex-start; color: #fff; font-weight: 600;
      font-size: 12.5px; background: rgba(10,10,18,.4); padding: 5px 11px; border-radius: 999px; }
    .lv__gifts { position: relative; z-index: 3; display: flex; gap: 7px; padding: 0 12px 10px; overflow-x: auto; }
    .lv__gift { flex: none; display: flex; flex-direction: column; align-items: center; gap: 1px; color: #fff;
      background: rgba(10,10,18,.4); border: 0; border-radius: 12px; padding: 7px 11px; cursor: pointer; }
    .lv__gift:hover { background: rgba(245,165,36,.4); }
    .lv__bar { position: relative; z-index: 3; display: flex; gap: 8px; padding: 0 12px 12px; align-items: center; }
    .lv__input { flex: 1; height: 42px; border-radius: 999px; border: 0; background: rgba(10,10,18,.42);
      color: #fff; padding: 0 16px; font-size: 13.5px; outline: none; }
    .lv__input::placeholder { color: rgba(255,255,255,.6); }
    .lv__send, .lv__like { width: 42px; height: 42px; border-radius: 50%; border: 0; cursor: pointer; color: #fff;
      display: grid; place-items: center; flex: none; }
    .lv__send { background: var(--brand-600); }
    .lv__like { background: var(--rose-500); }
    .lv__like:active { transform: scale(.86); }
    .lv__mock { position: relative; z-index: 3; color: rgba(255,255,255,.7); font-size: 10.5px; display: flex;
      align-items: center; gap: 5px; padding: 0 16px 10px; }
  `],
})
export class LiveViewerPage implements OnDestroy {
  readonly store = inject(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly fmt = fmt;

  private id = toSignal(this.route.paramMap);
  readonly stream = computed(() => this.store.livestream(this.id()?.get('id') ?? undefined));

  readonly chat = signal<LiveChatMessage[]>([]);
  readonly hearts = signal<FloatHeart[]>([]);
  readonly viewers = signal(0);
  readonly raised = signal(0);

  private timers: ReturnType<typeof setTimeout>[] = [];
  private ticker: ReturnType<typeof setInterval> | null = null;
  private heartSeq = 0;
  msg = '';

  // scripted incoming chatter to make the stream feel alive
  private readonly scriptLines = [
    { authorId: 's_leila', text: 'This is great 🙌' },
    { authorId: 'p_ines', text: 'How long did that take to build?' },
    { authorId: 's_bilal', text: 'The UI is so clean' },
    { authorId: 'e_dina', text: 'Love the transparency here' },
    { authorId: 's_fatma', text: '', giftId: 'g_fire', amount: 10 },
    { authorId: 'p_hamza', text: 'Following now 🔥' },
    { authorId: 's_leila', text: '', giftId: 'g_rocket', amount: 25 },
    { authorId: 'p_mariem', text: 'Can you show that part again?' },
    { authorId: 'e_karim', text: 'Solid cadence 👏' },
  ];
  private scriptIdx = 0;

  constructor() {
    const s = this.stream();
    if (s) {
      this.chat.set([...s.seedChat]);
      this.viewers.set(s.viewers);
      this.raised.set(s.raised);
      this.startSimulation();
    }
  }

  private startSimulation(): void {
    // viewers drift up and down; a scripted chat line lands every ~3.5s
    this.ticker = setInterval(() => {
      this.viewers.update(v => Math.max(1, v + Math.round((Math.random() - 0.35) * 6)));
    }, 2600);

    const pump = () => {
      const line = this.scriptLines[this.scriptIdx % this.scriptLines.length];
      this.scriptIdx++;
      this.pushChat({ ...line });
      if (line.giftId && line.amount) {
        this.raised.update(r => r + line.amount!);
        this.floatHeart();
      }
      const t = setTimeout(pump, 2800 + Math.random() * 2200);
      this.timers.push(t);
    };
    const first = setTimeout(pump, 1800);
    this.timers.push(first);
  }

  private pushChat(line: Omit<LiveChatMessage, 'id'>): void {
    const full = this.store.liveChatLine(line);
    this.chat.update(c => [...c, full].slice(-40));
  }

  private floatHeart(): void {
    const h: FloatHeart = { id: ++this.heartSeq, left: 60 + Math.random() * 34 };
    this.hearts.update(list => [...list, h]);
    const t = setTimeout(() => this.hearts.update(list => list.filter(x => x.id !== h.id)), 3200);
    this.timers.push(t);
  }

  author = (id: string) => this.store.person(id)?.name?.split(' ')[0] ?? 'Guest';
  giftEmoji = (id?: string) => (id ? this.store.gift(id)?.emoji ?? '🎁' : '🎁');
  hostName = () => this.store.person(this.stream()?.hostId ?? '')?.name ?? 'Host';
  hostHandle = () => this.store.person(this.stream()?.hostId ?? '')?.handle ?? '';
  hostVerified = () => this.store.person(this.stream()?.hostId ?? '')?.verified ?? false;

  say(): void {
    const t = this.msg.trim();
    if (!t) return;
    this.pushChat({ authorId: 'u_me', text: t });
    this.msg = '';
  }

  like(): void {
    const s = this.stream();
    if (s) this.store.heartLive(s.id);
    this.floatHeart();
  }

  sendGift(giftId: string): void {
    const s = this.stream();
    if (!s) return;
    const g = this.store.gift(giftId);
    this.store.sendLiveGift(s.id, giftId);
    this.raised.update(r => r + (g?.amount ?? 0));
    this.pushChat({ authorId: 'u_me', text: '', giftId, amount: g?.amount });
    this.floatHeart();
  }

  close(): void { this.router.navigate(['/live']); }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
    if (this.ticker) clearInterval(this.ticker);
  }
}
