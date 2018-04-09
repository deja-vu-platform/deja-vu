import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowCommentsComponent } from './show-comments.component';

describe('ShowCommentsComponent', () => {
  let component: ShowCommentsComponent;
  let fixture: ComponentFixture<ShowCommentsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowCommentsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowCommentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
