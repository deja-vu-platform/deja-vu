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
import { ClicheInstancesComponent } from './cliche-instances.component';

describe('ClicheInstancesComponent', () => {
  let component: ClicheInstancesComponent;
  let fixture: ComponentFixture<ClicheInstancesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ClicheInstancesComponent
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
    fixture = TestBed.createComponent(ClicheInstancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
