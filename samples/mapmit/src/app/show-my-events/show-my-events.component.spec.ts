import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMyEventsComponent } from './show-my-events.component';

describe('ShowMyEventsComponent', () => {
  let component: ShowMyEventsComponent;
  let fixture: ComponentFixture<ShowMyEventsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowMyEventsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMyEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
