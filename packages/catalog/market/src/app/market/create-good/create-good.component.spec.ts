import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGoodComponent } from './create-good.component';

describe('CreateGoodComponent', () => {
  let component: CreateGoodComponent;
  let fixture: ComponentFixture<CreateGoodComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateGoodComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateGoodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
