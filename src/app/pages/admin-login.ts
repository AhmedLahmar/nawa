import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminAuth } from '../core/admin';
import { UI } from '../ui/ui';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [RouterLink, FormsModule, UI],
  template: `
    <div class="al">
      <header class="al__top">
        <a class="row g-9" routerLink="/">
          <span class="mark">🌱</span>
          <span class="bb" style="font-family:var(--display);font-size:17px;letter-spacing:-.03em">Nawa</span>
        </a>
        <a class="btn btn--ghost btn--sm" routerLink="/">Back to site</a>
      </header>

      <div class="al__body">
        <div class="al__card card card--lg fade-up">
          <div class="pad-lg col g-20">
            <div class="col g-10">
              <span class="mark mark--lg">🛡️</span>
              <div class="col g-6">
                <span class="kicker"><app-icon name="lock" [size]="12" /> Admin access</span>
                <h1>Sign in to the console</h1>
                <p class="muted">The Nawa admin console gives an operator a read-only view of the platform and a few maintenance controls. This is a concept demo — authentication is simulated in the browser.</p>
              </div>
            </div>

            <div class="field">
              <label>Email</label>
              <input class="input" type="email" autocomplete="username"
                [(ngModel)]="email" placeholder="admin@nawa.tn" (keydown.enter)="submit()" />
            </div>
            <div class="field">
              <label>Password</label>
              <input class="input" type="password" autocomplete="current-password"
                [(ngModel)]="password" placeholder="••••••••" (keydown.enter)="submit()" />
            </div>

            @if (error(); as e) {
              <div class="panel panel--rose row-t g-10">
                <app-icon name="alert" [size]="16" class="rose-text" />
                <span class="sm">{{ e }}</span>
              </div>
            }

            <button class="btn btn--primary btn--lg btn--block" (click)="submit()">
              <app-icon name="logout" [size]="16" /> Sign in to console
            </button>

            <div class="panel row-t g-10">
              <span style="font-size:16px">💡</span>
              <span class="tiny muted">
                Demo credentials — <b>{{ auth.hint.email }}</b> / <b>{{ auth.hint.password }}</b>.
                <button class="linkbtn" (click)="fill()">Fill for me</button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .al { min-height: 100vh; background:
      radial-gradient(900px 420px at 12% -10%, var(--brand-50), transparent 60%),
      radial-gradient(700px 380px at 92% 0%, var(--seed-100), transparent 55%), var(--canvas); }
    .al__top { height: 66px; display: flex; align-items: center; justify-content: space-between;
      gap: 16px; padding: 0 clamp(14px, 4vw, 34px); }
    .al__body { padding: clamp(18px, 5vw, 60px) clamp(14px, 4vw, 34px) 70px; display: flex; justify-content: center; }
    .al__card { width: min(460px, 100%); }
    .mark { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center;
      background: linear-gradient(140deg, #14b87a, #5a46f0 120%); font-size: 15px; flex: none; }
    .mark--lg { width: 46px; height: 46px; border-radius: 14px; font-size: 24px; }
    .linkbtn { background: none; border: 0; color: var(--brand-600); font: inherit; font-weight: 600;
      cursor: pointer; padding: 0; text-decoration: underline; }
    .g-9 { gap: 9px }
  `],
})
export class AdminLogin {
  readonly auth = inject(AdminAuth);
  private router = inject(Router);

  email = '';
  password = '';
  readonly error = signal<string | null>(null);

  fill(): void {
    this.email = this.auth.hint.email;
    this.password = this.auth.hint.password;
    this.error.set(null);
  }

  submit(): void {
    const err = this.auth.login(this.email, this.password);
    if (err) {
      this.error.set(err);
      return;
    }
    this.error.set(null);
    this.router.navigate(['/admin']);
  }
}
