import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlayMarkerComponent } from './overlay-marker.component';

describe('OverlayMarkerComponent', () => {
  let component: OverlayMarkerComponent;
  let fixture: ComponentFixture<OverlayMarkerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OverlayMarkerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OverlayMarkerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
