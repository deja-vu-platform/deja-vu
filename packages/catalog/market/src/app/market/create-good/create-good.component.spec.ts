import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGoodButtonComponent } from './create-good-button.component';

describe('CreateGoodButtonComponent', () => {
  let component: CreateGoodButtonComponent;
  let fixture: ComponentFixture<CreateGoodButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateGoodButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateGoodButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
