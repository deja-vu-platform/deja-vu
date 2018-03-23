import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowGroupsBySubgroupComponent } from './show-groups-by-subgroup.component';

describe('ShowGroupsBySubgroupComponent', () => {
  let component: ShowGroupsBySubgroupComponent;
  let fixture: ComponentFixture<ShowGroupsBySubgroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowGroupsBySubgroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowGroupsBySubgroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
