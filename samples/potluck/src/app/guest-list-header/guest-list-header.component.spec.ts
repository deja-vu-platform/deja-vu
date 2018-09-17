import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GuestListHeaderComponent } from './guest-list-header.component';

describe('GuestListHeaderComponent', () => {
  let component: GuestListHeaderComponent;
  let fixture: ComponentFixture<GuestListHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GuestListHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GuestListHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
