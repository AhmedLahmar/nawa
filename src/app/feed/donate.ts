import { Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DonationSource } from '../core/models';
import { Store } from '../core/store';
import { fmt, UI } from '../ui/ui';

/* ============================================================
   DONATE DIALOG — reusable tip jar (startup or person target)
   ============================================================ */
@Component({
  selector: 'app-donate-dialog',
  standalone: true,
  imports: [FormsModule, UI],
  template: `
    <app-dialog [title]="'💛 Back ' + targetName()" subtitle="A direct tip — no reward, no equity, just support."
      (close)="close.emit()">
        @if (!done()) {
          <div class="col g-8" role="group" aria-labelledby="dn-gift-l">
            <span class="up faint" id="dn-gift-l">Send a gift</span>
            <div class="row g-6 wrap">
              @for (g of store.gifts; track g.id) {
                <button type="button" class="gift" [class.gift--on]="giftId() === g.id" [attr.aria-pressed]="giftId() === g.id"
                  [attr.aria-label]="g.label + ' gift, ' + g.amount + ' ' + store.currency" (click)="pickGift(g.id, g.amount)">
                  <span style="font-size:20px" aria-hidden="true">{{ g.emoji }}</span>
                  <span class="tiny b">{{ g.label }}</span>
                  <span class="tiny faint">{{ g.amount }} {{ store.currency }}</span>
                </button>
              }
            </div>
          </div>

          <div class="col g-8 mt-12" role="group" aria-labelledby="dn-amt-l">
            <span class="up faint" id="dn-amt-l">Or a custom amount ({{ store.currency }})</span>
            <div class="row g-6 wrap">
              @for (a of presets; track a) {
                <button type="button" class="chip chip--sm" [class.chip--on]="amount() === a && !giftId()"
                  [attr.aria-pressed]="amount() === a && !giftId()" (click)="pickAmount(a)">{{ a }}</button>
              }
              <input class="input num" type="number" min="1" style="width:110px" [ngModel]="amount()"
                aria-label="Custom amount" (ngModelChange)="setCustom($event)" />
            </div>
          </div>

          <div class="field mt-12">
            <label for="dn-msg">Message (optional)</label>
            <input id="dn-msg" class="input" [(ngModel)]="message" placeholder="Say something to the founder…" maxlength="140" />
          </div>

          <label class="row g-8 tiny muted mt-8" style="cursor:pointer">
            <input type="checkbox" [(ngModel)]="anonymous" /> Give anonymously
          </label>

          <div class="divider"></div>
          <button class="btn btn--seed btn--lg btn--block" [disabled]="amount() <= 0" (click)="send()">
            <app-icon name="heart" [size]="16" /> Send {{ amount() }} {{ store.currency }}
          </button>
          <span class="mock-note mt-8"><app-icon name="lock" [size]="11" /> Simulated — no payment is taken</span>
        } @else {
          <div class="col g-10 center mt-16" style="align-items:center;padding:16px 0">
            <span style="font-size:44px">{{ sentGift() || '💛' }}</span>
            <div class="b">Thank you!</div>
            <span class="sm muted center">Your {{ amount() }} {{ store.currency }} tip to {{ targetName() }} was recorded (simulated).</span>
            <button type="button" class="btn btn--sm btn--block mt-8" (click)="close.emit()">Done</button>
          </div>
        }
    </app-dialog>
  `,
  styles: [`
    .gift { display: flex; flex-direction: column; align-items: center; gap: 2px; width: 78px; padding: 9px 4px;
      border: 1px solid var(--line); border-radius: 11px; background: var(--surface); cursor: pointer; }
    .gift:hover { border-color: var(--seed-300, var(--seed-500)); }
    .gift--on { border-color: var(--seed-500); box-shadow: 0 0 0 3px var(--seed-100); }
  `],
})
export class DonateDialog {
  readonly store = inject(Store);
  readonly toStartupId = input<string | undefined>(undefined);
  readonly toPersonId = input<string | undefined>(undefined);
  readonly source = input<DonationSource>('startup');
  readonly close = output<void>();

  readonly presets = [5, 20, 50, 100];
  readonly amount = signal(20);
  readonly giftId = signal<string | undefined>(undefined);
  readonly done = signal(false);
  readonly sentGift = signal('');
  message = '';
  anonymous = false;

  readonly targetName = computed(() => {
    const sid = this.toStartupId();
    if (sid) return this.store.startup(sid)?.name ?? 'this founder';
    const pid = this.toPersonId();
    return pid ? this.store.person(pid)?.name ?? 'this founder' : 'this founder';
  });

  pickGift(id: string, amt: number): void {
    this.giftId.set(id);
    this.amount.set(amt);
  }
  pickAmount(a: number): void {
    this.giftId.set(undefined);
    this.amount.set(a);
  }
  setCustom(v: number): void {
    this.giftId.set(undefined);
    this.amount.set(Math.max(0, Number(v) || 0));
  }

  send(): void {
    const gid = this.giftId();
    this.sentGift.set(gid ? (this.store.gift(gid)?.emoji ?? '🎁') : '💛');
    this.store.donate({
      amount: this.amount(),
      toStartupId: this.toStartupId(),
      toPersonId: this.toPersonId(),
      message: this.message.trim() || undefined,
      giftId: gid,
      source: this.source(),
      anonymous: this.anonymous,
    });
    this.done.set(true);
  }
}

/* ============================================================
   DONATIONS LEDGER (public list of supporters for a target)
   ============================================================ */
@Component({
  selector: 'app-donations-ledger',
  standalone: true,
  imports: [RouterLink, UI],
  template: `
    <div class="card col g-10 pad">
      <div class="row between">
        <span class="up faint">Recent supporters</span>
        <span class="tiny b seed-text">{{ fmt.money(total(), store.currency) }} tipped</span>
      </div>
      @if (list().length) {
        @for (d of list(); track d.id) {
          <div class="row-t g-8">
            @if (d.anonymous) {
              <app-av name="Anonymous" [size]="30" />
            } @else {
              <a [routerLink]="['/u', store.person(d.fromId)?.handle]">
                <app-av [name]="store.person(d.fromId)?.name ?? 'Someone'" [size]="30" />
              </a>
            }
            <div class="grow">
              <div class="row g-6">
                <span class="sm b">{{ d.anonymous ? 'Anonymous' : (store.person(d.fromId)?.name ?? 'Someone') }}</span>
                <span class="tiny seed-text b">{{ giftEmoji(d.giftId) }} {{ d.amount }} {{ d.currency }}</span>
                <span class="tiny faint">{{ d.at }}</span>
              </div>
              @if (d.message) { <div class="tiny muted">"{{ d.message }}"</div> }
            </div>
          </div>
        }
      } @else {
        <span class="tiny faint">No tips yet — be the first to back this founder.</span>
      }
    </div>
  `,
})
export class DonationsLedger {
  readonly store = inject(Store);
  readonly fmt = fmt;
  readonly startupId = input<string | undefined>(undefined);
  readonly personId = input<string | undefined>(undefined);

  readonly list = computed(() => {
    const sid = this.startupId();
    const pid = this.personId();
    return this.store.donations().filter(d =>
      (sid && d.toStartupId === sid) || (pid && d.toPersonId === pid));
  });
  readonly total = () => this.list().reduce((n, d) => n + d.amount, 0);

  giftEmoji = (id?: string) => (id ? this.store.gift(id)?.emoji ?? '' : '');
}
