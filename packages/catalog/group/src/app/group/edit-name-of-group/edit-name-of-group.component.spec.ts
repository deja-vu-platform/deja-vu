import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditNameOfGroupComponent } from './edit-name-of-group.component';

describe('EditNameOfGroupComponent', () => {
  let component: EditNameOfGroupComponent;
  let fixture: ComponentFixture<EditNameOfGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditNameOfGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditNameOfGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
