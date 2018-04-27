import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseObjectComponent } from './choose-object.component';

describe('ChooseObjectComponent', () => {
  let component: ChooseObjectComponent;
  let fixture: ComponentFixture<ChooseObjectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChooseObjectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChooseObjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
