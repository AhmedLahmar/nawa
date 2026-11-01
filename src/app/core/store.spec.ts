import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Store } from './store';
import { PRODUCTS, THREADS } from './mock-data';

const KEY = 'nawa.demo.v1';

describe('Store persistence', () => {
  beforeEach(() => localStorage.removeItem(KEY));
  afterEach(() => localStorage.removeItem(KEY));

  it('starts from seed data when nothing is saved', () => {
    const store = TestBed.inject(Store);
    expect(store.products().length).toBe(PRODUCTS.length);
  });

  it('merges new seed items and fields into a state saved by an older version', () => {
    const fresh = TestBed.inject(Store);
    // simulate a v1 save from before pre-orders and thread presence existed
    const oldThreads = fresh.threads().map(({ online, pinned, lastSeen, ...rest }) => rest);
    const oldProducts = fresh.products().filter(p => p.type !== 'preorder');
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    localStorage.setItem(KEY, JSON.stringify({
      ...saved, v: 1, threads: oldThreads, products: oldProducts,
      people: fresh.people(), startups: fresh.startups(), posts: fresh.posts(),
    }));

    TestBed.resetTestingModule();
    const store = TestBed.inject(Store);
    expect(store.products().some(p => p.type === 'preorder')).toBeTrue();
    const seedT1 = THREADS.find(t => t.id === 't1')!;
    expect(store.threads().find(t => t.id === 't1')?.online).toBe(seedT1.online);
  });

  it('keeps the user’s own edits when merging', () => {
    const fresh = TestBed.inject(Store);
    fresh.togglePinThread('t1'); // seed has it pinned → now unpinned and saved
    TestBed.resetTestingModule();
    const store = TestBed.inject(Store);
    expect(store.threads().find(t => t.id === 't1')?.pinned).toBeFalse();
  });

  it('resetDemo cancels scripted replies that are still pending', fakeAsync(() => {
    const store = TestBed.inject(Store);
    const before = store.threads().find(t => t.id === 't2')!.messages.length;
    store.sendMessage('t2', 'hello');
    store.resetDemo();
    tick(5000);
    expect(store.threads().find(t => t.id === 't2')!.messages.length).toBe(before);
  }));
});
