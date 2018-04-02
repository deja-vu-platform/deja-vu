import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMyRequestComponent } from './show-my-request.component';

describe('ShowMyRequestComponent', () => {
  let component: ShowMyRequestComponent;
  let fixture: ComponentFixture<ShowMyRequestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowMyRequestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMyRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
