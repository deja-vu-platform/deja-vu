import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowNameOfMemberComponent } from './show-name-of-member.component';

describe('ShowNameOfMemberComponent', () => {
  let component: ShowNameOfMemberComponent;
  let fixture: ComponentFixture<ShowNameOfMemberComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowNameOfMemberComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowNameOfMemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
