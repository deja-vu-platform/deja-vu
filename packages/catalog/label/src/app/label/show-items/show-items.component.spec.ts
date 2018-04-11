import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowItemsComponent } from './show-items.component';

describe('ShowItemsComponent', () => {
  let component: ShowItemsComponent;
  let fixture: ComponentFixture<ShowItemsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShowItemsComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
