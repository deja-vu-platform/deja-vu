import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowCommentsComponent } from './show-comments.component';

import { buildConfig } from '../testing/testbed.config';


describe('ShowCommentsComponent', () => {
  let component: ShowCommentsComponent;
  let fixture: ComponentFixture<ShowCommentsComponent>;

  beforeEach(async(() => {
    const config = buildConfig({ data: { comments: [] } }, null, {});
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowCommentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
