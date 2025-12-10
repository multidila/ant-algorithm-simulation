import { TestBed } from '@angular/core/testing';

import { AppComponent } from './app';
import { AntColonyOptimization } from './services/algorithm';
import { RandomService } from './services/random';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [RandomService, AntColonyOptimization],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent)
      .toContain('Ant Colony Optimization for Traveling Salesman Problem');
  });
});
