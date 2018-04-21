import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayMapComponent } from './display-map.component';

describe('DisplayMapComponent', () => {
  let component: DisplayMapComponent;
  let fixture: ComponentFixture<DisplayMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DisplayMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
