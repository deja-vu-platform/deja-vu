import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMyGroupsComponent } from './show-my-groups.component';

describe('ShowMyGroupsComponent', () => {
  let component: ShowMyGroupsComponent;
  let fixture: ComponentFixture<ShowMyGroupsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShowMyGroupsComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMyGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
