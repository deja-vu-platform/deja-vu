import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  ChooseAndShowWeeklyEventComponent
} from './choose-and-show-weekly-event.component';

describe('ChooseAndShowWeeklyEventComponent', () => {
  let component: ChooseAndShowWeeklyEventComponent;
  let fixture: ComponentFixture<ChooseAndShowWeeklyEventComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChooseAndShowWeeklyEventComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChooseAndShowWeeklyEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
