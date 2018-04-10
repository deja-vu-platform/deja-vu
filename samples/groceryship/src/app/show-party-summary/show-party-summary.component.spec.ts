import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowPartySummaryComponent } from './show-party-summary.component';

describe('ShowPartySummaryComponent', () => {
  let component: ShowPartySummaryComponent;
  let fixture: ComponentFixture<ShowPartySummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowPartySummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowPartySummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
