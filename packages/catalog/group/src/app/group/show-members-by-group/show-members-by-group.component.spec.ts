import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMembersByGroupComponent } from './show-members-by-group.component';

describe('ShowMembersByGroupComponent', () => {
  let component: ShowMembersByGroupComponent;
  let fixture: ComponentFixture<ShowMembersByGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowMembersByGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMembersByGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
