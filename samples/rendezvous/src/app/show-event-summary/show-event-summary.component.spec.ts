import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowEventSummaryComponent } from './show-event-summary.component';

describe('ShowEventSummaryComponent', () => {
  let component: ShowEventSummaryComponent;
  let fixture: ComponentFixture<ShowEventSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShowEventSummaryComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowEventSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
