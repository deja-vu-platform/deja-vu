import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectAutocompleteComponent } from './object-autocomplete.component';

describe('ObjectAutocompleteComponent', () => {
  let component: ObjectAutocompleteComponent;
  let fixture: ComponentFixture<ObjectAutocompleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ObjectAutocompleteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
