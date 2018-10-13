import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GuestSignInComponent } from './guest-sign-in.component';

describe('GuestSignInComponent', () => {
  let component: GuestSignInComponent;
  let fixture: ComponentFixture<GuestSignInComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GuestSignInComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GuestSignInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
