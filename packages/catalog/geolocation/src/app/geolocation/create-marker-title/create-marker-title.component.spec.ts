import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMarkerTitleComponent } from './create-marker-title.component';

describe('CreateMarkerTitleComponent', () => {
  let component: CreateMarkerTitleComponent;
  let fixture: ComponentFixture<CreateMarkerTitleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateMarkerTitleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateMarkerTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
