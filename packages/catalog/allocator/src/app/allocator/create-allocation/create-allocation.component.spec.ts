import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAllocationComponent } from './create-allocation.component';

describe('CreateAllocationComponent', () => {
  let component: CreateAllocationComponent;
  let fixture: ComponentFixture<CreateAllocationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateAllocationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateAllocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
