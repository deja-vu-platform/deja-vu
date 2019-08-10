import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatAutocompleteModule,
  MatDialogModule,
  MatDialogRef,
  MatDividerModule,
  MatExpansionModule,
  MatIconModule,
  MatInputModule,
  MatSelectModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ElectronService } from 'ngx-electron';

import { ConfigureClicheComponent } from './configure-cliche.component';

describe('ConfigureClicheComponent', () => {
  let component: ConfigureClicheComponent;
  let fixture: ComponentFixture<ConfigureClicheComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfigureClicheComponent ],
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatDialogModule,
        MatDividerModule,
        MatExpansionModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule
      ],
      providers: [
        ElectronService,
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigureClicheComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
