import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { DemoSettings } from '../services/demo';
import { RepoApi } from '../services/project';
import { CounselorPage } from './counselor';
import { GeneratePage } from './generate';

const KEYS = ['nawa.counselor.v1', 'nawa.generate.v1', 'nawa.repo-account.v1', 'nawa.demo.v1'];
const tick = () => new Promise(r => setTimeout(r, 0));

function route(params: Record<string, string>, query: Record<string, string>) {
  return {
    provide: ActivatedRoute,
    useValue: {
      paramMap: of(convertToParamMap(params)),
      queryParamMap: of(convertToParamMap(query)),
      snapshot: { paramMap: convertToParamMap(params), queryParamMap: convertToParamMap(query) },
    },
  };
}

describe('Feature pages (smoke)', () => {
  beforeEach(() => KEYS.forEach(k => localStorage.removeItem(k)));
  afterEach(() => KEYS.forEach(k => localStorage.removeItem(k)));

  it('Counselor: runs a review and shows verdict, scores and the hand-off button', async () => {
    TestBed.configureTestingModule({ imports: [CounselorPage], providers: [provideRouter([]), route({ slug: 'agrix' }, {})] });
    TestBed.inject(DemoSettings).speed.set(0);
    const f = TestBed.createComponent(CounselorPage);
    f.detectChanges();
    const el: HTMLElement = f.nativeElement;
    expect(el.textContent).toContain('Ask the Counselor');
    await f.componentInstance.run();
    f.detectChanges();
    expect(el.querySelector('#vd-h')?.textContent?.trim().length).toBeGreaterThan(0);
    expect(el.querySelectorAll('app-bar').length).toBeGreaterThanOrEqual(4);
    expect(el.textContent).toContain('Use this review to generate my project');
    expect(el.textContent).toMatch(/critical/);
  });

  it('Counselor: shows the error state with a retry', async () => {
    TestBed.configureTestingModule({ imports: [CounselorPage], providers: [provideRouter([]), route({ slug: 'agrix' }, {})] });
    const demo = TestBed.inject(DemoSettings);
    demo.speed.set(0);
    demo.failNext('counselor');
    const f = TestBed.createComponent(CounselorPage);
    f.detectChanges();
    await f.componentInstance.run();
    f.detectChanges();
    expect((f.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain('Try again');
  });

  it('Generate: Autopilot reaches the plan in a few clicks and generates', async () => {
    TestBed.configureTestingModule({ imports: [GeneratePage], providers: [provideRouter([]), route({}, { startup: 's_agrix' })] });
    TestBed.inject(DemoSettings).speed.set(0);
    await TestBed.inject(RepoApi).connect('github', 'ahmedbenali');
    const f = TestBed.createComponent(GeneratePage);
    f.detectChanges();
    const el: HTMLElement = f.nativeElement;
    const click = (sel: string, text?: string) => {
      const b = Array.from(el.querySelectorAll<HTMLElement>(sel)).find(x => !text || x.textContent!.includes(text))!;
      b.click(); f.detectChanges();
    };
    click('button.level', 'Autopilot');                 // 1: choose Autopilot → brief
    expect(f.componentInstance.d()!.step).toBe('brief');
    click('button.btn--primary', 'Continue');            // 2: brief → plan (account already connected)
    expect(f.componentInstance.d()!.step).toBe('plan');
    expect(el.textContent).toContain('ahmedbenali/agrix');
    click('button.btn--seed', 'Confirm');                // 3: generate
    for (let i = 0; i < 10 && f.componentInstance.d()!.step !== 'result'; i++) { await tick(); f.detectChanges(); }
    expect(f.componentInstance.d()!.step).toBe('result');
    expect(el.textContent).toContain('https://github.com/ahmedbenali/agrix');
  });

  it('Generate: offers GitLab and ZIP, and never mentions creating an account', () => {
    TestBed.configureTestingModule({ imports: [GeneratePage], providers: [provideRouter([]), route({}, { startup: 's_agrix' })] });
    const f = TestBed.createComponent(GeneratePage);
    f.detectChanges();
    f.componentInstance.chooseLevel('guided');
    f.componentInstance.go('repository');
    f.detectChanges();
    const text = (f.nativeElement as HTMLElement).textContent!;
    expect(text).toContain('GitLab');
    expect(text).toContain('Download as ZIP');
    expect(text).toContain('never creates accounts');
    expect(text).not.toMatch(/create (a|an|your) (new )?(github|gitlab)? ?account/i);
  });
});
