import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('creates the root component', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders a router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('router-outlet')).not.toBeNull();
  });

  it('declares every route the app links to internally', () => {
    const paths = routes.flatMap(r => [r.path, ...(r.children ?? []).map(c => c.path)]);
    for (const p of ['home', 'build/validator', 'u/:handle', 's/:slug', 'me', 'videos']) {
      expect(paths).toContain(p);
    }
  });
});
