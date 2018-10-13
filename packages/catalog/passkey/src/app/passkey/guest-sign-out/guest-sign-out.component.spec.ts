import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GuestSignOutComponent } from './guest-sign-out.component';

describe('GuestSignOutComponent', () => {
  let component: GuestSignOutComponent;
  let fixture: ComponentFixture<GuestSignOutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GuestSignOutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GuestSignOutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
