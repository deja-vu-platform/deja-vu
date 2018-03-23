import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSubgroupsOfGroupComponent } from './edit-subgroups-of-group.component';

describe('EditSubgroupsOfGroupComponent', () => {
  let component: EditSubgroupsOfGroupComponent;
  let fixture: ComponentFixture<EditSubgroupsOfGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditSubgroupsOfGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSubgroupsOfGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
