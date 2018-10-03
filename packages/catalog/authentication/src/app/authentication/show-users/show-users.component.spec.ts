import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowUsersComponent } from './show-users.component';

describe('ShowUsersComponent', () => {
  let component: ShowUsersComponent;
  let fixture: ComponentFixture<ShowUsersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShowUsersComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
