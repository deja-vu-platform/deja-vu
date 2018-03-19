import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateBalanceComponent } from './create-balance.component';

describe('CreateBalanceComponent', () => {
  let component: CreateBalanceComponent;
  let fixture: ComponentFixture<CreateBalanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateBalanceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
