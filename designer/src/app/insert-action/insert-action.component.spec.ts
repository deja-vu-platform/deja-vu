import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MatExpansionModule,
  MatListModule,
  MatTooltipModule
} from '@angular/material';

import { InsertActionComponent } from './insert-action.component';

describe('InsertActionComponent', () => {
  let component: InsertActionComponent;
  let fixture: ComponentFixture<InsertActionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        InsertActionComponent
      ],
      imports: [
        MatExpansionModule,
        MatListModule,
        MatTooltipModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InsertActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
