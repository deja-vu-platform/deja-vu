import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowGroupsByDirectSubgroupComponent } from './show-groups-by-direct-subgroup.component';

describe('ShowGroupsByDirectSubgroupComponent', () => {
  let component: ShowGroupsByDirectSubgroupComponent;
  let fixture: ComponentFixture<ShowGroupsByDirectSubgroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowGroupsByDirectSubgroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowGroupsByDirectSubgroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
