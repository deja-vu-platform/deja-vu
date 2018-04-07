import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplyListHeaderComponent } from './supply-list-header.component';

describe('SupplyListHeaderComponent', () => {
  let component: SupplyListHeaderComponent;
  let fixture: ComponentFixture<SupplyListHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SupplyListHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SupplyListHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
