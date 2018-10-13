import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GuestLoggedInComponent } from './guest-logged-in.component';

describe('GuestLoggedInComponent', () => {
  let component: GuestLoggedInComponent;
  let fixture: ComponentFixture<GuestLoggedInComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GuestLoggedInComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GuestLoggedInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
