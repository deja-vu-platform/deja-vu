import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  ActionInstanceComponent
} from '../action-instance/action-instance.component';
import { RowComponent } from '../row/row.component';
import { ActionDefinitionComponent } from './action-definition.component';

describe('ActionDefinitionComponent', () => {
  let component: ActionDefinitionComponent;
  let fixture: ComponentFixture<ActionDefinitionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ActionDefinitionComponent,
        RowComponent,
        ActionInstanceComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
