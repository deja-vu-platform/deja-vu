import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MatDialogModule,
  MatExpansionModule,
  MatIconModule,
  MatListModule,
  MatTabsModule,
  MatTooltipModule
} from '@angular/material';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ElectronService } from 'ngx-electron';

import { SideMenuComponent } from './side-menu.component';

import {
  ClicheInstancesComponent
} from '../cliche-instances/cliche-instances.component';
import {
  InsertComponentComponent
} from '../insert-component/insert-component.component';

describe('SideMenuComponent', () => {
  let component: SideMenuComponent;
  let fixture: ComponentFixture<SideMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SideMenuComponent,
        InsertComponentComponent,
        ClicheInstancesComponent
      ],
      imports: [
        BrowserAnimationsModule,
        MatDialogModule,
        MatExpansionModule,
        MatIconModule,
        MatListModule,
        MatTabsModule,
        MatTooltipModule
      ],
      providers: [
        ElectronService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SideMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
