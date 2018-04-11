import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowFollowersByPublisherComponent } from './show-followers-by-publisher.component';

describe('ShowFollowersByPublisherComponent', () => {
  let component: ShowFollowersByPublisherComponent;
  let fixture: ComponentFixture<ShowFollowersByPublisherComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowFollowersByPublisherComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowFollowersByPublisherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
