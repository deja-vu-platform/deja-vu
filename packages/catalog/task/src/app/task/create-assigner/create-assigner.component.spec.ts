import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAssignerComponent } from './create-assigner.component';

describe('CreateAssignerComponent', () => {
  let component: CreateAssignerComponent;
  let fixture: ComponentFixture<CreateAssignerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateAssignerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateAssignerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
