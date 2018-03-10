import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGoodNameComponent } from './create-good-name.component';

describe('CreateGoodNameComponent', () => {
  let component: CreateGoodNameComponent;
  let fixture: ComponentFixture<CreateGoodNameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateGoodNameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateGoodNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
