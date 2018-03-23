import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMembersOfGroupComponent } from './show-members-of-group.component';

describe('ShowMembersOfGroupComponent', () => {
  let component: ShowMembersOfGroupComponent;
  let fixture: ComponentFixture<ShowMembersOfGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowMembersOfGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMembersOfGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
