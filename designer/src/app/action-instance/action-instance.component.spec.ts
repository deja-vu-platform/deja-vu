import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionInstanceComponent } from './action-instance.component';

describe('ActionInstanceComponent', () => {
  let component: ActionInstanceComponent;
  let fixture: ComponentFixture<ActionInstanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ActionInstanceComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionInstanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
