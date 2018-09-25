import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputMoneyComponent } from './input-money.component';

describe('InputMoneyComponent', () => {
  let component: InputMoneyComponent;
  let fixture: ComponentFixture<InputMoneyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InputMoneyComponent ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputMoneyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
