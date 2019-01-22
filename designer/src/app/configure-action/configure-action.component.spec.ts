import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigureActionComponent } from './configure-action.component';

describe('ConfigureActionComponent', () => {
  let component: ConfigureActionComponent;
  let fixture: ComponentFixture<ConfigureActionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfigureActionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigureActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
