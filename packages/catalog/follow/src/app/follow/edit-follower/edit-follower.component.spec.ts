import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditFollowerComponent } from './edit-follower.component';

describe('EditFollowerComponent', () => {
  let component: EditFollowerComponent;
  let fixture: ComponentFixture<EditFollowerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditFollowerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditFollowerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
    .toBeTruthy();
  });
});
