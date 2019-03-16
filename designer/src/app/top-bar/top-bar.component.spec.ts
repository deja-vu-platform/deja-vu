import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  MatDialogModule,
  MatIconModule,
  MatMenuModule,
  MatSelectModule,
  MatSnackBarModule,
  MatTabsModule,
  MatToolbarModule
} from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';

import { ElectronService } from 'ngx-electron';

import {
  FloatingMenuComponent
} from '../floating-menu/floating-menu.component';
import { TopBarComponent } from './top-bar.component';

describe('TopBarComponent', () => {
  let component: TopBarComponent;
  let fixture: ComponentFixture<TopBarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TopBarComponent, FloatingMenuComponent],
      imports: [
        FormsModule,
        MatDialogModule,
        MatIconModule,
        MatMenuModule,
        MatSelectModule,
        MatSnackBarModule,
        MatTabsModule,
        MatToolbarModule,
        RouterTestingModule
      ],
      providers: [
        ElectronService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
