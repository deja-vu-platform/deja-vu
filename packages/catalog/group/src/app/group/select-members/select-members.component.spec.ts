import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectMembersComponent } from './select-members.component';

describe('SelectMembersComponent', () => {
  let component: SelectMembersComponent;
  let fixture: ComponentFixture<SelectMembersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectMembersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
