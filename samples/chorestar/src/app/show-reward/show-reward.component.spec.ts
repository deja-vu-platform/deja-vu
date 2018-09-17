import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowRewardComponent } from './show-reward.component';

describe('ShowRewardComponent', () => {
  let component: ShowRewardComponent;
  let fixture: ComponentFixture<ShowRewardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowRewardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowRewardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
