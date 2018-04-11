import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewMessageButtonComponent } from './new-message-button.component';

describe('NewMessageButtonComponent', () => {
  let component: NewMessageButtonComponent;
  let fixture: ComponentFixture<NewMessageButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewMessageButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewMessageButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
