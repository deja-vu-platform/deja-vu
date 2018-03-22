import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowGoodComponent } from './show-good.component';

describe('ShowGoodComponent', () => {
  let component: ShowGoodComponent;
  let fixture: ComponentFixture<ShowGoodComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowGoodComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowGoodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
