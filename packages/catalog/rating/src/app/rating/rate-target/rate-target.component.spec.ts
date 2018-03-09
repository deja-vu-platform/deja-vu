import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RateTargetComponent } from './rate-target.component';

describe('RateTargetComponent', () => {
  let component: RateTargetComponent;
  let fixture: ComponentFixture<RateTargetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RateTargetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RateTargetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
