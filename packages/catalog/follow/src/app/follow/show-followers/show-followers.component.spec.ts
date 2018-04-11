import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowFollowersComponent } from './show-followers.component';

describe('ShowFollowersComponent', () => {
  let component: ShowFollowersComponent;
  let fixture: ComponentFixture<ShowFollowersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowFollowersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowFollowersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
