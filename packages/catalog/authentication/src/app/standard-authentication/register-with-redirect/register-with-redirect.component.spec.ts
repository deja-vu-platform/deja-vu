import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterWithRedirectComponent } from './register-with-redirect.component';

describe('RegisterWithRedirectComponent', () => {
  let component: RegisterWithRedirectComponent;
  let fixture: ComponentFixture<RegisterWithRedirectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RegisterWithRedirectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterWithRedirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
