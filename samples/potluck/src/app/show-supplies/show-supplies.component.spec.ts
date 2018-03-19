import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowSuppliesComponent } from './show-supplies.component';

describe('ShowSuppliesComponent', () => {
  let component: ShowSuppliesComponent;
  let fixture: ComponentFixture<ShowSuppliesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowSuppliesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowSuppliesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
