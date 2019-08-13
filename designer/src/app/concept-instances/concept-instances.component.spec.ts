import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MatButtonModule,
  MatDialogModule,
  MatExpansionModule,
  MatIconModule,
  MatListModule,
  MatTooltipModule
} from '@angular/material';

import { ElectronService } from 'ngx-electron';
import { ConceptInstancesComponent } from './concept-instances.component';

describe('ConceptInstancesComponent', () => {
  let component: ConceptInstancesComponent;
  let fixture: ComponentFixture<ConceptInstancesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ConceptInstancesComponent
      ],
      imports: [
        MatButtonModule,
        MatDialogModule,
        MatExpansionModule,
        MatIconModule,
        MatListModule,
        MatTooltipModule
      ],
      providers: [
        ElectronService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConceptInstancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
