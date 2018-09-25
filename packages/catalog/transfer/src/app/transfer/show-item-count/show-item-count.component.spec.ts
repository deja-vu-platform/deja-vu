import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowItemCountComponent } from './show-item-count.component';

describe('ShowItemCountComponent', () => {
  let component: ShowItemCountComponent;
  let fixture: ComponentFixture<ShowItemCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowItemCountComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowItemCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
