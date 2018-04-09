import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAuthorComponent } from './create-author.component';

describe('CreateAuthorComponent', () => {
  let component: CreateAuthorComponent;
  let fixture: ComponentFixture<CreateAuthorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreateAuthorComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateAuthorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
