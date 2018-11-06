import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowEventsInfoComponent } from './show-events-info.component';

describe('ShowEventsInfoComponent', () => {
  let component: ShowEventsInfoComponent;
  let fixture: ComponentFixture<ShowEventsInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowEventsInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowEventsInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
