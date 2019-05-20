import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RunService } from '@deja-vu/core';
import { App } from '../datatypes';
import { ActionInstanceComponent } from './action-instance.component';

describe('ActionInstanceComponent', () => {
  let component: ActionInstanceComponent;
  let fixture: ComponentFixture<ActionInstanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ActionInstanceComponent],
      providers: [
        { provide: RunService, useValue: {} }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionInstanceComponent);
    component = fixture.componentInstance;
    component.actionInstance = (new App('text'))
      .newActionInstanceByName('button', 'dv');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
