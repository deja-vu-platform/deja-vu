import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  MatCheckboxModule,
  MatIconModule,
  MatInputModule,
  MatOptionModule,
  MatSelectModule,
  MatTableModule,
  MatTooltipModule
} from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ConfigWizardComponent } from './config-wizard.component';

import {
  TriStateCheckboxComponent
} from '../tri-state-checkbox/tri-state-checkbox.component';

describe('ConfigWizardComponent', () => {
  let component: ConfigWizardComponent;
  let fixture: ComponentFixture<ConfigWizardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ConfigWizardComponent,
        TriStateCheckboxComponent
      ],
      imports: [
        FormsModule,
        MatCheckboxModule,
        MatIconModule,
        MatInputModule,
        MatOptionModule,
        MatSelectModule,
        MatTableModule,
        MatTooltipModule,
        NoopAnimationsModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
