import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowTargetComponent } from './show-target.component';

describe('ShowTargetComponent', () => {
  let component: ShowTargetComponent;
  let fixture: ComponentFixture<ShowTargetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowTargetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowTargetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
    .toBeTruthy();
  });
});
