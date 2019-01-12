import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CanEditComponent } from './can-edit.component';

describe('CanEditComponent', () => {
  let component: CanEditComponent;
  let fixture: ComponentFixture<CanEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CanEditComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CanEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
