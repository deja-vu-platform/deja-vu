import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseAndShowSeriesComponent } from './choose-and-show-series.component';

describe('ChooseAndShowSeriesComponent', () => {
  let component: ChooseAndShowSeriesComponent;
  let fixture: ComponentFixture<ChooseAndShowSeriesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChooseAndShowSeriesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChooseAndShowSeriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
