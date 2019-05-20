import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigWizardComponent } from './config-wizard.component';

describe('ConfigWizardComponent', () => {
  let component: ConfigWizardComponent;
  let fixture: ComponentFixture<ConfigWizardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfigWizardComponent ]
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
