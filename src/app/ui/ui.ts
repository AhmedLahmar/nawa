/* ============================================================
   NAWA — UI primitives (icons, avatars, media, charts, meters)
   ============================================================ */

import { Component, computed, input } from '@angular/core';
import { Stage } from '../core/models';

/* ------------------------------------------------------------
   Icon set — 24×24 stroke paths
   ------------------------------------------------------------ */
const ICONS: Record<string, string[]> = {
  home: ['M3 10.6 12 3l9 7.6V20a1 1 0 0 1-1 1h-5v-6.5h-6V21H4a1 1 0 0 1-1-1z'],
  compass: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18', 'm15.6 8.4-2.3 5.3-5.3 2.3 2.3-5.3z'],
  rocket: ['M12 2c3 2.6 5 6.6 5 10.6V22l-5-3-5 3v-9.4C7 8.6 9 4.6 12 2z', 'M12 8.5a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2'],
  dollar: ['M12 2.5v19', 'M17 7c0-2-2.2-3.2-5-3.2S7 5 7 7.3s2.5 3.2 5 4 5 1.6 5 4-2.2 3.4-5 3.4-5-1.3-5-3.2'],
  cap: ['m2 9 10-5 10 5-10 5z', 'M6 11.4V17c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.6'],
  building: ['M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16', 'M15 9h4a1 1 0 0 1 1 1v11', 'M8 8h3', 'M8 12h3', 'M8 16h3', 'M2.5 21h19'],
  bell: ['M18 9a6 6 0 1 0-12 0c0 5-2 6.2-2 6.2h16S18 14 18 9', 'M10.3 19.5a2 2 0 0 0 3.4 0'],
  message: ['M21 11.8a8 8 0 0 1-8 8H8.4L3 22.5l1.4-4.7A8 8 0 1 1 21 11.8z'],
  user: ['M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8', 'M4 21c0-4 3.6-6.6 8-6.6s8 2.6 8 6.6'],
  users: ['M9.5 4a3.8 3.8 0 1 0 0 7.6A3.8 3.8 0 0 0 9.5 4', 'M2 21c0-3.8 3.4-6.2 7.5-6.2S17 17.2 17 21', 'M16.5 5.2a3.4 3.4 0 0 1 0 6.4', 'M18.5 14.9c2 .8 3.5 2.3 3.5 4.3V21'],
  plus: ['M12 5v14', 'M5 12h14'],
  search: ['M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15', 'm16 16 5 5'],
  check: ['m4.5 12.5 5 5L20 6.5'],
  chevR: ['m9 5 7 7-7 7'],
  chevL: ['m15 5-7 7 7 7'],
  chevD: ['m5 9 7 7 7-7'],
  arrowR: ['M4 12h15', 'm13 6 6 6-6 6'],
  arrowL: ['M20 12H5', 'm11 6-6 6 6 6'],
  sparkles: ['M12 3l1.8 4.8L18.6 9.6l-4.8 1.8L12 16.2l-1.8-4.8L5.4 9.6l4.8-1.8z', 'M18.6 15.6l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z'],
  play: ['M7.5 4.6v14.8L20 12z'],
  filter: ['M3.5 5h17l-6.8 8v6.4L10.3 17v-4z'],
  calendar: ['M4 6.5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z', 'M4 10.5h16', 'M8 3v4', 'M16 3v4'],
  star: ['m12 3.4 2.7 5.8 6.3.9-4.5 4.4 1 6.3-5.5-3-5.5 3 1-6.3L3 10.1l6.3-.9z'],
  trending: ['m3 17.5 6-6 4 4 8-8', 'M15 7.5h6v6'],
  target: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18', 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8', 'M12 11.3a.7.7 0 1 0 0 1.4.7.7 0 0 0 0-1.4'],
  heart: ['M12 20.3S4.8 16 4.8 10.8A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7.2 3.2c0 5.2-7.2 9.5-7.2 9.5z'],
  comment: ['M21 11.5a7.5 7.5 0 0 1-7.5 7.5H9.2L4 22l1.3-4.4A7.5 7.5 0 1 1 21 11.5z'],
  share: ['M4 12.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6.5', 'M12 16V3.5', 'm7.6 7.9 4.4-4.4 4.4 4.4'],
  x: ['M6 6l12 12', 'M18 6 6 18'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  image: ['M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z', 'm4 16.5 4.6-4.6 3 3L15 11.4l5.5 5.5', 'M8.6 9.6a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2'],
  video: ['M3 7.5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z', 'm14 10.5 7-4v11l-7-4z'],
  mic: ['M12 4a3 3 0 0 1 3 3v4a3 3 0 0 1-6 0V7a3 3 0 0 1 3-3z', 'M6.5 11a5.5 5.5 0 0 0 11 0', 'M12 16.5V21'],
  flag: ['M5.5 21V4', 'M5.5 5h12l-2 4 2 4h-12'],
  briefcase: ['M4 8h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z', 'M9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2', 'M3 13h18'],
  pin: ['M12 21s7-5.6 7-11.2A7 7 0 1 0 5 9.8C5 15.4 12 21 12 21z', 'M12 8.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8'],
  clock: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18', 'M12 7.2v5.4l3.8 2'],
  more: ['M5.6 10.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8', 'M12 10.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8', 'M18.4 10.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8'],
  edit: ['M5 19h4L19 9a2.1 2.1 0 0 0-3-3L6 16z', 'm14.5 6.5 3 3'],
  eye: ['M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z', 'M12 9.4a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2'],
  chart: ['M5 20V11', 'M12 20V5', 'M19 20v-6', 'M3 21h18'],
  zap: ['M13.5 3 5.5 14H11l-1 7 8.5-11H13z'],
  shield: ['M12 3l8 3v6.2c0 4.8-3.4 7.8-8 8.8-4.6-1-8-4-8-8.8V6z', 'm9 12 2 2 4-4'],
  gift: ['M4 11.5h16V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z', 'M3 7.5h18v4H3z', 'M12 7.5V21', 'M12 7.5C10.4 4.4 8 4 7 5s.5 2.5 5 2.5c4.5 0 5.4-1.5 4.9-2.5S13.6 4.4 12 7.5z'],
  book: ['M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z', 'M8 7.5h7', 'M8 11h7'],
  help: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18', 'M9.6 9.4a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.8', 'M12 17.2h.01'],
  bulb: ['M9.5 18.5h5', 'M10.5 21.2h3', 'M12 3a6 6 0 0 1 3.6 10.8c-.6.5-.6 1.1-.6 1.7H9c0-.6 0-1.2-.6-1.7A6 6 0 0 1 12 3z'],
  alert: ['M12 3 2.6 20h18.8z', 'M12 9.5v5', 'M12 17.2h.01'],
  globe: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18', 'M3.2 12h17.6', 'M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z'],
  layers: ['m12 3 9 5-9 5-9-5z', 'm3 13.2 9 5 9-5'],
  refresh: ['M20.5 12a8.5 8.5 0 1 1-2.5-6', 'M20.5 3.5v5h-5'],
  link: ['M10 13.5a4.2 4.2 0 0 0 6 0l2-2a4.2 4.2 0 0 0-6-6l-1 1', 'M14 10.5a4.2 4.2 0 0 0-6 0l-2 2a4.2 4.2 0 0 0 6 6l1-1'],
  lock: ['M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z', 'M8.5 11V8a3.5 3.5 0 1 1 7 0v3'],
  send: ['M3.5 12 21 4l-7.5 17-2.8-7z', 'm10.7 14.3 10.3-10.3'],
  fire: ['M12 21.2c3.9 0 6.6-2.6 6.6-6.2 0-4.6-4.6-6.1-4.6-9.6-3 1.6-5 3.2-5 5.7 0-1-1-2-1-2-1 1.5-2.6 3-2.6 5.9 0 3.6 2.7 6.2 6.6 6.2z'],
  award: ['M12 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10', 'm8.4 12.6-1.4 8.4 5-2.6 5 2.6-1.4-8.4'],
  grid: ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'],
  pie: ['M12 3a9 9 0 1 0 9 9h-9z', 'M12 3v9h9a9 9 0 0 0-9-9'],
  bookmark: ['M6.5 3h11v18L12 16.6 6.5 21z'],
  clipboard: ['M8 4.5h8a1 1 0 0 1 1 1v1h1.5a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V7.5a1 1 0 0 1 1-1H7v-1a1 1 0 0 1 1-1z', 'm9.5 14 2 2 3.8-4'],
  camera: ['M4 8.5h3l1.4-2h7.2l1.4 2h3a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1z', 'M12 10.5a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8'],
  wallet: ['M3.5 7.5A1.5 1.5 0 0 1 5 6h13a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 18 19H5a1.5 1.5 0 0 1-1.5-1.5z', 'M16 11.5h4.5v3.5H16a1.8 1.8 0 0 1 0-3.5z'],
  logout: ['M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4', 'M16 8l4 4-4 4', 'M20 12H9'],
  minus: ['M5 12h14'],
};

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" [attr.stroke-width]="weight()" stroke-linecap="round" stroke-linejoin="round">
      @for (d of paths(); track $index) { <path [attr.d]="d" /> }
    </svg>`,
})
export class Icon {
  readonly name = input<string>('help');
  readonly size = input<number>(18);
  readonly weight = input<number>(1.8);
  readonly paths = computed(() => ICONS[this.name()] ?? ICONS['help']);
}

/* ------------------------------------------------------------
   Avatar — deterministic gradient from the name
   ------------------------------------------------------------ */
const AV_GRADIENTS = [
  'linear-gradient(135deg,#5a46f0,#9b8cff)',
  'linear-gradient(135deg,#0e9f6a,#5ce0a8)',
  'linear-gradient(135deg,#d98510,#ffcb66)',
  'linear-gradient(135deg,#2b6df4,#7cc0ff)',
  'linear-gradient(135deg,#de3f5c,#ff92a8)',
  'linear-gradient(135deg,#12a4b8,#68e0ef)',
  'linear-gradient(135deg,#7b4df7,#c9a6ff)',
  'linear-gradient(135deg,#3b3e57,#8b90ad)',
];

function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h;
}

@Component({
  selector: 'app-av',
  standalone: true,
  imports: [Icon],
  template: `<div class="av" [class.av--sq]="square()" [class.av--ring]="ring()"
      [style.width.px]="size()" [style.height.px]="size()"
      [style.background]="bg()" [style.font-size.px]="size() * 0.37">
      @if (emoji()) { <span [style.font-size.px]="size() * 0.5">{{ emoji() }}</span> }
      @else { {{ initials() }} }
      @if (verified()) {
        <span class="av__badge" [style.width.px]="badge()" [style.height.px]="badge()">
          <app-icon name="check" [size]="badge() * 0.6" [weight]="3.4" style="color:#fff" />
        </span>
      }
    </div>`,
})
export class Avatar {
  readonly name = input<string>('');
  readonly size = input<number>(40);
  readonly square = input<boolean>(false);
  readonly ring = input<boolean>(false);
  readonly verified = input<boolean>(false);
  readonly emoji = input<string>('');
  readonly gradient = input<string>('');

  readonly bg = computed(() => this.gradient() || AV_GRADIENTS[strHash(this.name()) % AV_GRADIENTS.length]);
  readonly badge = computed(() => Math.max(12, Math.round(this.size() * 0.34)));
  readonly initials = computed(() =>
    this.name().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase());
}

/* ------------------------------------------------------------
   Media placeholder — designed artwork instead of broken images
   ------------------------------------------------------------ */
@Component({
  selector: 'app-media',
  standalone: true,
  imports: [Icon],
  template: `<div class="media" [class]="'media--' + ratio()" [style.background]="gradient()"
      [style.border-radius.px]="radius()">
      <div class="media__in">
        @if (emoji()) { <span class="media__emoji">{{ emoji() }}</span> }
        @if (caption()) { <span class="media__cap">{{ caption() }}</span> }
      </div>
      @if (play()) { <div class="media__play"><app-icon name="play" [size]="20" [weight]="0" /></div> }
      @if (duration() || tag()) {
        <div class="media__meta">
          @if (tag()) { <span class="media__chip">{{ tag() }}</span> }
          @if (duration()) { <span class="media__chip">{{ duration() }}</span> }
        </div>
      }
    </div>`,
  styles: [`.media__play app-icon { margin-left: 3px } .media__play svg { fill: currentColor }`],
})
export class Media {
  readonly emoji = input<string>('');
  readonly caption = input<string>('');
  readonly gradient = input<string>('linear-gradient(135deg,#2b2d42,#4c3fb5)');
  readonly ratio = input<string>('16x9');
  readonly play = input<boolean>(false);
  readonly duration = input<string>('');
  readonly tag = input<string>('');
  readonly radius = input<number>(10);
}

/* ------------------------------------------------------------
   Sparkline
   ------------------------------------------------------------ */
@Component({
  selector: 'app-spark',
  standalone: true,
  template: `<svg [attr.height]="height()" width="100%" [attr.viewBox]="'0 0 100 ' + height()"
      preserveAspectRatio="none" style="display:block;overflow:visible">
      <defs>
        <linearGradient [attr.id]="gid()" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" [attr.stop-color]="color()" stop-opacity="0.28" />
          <stop offset="100%" [attr.stop-color]="color()" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path [attr.d]="area()" [attr.fill]="'url(#' + gid() + ')'" />
      <path [attr.d]="line()" fill="none" [attr.stroke]="color()" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
      @if (dot()) {
        <circle [attr.cx]="last().x" [attr.cy]="last().y" r="2.6" [attr.fill]="color()"
          stroke="#fff" stroke-width="1.4" vector-effect="non-scaling-stroke" />
      }
    </svg>`,
})
export class Sparkline {
  readonly series = input<number[]>([]);
  readonly color = input<string>('var(--brand-600)');
  readonly height = input<number>(38);
  readonly dot = input<boolean>(true);

  private readonly pts = computed(() => {
    const s = this.series();
    if (!s.length) return [] as { x: number; y: number }[];
    const min = Math.min(...s), max = Math.max(...s);
    const span = max - min || 1;
    const h = this.height();
    return s.map((v, i) => ({
      x: s.length === 1 ? 50 : (i / (s.length - 1)) * 100,
      y: h - 3 - ((v - min) / span) * (h - 6),
    }));
  });
  readonly gid = computed(() => 'sg' + strHash(this.series().join(',') + this.color()));
  readonly line = computed(() => this.pts().map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' '));
  readonly area = computed(() => {
    const p = this.pts();
    if (!p.length) return '';
    return `${this.line()} L100 ${this.height()} L0 ${this.height()} Z`;
  });
  readonly last = computed(() => this.pts()[this.pts().length - 1] ?? { x: 0, y: 0 });
}

/* ------------------------------------------------------------
   Bigger area chart with grid + labels
   ------------------------------------------------------------ */
@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [Sparkline],
  template: `<div class="col g-8">
      <div class="row between">
        <span class="tiny b muted">{{ label() }}</span>
        <span class="tiny mono seed-text b">{{ deltaLabel() }}</span>
      </div>
      <div class="rel" [style.height.px]="height()"
        style="background:
          repeating-linear-gradient(to top, var(--line-2) 0 1px, transparent 1px 25%);">
        <app-spark [series]="series()" [color]="color()" [height]="height()" />
      </div>
      <div class="row between tiny faint">
        <span>{{ from() }}</span><span>{{ to() }}</span>
      </div>
    </div>`,
})
export class Chart {
  readonly series = input<number[]>([]);
  readonly label = input<string>('');
  readonly color = input<string>('var(--brand-600)');
  readonly height = input<number>(120);
  readonly from = input<string>('7 weeks ago');
  readonly to = input<string>('now');
  readonly deltaLabel = computed(() => {
    const s = this.series();
    if (s.length < 2 || !s[0]) return '';
    const pct = Math.round(((s[s.length - 1] - s[0]) / Math.abs(s[0] || 1)) * 100);
    return (pct >= 0 ? '+' : '') + pct + '%';
  });
}

/* ------------------------------------------------------------
   Founder score ring
   ------------------------------------------------------------ */
@Component({
  selector: 'app-score-ring',
  standalone: true,
  template: `<div class="ring-wrap" [style.width.px]="size()" [style.height.px]="size()">
      <svg [attr.width]="size()" [attr.height]="size()" [attr.viewBox]="'0 0 ' + size() + ' ' + size()"
        style="transform:rotate(-90deg)">
        <circle [attr.cx]="c()" [attr.cy]="c()" [attr.r]="r()" fill="none" stroke="var(--line-2)" [attr.stroke-width]="sw()" />
        <circle [attr.cx]="c()" [attr.cy]="c()" [attr.r]="r()" fill="none" [attr.stroke]="color()"
          [attr.stroke-width]="sw()" stroke-linecap="round"
          [attr.stroke-dasharray]="circ()" [attr.stroke-dashoffset]="offset()"
          style="transition:stroke-dashoffset .9s cubic-bezier(.2,.7,.3,1)" />
      </svg>
      <div class="ring-wrap__v">
        <div class="bb" [style.font-size.px]="size() * 0.26" style="font-family:var(--display);letter-spacing:-.03em">{{ value() }}</div>
        @if (caption()) { <div class="faint" [style.font-size.px]="Math.max(9, size() * 0.1)">{{ caption() }}</div> }
      </div>
    </div>`,
})
export class ScoreRing {
  readonly value = input<number>(0);
  readonly size = input<number>(96);
  readonly caption = input<string>('/ 100');
  readonly Math = Math;
  readonly sw = computed(() => Math.max(5, this.size() * 0.085));
  readonly c = computed(() => this.size() / 2);
  readonly r = computed(() => this.size() / 2 - this.sw() / 2 - 1);
  readonly circ = computed(() => 2 * Math.PI * this.r());
  readonly offset = computed(() => this.circ() * (1 - Math.min(100, this.value()) / 100));
  readonly color = computed(() =>
    this.value() >= 80 ? 'var(--seed-500)' : this.value() >= 60 ? 'var(--brand-600)' : 'var(--amber-500)');
}

/* ------------------------------------------------------------
   Donut (use of funds)
   ------------------------------------------------------------ */
@Component({
  selector: 'app-donut',
  standalone: true,
  template: `<div class="ring-wrap" [style.width.px]="size()" [style.height.px]="size()">
      <div [style.width.px]="size()" [style.height.px]="size()" [style.background]="cg()"
        style="border-radius:50%"></div>
      <div [style.width.px]="size() * 0.62" [style.height.px]="size() * 0.62"
        style="position:absolute;background:var(--surface);border-radius:50%;display:grid;place-items:center">
        <div class="center">
          <div class="bb" [style.font-size.px]="size() * 0.15" style="font-family:var(--display)">{{ centerTop() }}</div>
          <div class="faint" [style.font-size.px]="size() * 0.08">{{ centerSub() }}</div>
        </div>
      </div>
    </div>`,
})
export class Donut {
  readonly slices = input<{ label: string; pct: number; color: string }[]>([]);
  readonly size = input<number>(150);
  readonly centerTop = input<string>('');
  readonly centerSub = input<string>('');
  readonly cg = computed(() => {
    let acc = 0;
    const parts = this.slices().map(s => {
      const from = acc; acc += s.pct;
      return `${s.color} ${from}% ${acc}%`;
    });
    return `conic-gradient(${parts.join(',')})`;
  });
}

/* ------------------------------------------------------------
   Stage tracker (Idea → Fundraising)
   ------------------------------------------------------------ */
@Component({
  selector: 'app-stages',
  standalone: true,
  imports: [Icon],
  template: `<div class="stages">
      @for (s of stages(); track s.key) {
        <div class="stage" [class.done]="s.status === 'done'" [class.active]="s.status === 'active'">
          <div class="stage__bar"><i [style.width.%]="s.pct"></i></div>
          @if (labels()) {
            <div class="stage__t">
              @if (s.status === 'done') { <app-icon name="check" [size]="10" [weight]="3.4" /> }
              <span>{{ s.label }}</span>
              @if (s.status === 'active' && s.pct > 0) { <span class="mono">{{ s.pct }}%</span> }
            </div>
          }
        </div>
      }
    </div>`,
})
export class StageTracker {
  readonly stages = input<Stage[]>([]);
  readonly labels = input<boolean>(true);
}

/* ------------------------------------------------------------
   Progress bar
   ------------------------------------------------------------ */
@Component({
  selector: 'app-bar',
  standalone: true,
  template: `<div class="bar" [class.bar--thin]="thin()" [class.bar--thick]="thick()">
      <div class="bar__fill" [class]="'bar__fill--' + tone()" [style.width.%]="clamped()"></div>
    </div>`,
})
export class Bar {
  readonly pct = input<number>(0);
  readonly tone = input<'brand' | 'seed' | 'amber'>('brand');
  readonly thin = input<boolean>(false);
  readonly thick = input<boolean>(false);
  readonly clamped = computed(() => Math.max(0, Math.min(100, this.pct())));
}

/* ------------------------------------------------------------
   Empty state
   ------------------------------------------------------------ */
@Component({
  selector: 'app-empty',
  standalone: true,
  imports: [Icon],
  template: `<div class="empty">
      <div class="empty__ic"><app-icon [name]="icon()" [size]="24" /></div>
      <h4>{{ title() }}</h4>
      <p class="muted sm" style="max-width:340px">{{ text() }}</p>
      <ng-content />
    </div>`,
})
export class Empty {
  readonly icon = input<string>('sparkles');
  readonly title = input<string>('Nothing here yet');
  readonly text = input<string>('');
}

/* ------------------------------------------------------------
   Convenience bundle
   ------------------------------------------------------------ */
export const UI = [Icon, Avatar, Media, Sparkline, Chart, ScoreRing, Donut, StageTracker, Bar, Empty] as const;

/* ---------------- formatting helpers ---------------- */
export const fmt = {
  n: (n: number) => n.toLocaleString('en-US'),
  k: (n: number) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '') + 'k' : String(n)),
  money: (n: number, cur = 'TND') => n.toLocaleString('en-US') + ' ' + cur,
  pct: (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0),
};
