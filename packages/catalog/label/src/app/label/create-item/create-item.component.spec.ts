import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateItemComponent } from './create-item.component';

describe('CreateItemComponent', () => {
  let component: CreateItemComponent;
  let fixture: ComponentFixture<CreateItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreateItemComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
