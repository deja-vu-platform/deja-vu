import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditFollowsOfFollowerComponent } from './edit-follows-of-follower.component';

describe('EditFollowsOfFollowerComponent', () => {
  let component: EditFollowsOfFollowerComponent;
  let fixture: ComponentFixture<EditFollowsOfFollowerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditFollowsOfFollowerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditFollowsOfFollowerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
