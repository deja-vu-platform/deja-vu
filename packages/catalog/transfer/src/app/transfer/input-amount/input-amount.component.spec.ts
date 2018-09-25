import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputAmountComponent } from './input-amount.component';

describe('InputAmountComponent', () => {
  let component: InputAmountComponent;
  let fixture: ComponentFixture<InputAmountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InputAmountComponent ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputAmountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
