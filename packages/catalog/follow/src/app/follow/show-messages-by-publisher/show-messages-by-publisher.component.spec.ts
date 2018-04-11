import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMessagesByPublisherComponent } from './show-messages-by-publisher.component';

describe('ShowMessagesByPublisherComponent', () => {
  let component: ShowMessagesByPublisherComponent;
  let fixture: ComponentFixture<ShowMessagesByPublisherComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowMessagesByPublisherComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMessagesByPublisherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
