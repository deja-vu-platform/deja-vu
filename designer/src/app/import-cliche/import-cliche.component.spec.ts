import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatInputModule,
  MatSelectModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ImportClicheComponent } from './import-cliche.component';

describe('ImportClicheComponent', () => {
  let component: ImportClicheComponent;
  let fixture: ComponentFixture<ImportClicheComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImportClicheComponent ],
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        MatInputModule,
        MatSelectModule
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportClicheComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
