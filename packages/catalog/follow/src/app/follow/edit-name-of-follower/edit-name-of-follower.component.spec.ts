import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditNameOfFollowerComponent } from './edit-name-of-follower.component';

describe('EditNameOfFollowerComponent', () => {
  let component: EditNameOfFollowerComponent;
  let fixture: ComponentFixture<EditNameOfFollowerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditNameOfFollowerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditNameOfFollowerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
