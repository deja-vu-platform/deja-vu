import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMessagesByFollowerComponent } from './show-messages-by-follower.component';

describe('ShowMessagesByFollowerComponent', () => {
  let component: ShowMessagesByFollowerComponent;
  let fixture: ComponentFixture<ShowMessagesByFollowerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowMessagesByFollowerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMessagesByFollowerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
