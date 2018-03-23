import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewGroupButtonComponent } from './new-group-button.component';

describe('NewGroupButtonComponent', () => {
  let component: NewGroupButtonComponent;
  let fixture: ComponentFixture<NewGroupButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewGroupButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewGroupButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
