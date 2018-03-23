import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowGroupsByMemberComponent } from './show-groups-by-member.component';

describe('ShowGroupsByMemberComponent', () => {
  let component: ShowGroupsByMemberComponent;
  let fixture: ComponentFixture<ShowGroupsByMemberComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowGroupsByMemberComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowGroupsByMemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
