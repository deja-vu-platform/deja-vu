import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowPublishersByFollowerComponent } from './show-publishers-by-follower.component';

describe('ShowPublishersByFollowerComponent', () => {
  let component: ShowPublishersByFollowerComponent;
  let fixture: ComponentFixture<ShowPublishersByFollowerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowPublishersByFollowerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowPublishersByFollowerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
