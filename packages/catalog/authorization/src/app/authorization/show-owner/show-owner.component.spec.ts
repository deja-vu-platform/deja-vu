import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowOwnerComponent } from './show-owner.component';

describe('ShowOwnerComponent', () => {
  let component: ShowOwnerComponent;
  let fixture: ComponentFixture<ShowOwnerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowOwnerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowOwnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
