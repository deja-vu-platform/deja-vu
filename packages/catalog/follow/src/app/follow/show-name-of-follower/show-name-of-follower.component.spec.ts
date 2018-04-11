import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowNameOfFollowerComponent } from './show-name-of-follower.component';

describe('ShowNameOfFollowerComponent', () => {
  let component: ShowNameOfFollowerComponent;
  let fixture: ComponentFixture<ShowNameOfFollowerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowNameOfFollowerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowNameOfFollowerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
