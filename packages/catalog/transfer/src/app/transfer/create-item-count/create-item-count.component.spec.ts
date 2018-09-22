import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateItemCountComponent } from './create-item-count.component';

describe('CreateItemCountComponent', () => {
  let component: CreateItemCountComponent;
  let fixture: ComponentFixture<CreateItemCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateItemCountComponent ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateItemCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
