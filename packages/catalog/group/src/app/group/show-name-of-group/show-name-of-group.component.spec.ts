import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowNameOfGroupComponent } from './show-name-of-group.component';

describe('ShowNameOfGroupComponent', () => {
  let component: ShowNameOfGroupComponent;
  let fixture: ComponentFixture<ShowNameOfGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowNameOfGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowNameOfGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
