import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Post, PostType } from '../core/models';
import { Store } from '../core/store';
import { UI } from '../ui/ui';

interface TypeDef { key: PostType; label: string; emoji: string; placeholder: string; tip: string }

const TYPES: TypeDef[] = [
  { key: 'build', label: 'Build update', emoji: '🛠️', placeholder: 'What did you build or learn today? Include one number.', tip: 'Best updates name the day, one shipped thing, and one metric.' },
  { key: 'progress', label: 'Progress', emoji: '📈', placeholder: 'What moved this week?', tip: 'Progress posts travel further with a chart or a screenshot.' },
  { key: 'question', label: 'Validation', emoji: '❓', placeholder: 'Ask the community something you genuinely cannot decide alone.', tip: 'Add a poll — you will get 10× more answers than an open question.' },
  { key: 'failure', label: 'Failure & lesson', emoji: '💥', placeholder: 'What did not work, and what you now believe instead.', tip: 'Failure posts build more trust here than launch posts. Be specific.' },
  { key: 'achievement', label: 'Achievement', emoji: '🏆', placeholder: 'What did you reach? First customer, revenue, launch…', tip: 'Achievements with proof become verified badges on your profile.' },
  { key: 'help', label: 'Help wanted', emoji: '🤝', placeholder: 'What role, skill or intro do you need?', tip: 'Say exactly what the person would do in their first two weeks.' },
  { key: 'funding', label: 'Funding', emoji: '💰', placeholder: 'Share your campaign news and where the money goes.', tip: 'Link the milestone the money unlocks, not just the amount.' },
  { key: 'educational', label: 'Playbook', emoji: '📚', placeholder: 'Teach something you learned the hard way.', tip: 'Teaching is the cheapest way to grow a following as a founder.' },
];

@Component({
  selector: 'app-composer',
  standalone: true,
  imports: [FormsModule, UI],
  template: `
    <div class="card" [class.card--tint]="open()">
      @if (!open()) {
        <div class="row g-11 pad-sm">
          <app-av [name]="store.me().name" [size]="40" />
          <button class="ghost-input grow" (click)="open.set(true)">
            {{ collapsedLabel() }}
          </button>
        </div>
        <div class="row g-6 scroll-x" style="padding:0 14px 12px">
          @for (t of types.slice(0, 5); track t.key) {
            <button class="chip chip--sm" (click)="start(t.key)">{{ t.emoji }} {{ t.label }}</button>
          }
        </div>
      } @else {
        <div class="col g-12 pad">
          <div class="row between">
            <div class="row g-10">
              <app-av [name]="store.me().name" [size]="38" />
              <div>
                <div class="sm b">{{ store.me().name }}</div>
                @if (startup(); as s) {
                  <div class="tiny faint">{{ s.emoji }} {{ s.name }} · Day {{ s.day }}</div>
                }
              </div>
            </div>
            <button class="btn btn--ghost btn--icon btn--sm" (click)="cancel()"><app-icon name="x" [size]="16" /></button>
          </div>

          <div class="row g-6 scroll-x">
            @for (t of types; track t.key) {
              <button class="chip chip--sm" [class.chip--on]="type() === t.key" (click)="type.set(t.key)">
                {{ t.emoji }} {{ t.label }}
              </button>
            }
          </div>

          <textarea class="textarea" [placeholder]="def().placeholder" [(ngModel)]="text" rows="4"></textarea>

          <div class="row g-6 tiny faint">
            <app-icon name="bulb" [size]="13" class="brand-text" /> {{ def().tip }}
          </div>

          @if (media()) {
            <div class="panel row g-10">
              <span style="font-size:22px">{{ mediaEmoji() }}</span>
              <span class="grow">
                <span class="sm b" style="display:block">{{ mediaLabel() }}</span>
                <span class="tiny faint">Attachment is represented visually in this demo — no upload happens.</span>
              </span>
              <button class="btn btn--ghost btn--icon btn--sm" (click)="media.set(null)"><app-icon name="x" [size]="15" /></button>
            </div>
          }

          @if (poll()) {
            <div class="panel col g-8">
              <input class="input" placeholder="Poll question" [(ngModel)]="pollQ" />
              @for (o of pollOpts; track $index; let i = $index) {
                <input class="input" [placeholder]="'Option ' + (i + 1)" [(ngModel)]="pollOpts[i]" />
              }
              <button class="btn btn--sm" (click)="pollOpts.push('')" [disabled]="pollOpts.length >= 4">
                <app-icon name="plus" [size]="13" /> Add option
              </button>
            </div>
          }

          <div class="divider"></div>

          <div class="row between" style="flex-wrap:wrap;row-gap:10px">
            <div class="row g-6" style="flex-wrap:wrap">
              <button class="chip chip--sm" [class.chip--on]="media() === 'image'" (click)="attach('image')">
                <app-icon name="image" [size]="13" /> Screenshot
              </button>
              <button class="chip chip--sm" [class.chip--on]="media() === 'video'" (click)="attach('video')">
                <app-icon name="video" [size]="13" /> Demo video
              </button>
              <button class="chip chip--sm" [class.chip--on]="media() === 'chart'" (click)="attach('chart')">
                <app-icon name="chart" [size]="13" /> Metric chart
              </button>
              <button class="chip chip--sm" [class.chip--on]="poll()" (click)="poll.set(!poll())">
                <app-icon name="pie" [size]="13" /> Poll
              </button>
              <button class="chip chip--sm" [class.chip--on]="withDay()" (click)="withDay.set(!withDay())">
                🌱 Day {{ startup().day }}
              </button>
            </div>
            <button class="btn btn--primary" [disabled]="!text.trim()" (click)="publish()">
              <app-icon name="send" [size]="15" /> Publish update
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .ghost-input { text-align: left; height: 40px; padding: 0 14px; border-radius: 999px;
      border: 1px solid var(--line); background: var(--canvas-2); color: var(--faint);
      font-size: 13.5px; cursor: pointer; width: 100%; }
    .ghost-input:hover { border-color: var(--brand-300); color: var(--muted); background: var(--surface); }
  `],
})
export class Composer {
  readonly startExpanded = input<boolean>(false);
  readonly published = output<Post>();
  readonly store = inject(Store);

  readonly types = TYPES;
  readonly open = signal(false);
  readonly type = signal<PostType>('build');
  readonly media = signal<'image' | 'video' | 'chart' | null>(null);
  readonly poll = signal(false);
  readonly withDay = signal(true);
  text = '';
  pollQ = '';
  pollOpts = ['', ''];

  ngOnInit(): void {
    if (this.startExpanded()) this.open.set(true);
  }

  readonly startup = () => this.store.activeStartup();
  def = () => TYPES.find(t => t.key === this.type())!;
  collapsedLabel = () => {
    const s = this.startup();
    return s ? `Day ${s.day} of ${s.name} — what happened today?` : 'Share your progress, a question, or a lesson…';
  };
  mediaEmoji = () => (this.media() === 'video' ? '🎬' : this.media() === 'chart' ? '📊' : '📱');
  mediaLabel = () =>
    this.media() === 'video' ? 'Demo video attached' : this.media() === 'chart' ? 'Metric chart attached' : 'Product screenshot attached';

  start(t: PostType): void {
    this.type.set(t);
    this.poll.set(t === 'question');
    this.open.set(true);
  }

  attach(kind: 'image' | 'video' | 'chart'): void {
    this.media.set(this.media() === kind ? null : kind);
  }

  cancel(): void {
    this.open.set(false);
    this.text = '';
    this.media.set(null);
    this.poll.set(false);
  }

  publish(): void {
    const s = this.startup();
    const kind = this.media();
    const post = this.store.publish({
      type: this.type(),
      text: this.text.trim(),
      startupId: s?.id,
      withDay: this.withDay(),
      media: kind
        ? {
            kind,
            emoji: this.mediaEmoji(),
            caption: kind === 'chart' ? 'Weekly metric' : this.def().label,
            gradient: s?.gradient ?? 'linear-gradient(135deg,#2b2d42,#4c3fb5)',
            duration: kind === 'video' ? '0:42' : undefined,
            series: kind === 'chart' ? [12, 18, 24, 31, 44, 58, 79] : undefined,
            seriesLabel: kind === 'chart' ? 'Weekly active users' : undefined,
          }
        : undefined,
      poll: this.poll() && this.pollQ.trim()
        ? {
            question: this.pollQ.trim(),
            options: this.pollOpts.filter(o => o.trim()).map(o => ({ label: o.trim(), votes: 0 })),
          }
        : undefined,
    });
    this.published.emit(post);
    this.cancel();
  }
}
