import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowEventInfoComponent } from './show-event-info.component';

describe('ShowEventInfoComponent', () => {
  let component: ShowEventInfoComponent;
  let fixture: ComponentFixture<ShowEventInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShowEventInfoComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowEventInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
