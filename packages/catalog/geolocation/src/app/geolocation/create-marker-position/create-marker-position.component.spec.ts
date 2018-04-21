import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMarkerPositionComponent } from './create-marker-position.component';

describe('CreateMarkerPositionComponent', () => {
  let component: CreateMarkerPositionComponent;
  let fixture: ComponentFixture<CreateMarkerPositionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateMarkerPositionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateMarkerPositionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
