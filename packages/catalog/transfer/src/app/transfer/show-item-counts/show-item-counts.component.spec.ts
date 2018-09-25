import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowItemCountsComponent } from './show-item-counts.component';

describe('ShowItemCountComponent', () => {
  let component: ShowItemCountsComponent;
  let fixture: ComponentFixture<ShowItemCountsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowItemCountsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowItemCountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
