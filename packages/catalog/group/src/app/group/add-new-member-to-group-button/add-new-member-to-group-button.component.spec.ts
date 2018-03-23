import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNewMemberToGroupButtonComponent } from './add-new-member-to-group-button.component';

describe('AddNewMemberToGroupButtonComponent', () => {
  let component: AddNewMemberToGroupButtonComponent;
  let fixture: ComponentFixture<AddNewMemberToGroupButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddNewMemberToGroupButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddNewMemberToGroupButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
