import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkerInfoWindowComponent } from './marker-info-window.component';

describe('MarkerInfoWindowComponent', () => {
  let component: MarkerInfoWindowComponent;
  let fixture: ComponentFixture<MarkerInfoWindowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MarkerInfoWindowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarkerInfoWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
