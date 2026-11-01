import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Dialog } from './ui';

@Component({
  standalone: true,
  imports: [Dialog],
  template: `
    <button id="trigger">open</button>
    @if (open()) {
      <app-dialog title="Test dialog" subtitle="Sub" (close)="open.set(false)">
        <input id="first" aria-label="first" />
        <button id="last">ok</button>
      </app-dialog>
    }`,
})
class Host { readonly open = signal(true); }

describe('Dialog', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    (fixture.nativeElement.querySelector('#trigger') as HTMLElement).focus();
    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    return fixture;
  }

  it('is an accessible, labelled modal dialog', () => {
    const el: HTMLElement = setup().nativeElement;
    const dlg = el.querySelector('[role="dialog"]')!;
    expect(dlg.getAttribute('aria-modal')).toBe('true');
    const title = el.querySelector('#' + dlg.getAttribute('aria-labelledby'))!;
    expect(title.textContent).toContain('Test dialog');
    expect(el.querySelector('[aria-label="Close dialog"]')).not.toBeNull();
  });

  it('moves focus to the first control in the body', () => {
    const el: HTMLElement = setup().nativeElement;
    expect(document.activeElement).toBe(el.querySelector('#first'));
  });

  it('closes on Escape and returns focus to the trigger', () => {
    const fixture = setup();
    const el: HTMLElement = fixture.nativeElement;
    el.querySelector('[role="dialog"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBeFalse();
    expect(document.activeElement).toBe(el.querySelector('#trigger'));
  });
});
