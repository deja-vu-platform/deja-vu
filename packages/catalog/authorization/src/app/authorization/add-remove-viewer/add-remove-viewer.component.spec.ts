import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRemoveViewerComponent } from './add-remove-viewer.component';

describe('AddRemoveViewerComponent', () => {
  let component: AddRemoveViewerComponent;
  let fixture: ComponentFixture<AddRemoveViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddRemoveViewerComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddRemoveViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
