import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowRequestItemComponent } from './show-request-item.component';

describe('ShowRequestItemComponent', () => {
  let component: ShowRequestItemComponent;
  let fixture: ComponentFixture<ShowRequestItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowRequestItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowRequestItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
