import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNewMemberToGroupComponent } from './add-new-member-to-group.component';

describe('AddNewMemberToGroupComponent', () => {
  let component: AddNewMemberToGroupComponent;
  let fixture: ComponentFixture<AddNewMemberToGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddNewMemberToGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddNewMemberToGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
