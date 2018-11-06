import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EventInfoWindowComponent } from './event-info-window.component';

describe('EventInfoWindowComponent', () => {
  let component: EventInfoWindowComponent;
  let fixture: ComponentFixture<EventInfoWindowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventInfoWindowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventInfoWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
