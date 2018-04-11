import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewPublisherButtonComponent } from './new-publisher-button.component';

describe('NewPublisherButtonComponent', () => {
  let component: NewPublisherButtonComponent;
  let fixture: ComponentFixture<NewPublisherButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewPublisherButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewPublisherButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
