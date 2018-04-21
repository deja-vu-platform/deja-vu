import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMarkerLocationComponent } from './show-marker-location.component';

describe('ShowMarkerLocationComponent', () => {
  let component: ShowMarkerLocationComponent;
  let fixture: ComponentFixture<ShowMarkerLocationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowMarkerLocationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMarkerLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
