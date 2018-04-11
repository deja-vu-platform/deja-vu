import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewFollowerButtonComponent } from './new-follower-button.component';

describe('NewFollowerButtonComponent', () => {
  let component: NewFollowerButtonComponent;
  let fixture: ComponentFixture<NewFollowerButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewFollowerButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewFollowerButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
