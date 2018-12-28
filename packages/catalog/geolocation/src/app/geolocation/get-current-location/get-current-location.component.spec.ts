import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GetCurrentLocationComponent } from './get-current-location.component';

describe('GetCurrentLocationComponent', () => {
  let component: GetCurrentLocationComponent;
  let fixture: ComponentFixture<GetCurrentLocationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [GetCurrentLocationComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GetCurrentLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
