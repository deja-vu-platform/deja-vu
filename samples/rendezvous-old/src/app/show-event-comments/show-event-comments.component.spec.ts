import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowEventCommentsComponent } from './show-event-comments.component';

describe('ShowEventCommentsComponent', () => {
  let component: ShowEventCommentsComponent;
  let fixture: ComponentFixture<ShowEventCommentsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShowEventCommentsComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowEventCommentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
