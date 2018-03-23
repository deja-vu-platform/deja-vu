import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowGroupsByDirectMemberComponent } from './show-groups-by-direct-member.component';

describe('ShowGroupsByDirectMemberComponent', () => {
  let component: ShowGroupsByDirectMemberComponent;
  let fixture: ComponentFixture<ShowGroupsByDirectMemberComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowGroupsByDirectMemberComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowGroupsByDirectMemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
