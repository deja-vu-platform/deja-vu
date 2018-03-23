import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewMemberButtonComponent } from './new-member-button.component';

describe('NewMemberButtonComponent', () => {
  let component: NewMemberButtonComponent;
  let fixture: ComponentFixture<NewMemberButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewMemberButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewMemberButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
