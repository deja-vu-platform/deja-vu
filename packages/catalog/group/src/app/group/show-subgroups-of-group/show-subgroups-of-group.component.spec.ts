import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowSubgroupsOfGroupComponent } from './show-subgroups-of-group.component';

describe('ShowSubgroupsOfGroupComponent', () => {
  let component: ShowSubgroupsOfGroupComponent;
  let fixture: ComponentFixture<ShowSubgroupsOfGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowSubgroupsOfGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowSubgroupsOfGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
