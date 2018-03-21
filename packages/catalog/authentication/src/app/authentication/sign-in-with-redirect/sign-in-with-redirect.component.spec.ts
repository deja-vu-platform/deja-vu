import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SignInWithRedirectComponent } from './sign-in-with-redirect.component';

describe('SignInWithRedirectComponent', () => {
  let component: SignInWithRedirectComponent;
  let fixture: ComponentFixture<SignInWithRedirectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SignInWithRedirectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignInWithRedirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
