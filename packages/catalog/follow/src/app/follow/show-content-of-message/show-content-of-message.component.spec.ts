import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowContentOfMessageComponent } from './show-content-of-message.component';

describe('ShowContentOfMessageComponent', () => {
  let component: ShowContentOfMessageComponent;
  let fixture: ComponentFixture<ShowContentOfMessageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowContentOfMessageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowContentOfMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
