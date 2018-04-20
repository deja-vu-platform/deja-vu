import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateFollowerComponent } from './create-follower.component';

describe('CreateFollowerComponent', () => {
  let component: CreateFollowerComponent;
  let fixture: ComponentFixture<CreateFollowerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreateFollowerComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateFollowerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
