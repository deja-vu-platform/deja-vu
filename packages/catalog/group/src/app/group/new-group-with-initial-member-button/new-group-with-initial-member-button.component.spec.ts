import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewGroupWithInitialMemberButtonComponent } from './new-group-with-initial-member-button.component';

describe('NewGroupWithInitialMemberButtonComponent', () => {
  let component: NewGroupWithInitialMemberButtonComponent;
  let fixture: ComponentFixture<NewGroupWithInitialMemberButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewGroupWithInitialMemberButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewGroupWithInitialMemberButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
