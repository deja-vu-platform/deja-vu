import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinLeaveComponent } from './join-leave.component';

describe('JoinLeaveComponent', () => {
  let component: JoinLeaveComponent;
  let fixture: ComponentFixture<JoinLeaveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [JoinLeaveComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JoinLeaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
