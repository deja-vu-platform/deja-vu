import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowSupplyRequestComponent } from './show-supply-request.component';

describe('ShowSupplyRequestComponent', () => {
  let component: ShowSupplyRequestComponent;
  let fixture: ComponentFixture<ShowSupplyRequestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowSupplyRequestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowSupplyRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
