import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClaimRequestComponent } from './claim-request.component';

describe('ClaimRequestComponent', () => {
  let component: ClaimRequestComponent;
  let fixture: ComponentFixture<ClaimRequestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClaimRequestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClaimRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
