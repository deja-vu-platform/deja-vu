import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowRequestDetailsComponent } from './show-request-details.component';

describe('ShowRequestDetailsComponent', () => {
  let component: ShowRequestDetailsComponent;
  let fixture: ComponentFixture<ShowRequestDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowRequestDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowRequestDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
