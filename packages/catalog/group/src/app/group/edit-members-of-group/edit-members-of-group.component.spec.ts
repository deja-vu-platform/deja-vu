import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditMembersOfGroupComponent } from './edit-members-of-group.component';

describe('EditMembersOfGroupComponent', () => {
  let component: EditMembersOfGroupComponent;
  let fixture: ComponentFixture<EditMembersOfGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditMembersOfGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditMembersOfGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
