import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowTotalComponent } from './show-total.component';

describe('ShowTotalComponent', () => {
  let component: ShowTotalComponent;
  let fixture: ComponentFixture<ShowTotalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowTotalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowTotalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
