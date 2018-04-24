import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMarkerComponent } from './show-marker.component';

describe('ShowMarkerComponent', () => {
  let component: ShowMarkerComponent;
  let fixture: ComponentFixture<ShowMarkerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShowMarkerComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMarkerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
