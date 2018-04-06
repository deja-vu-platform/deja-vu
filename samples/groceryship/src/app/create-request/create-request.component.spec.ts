import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateRequestComponent } from './create-request.component';

describe('CreateRequestComponent', () => {
  let component: CreateRequestComponent;
  let fixture: ComponentFixture<CreateRequestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateRequestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
