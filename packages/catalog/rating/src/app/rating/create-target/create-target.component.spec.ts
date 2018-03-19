import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateTargetComponent } from './create-target.component';

describe('CreateTargetComponent', () => {
  let component: CreateTargetComponent;
  let fixture: ComponentFixture<CreateTargetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateTargetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateTargetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
