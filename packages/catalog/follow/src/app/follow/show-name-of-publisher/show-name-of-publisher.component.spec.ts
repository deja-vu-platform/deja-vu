import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowNameOfPublisherComponent } from './show-name-of-publisher.component';

describe('ShowNameOfPublisherComponent', () => {
  let component: ShowNameOfPublisherComponent;
  let fixture: ComponentFixture<ShowNameOfPublisherComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowNameOfPublisherComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowNameOfPublisherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
