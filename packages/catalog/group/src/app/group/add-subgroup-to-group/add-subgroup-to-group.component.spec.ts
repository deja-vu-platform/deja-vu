import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSubgroupToGroupComponent } from './add-subgroup-to-group.component';

describe('AddSubgroupToGroupComponent', () => {
  let component: AddSubgroupToGroupComponent;
  let fixture: ComponentFixture<AddSubgroupToGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddSubgroupToGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSubgroupToGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
