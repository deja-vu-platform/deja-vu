import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material';

import { TriStateCheckboxComponent } from './tri-state-checkbox.component';

describe('TriStateCheckboxComponent', () => {
  let component: TriStateCheckboxComponent;
  let fixture: ComponentFixture<TriStateCheckboxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TriStateCheckboxComponent ],
      imports: [
        FormsModule,
        MatCheckboxModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TriStateCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
