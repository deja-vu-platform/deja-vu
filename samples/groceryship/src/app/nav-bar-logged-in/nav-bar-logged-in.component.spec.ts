import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NavBarLoggedInComponent } from './nav-bar-logged-in.component';

describe('NavBarLoggedInComponent', () => {
  let component: NavBarLoggedInComponent;
  let fixture: ComponentFixture<NavBarLoggedInComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NavBarLoggedInComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavBarLoggedInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
