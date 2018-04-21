import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowFollowerComponent } from './show-follower.component';

describe('ShowFollowerComponent', () => {
  let component: ShowFollowerComponent;
  let fixture: ComponentFixture<ShowFollowerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShowFollowerComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowFollowerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
