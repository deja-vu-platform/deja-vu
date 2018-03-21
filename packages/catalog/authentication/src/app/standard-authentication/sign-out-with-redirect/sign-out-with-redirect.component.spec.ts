import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SignOutWithRedirectComponent } from './sign-out-with-redirect.component';

describe('SignOutWithRedirectComponent', () => {
  let component: SignOutWithRedirectComponent;
  let fixture: ComponentFixture<SignOutWithRedirectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SignOutWithRedirectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignOutWithRedirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
