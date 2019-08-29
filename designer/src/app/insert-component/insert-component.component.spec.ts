import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MatExpansionModule,
  MatListModule,
  MatTooltipModule
} from '@angular/material';

import { InsertComponentComponent } from './insert-component.component';

describe('InsertComponentComponent', () => {
  let component: InsertComponentComponent;
  let fixture: ComponentFixture<InsertComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        InsertComponentComponent
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
    fixture = TestBed.createComponent(InsertComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
