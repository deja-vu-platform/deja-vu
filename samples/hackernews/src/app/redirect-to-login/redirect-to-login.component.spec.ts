import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowPostPageComponent } from './redirect-to-login.component';

describe('ShowPostPageComponent', () => {
  let component: ShowPostPageComponent;
  let fixture: ComponentFixture<ShowPostPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowPostPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowPostPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
    .toBeTruthy();
  });
});
