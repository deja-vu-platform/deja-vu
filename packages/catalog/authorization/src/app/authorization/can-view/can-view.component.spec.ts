import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CanViewComponent } from './can-view.component';

describe('CanViewComponent', () => {
  let component: CanViewComponent;
  let fixture: ComponentFixture<CanViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CanViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CanViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
