import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlayMarkersComponent } from './overlay-markers.component';

describe('OverlayMarkersComponent', () => {
  let component: OverlayMarkersComponent;
  let fixture: ComponentFixture<OverlayMarkersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OverlayMarkersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OverlayMarkersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
