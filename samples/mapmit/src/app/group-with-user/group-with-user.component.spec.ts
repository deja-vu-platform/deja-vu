import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupWithUserComponent } from './group-with-user.component';

describe('GroupWithUserComponent', () => {
  let component: GroupWithUserComponent;
  let fixture: ComponentFixture<GroupWithUserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupWithUserComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupWithUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
