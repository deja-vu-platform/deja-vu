import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditNameOfMemberComponent } from './edit-name-of-member.component';

describe('EditNameOfMemberComponent', () => {
  let component: EditNameOfMemberComponent;
  let fixture: ComponentFixture<EditNameOfMemberComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditNameOfMemberComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditNameOfMemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
