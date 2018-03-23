import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowSubgroupsByGroupComponent } from './show-subgroups-by-group.component';

describe('ShowSubgroupsByGroupComponent', () => {
  let component: ShowSubgroupsByGroupComponent;
  let fixture: ComponentFixture<ShowSubgroupsByGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowSubgroupsByGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowSubgroupsByGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
