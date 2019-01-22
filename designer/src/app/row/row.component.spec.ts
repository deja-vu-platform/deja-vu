import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  ActionInstanceComponent
} from '../action-instance/action-instance.component';
import { RowComponent } from './row.component';

describe('RowComponent', () => {
  let component: RowComponent;
  let fixture: ComponentFixture<RowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        RowComponent,
        ActionInstanceComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
