import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RunService } from '@deja-vu/core';
import { App } from '../datatypes';
import { ComponentInstanceComponent } from './component-instance.component';

describe('ComponentInstanceComponent', () => {
  let component: ComponentInstanceComponent;
  let fixture: ComponentFixture<ComponentInstanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ComponentInstanceComponent],
      providers: [
        { provide: RunService, useValue: {} }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ComponentInstanceComponent);
    component = fixture.componentInstance;
    component.componentInstance = (new App('text'))
      .newComponentInstanceByName('button', 'dv');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
