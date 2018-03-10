import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowBalanceComponent } from './show-balance.component';

describe('ShowBalanceComponent', () => {
  let component: ShowBalanceComponent;
  let fixture: ComponentFixture<ShowBalanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowBalanceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
