import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMarkerButtonComponent } from './create-marker-button.component';

describe('CreateMarkerButtonComponent', () => {
  let component: CreateMarkerButtonComponent;
  let fixture: ComponentFixture<CreateMarkerButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateMarkerButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateMarkerButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
