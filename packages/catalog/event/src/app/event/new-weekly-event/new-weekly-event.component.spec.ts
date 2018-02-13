import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewWeeklyEventComponent } from './new-weekly-event.component';

describe('NewWeeklyEventComponent', () => {
  let component: NewWeeklyEventComponent;
  let fixture: ComponentFixture<NewWeeklyEventComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewWeeklyEventComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewWeeklyEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
