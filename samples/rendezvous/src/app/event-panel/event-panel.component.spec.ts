import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EventPanelComponent } from './event-panel.component';

describe('EventPanelComponent', () => {
  let component: EventPanelComponent;
  let fixture: ComponentFixture<EventPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
