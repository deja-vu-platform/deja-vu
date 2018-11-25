import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowEventCommentComponent } from './show-event-comment.component';

describe('ShowEventCommentComponent', () => {
  let component: ShowEventCommentComponent;
  let fixture: ComponentFixture<ShowEventCommentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowEventCommentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowEventCommentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
