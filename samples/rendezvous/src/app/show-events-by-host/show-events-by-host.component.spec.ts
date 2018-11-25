import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowEventsByHostComponent } from './show-events-by-host.component';

describe('ShowEventsByHostComponent', () => {
  let component: ShowEventsByHostComponent;
  let fixture: ComponentFixture<ShowEventsByHostComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowEventsByHostComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowEventsByHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
