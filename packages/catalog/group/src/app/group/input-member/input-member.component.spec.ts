import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputMemberComponent } from './input-member.component';

describe('InputMemberComponent', () => {
  let component: InputMemberComponent;
  let fixture: ComponentFixture<InputMemberComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InputMemberComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputMemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
