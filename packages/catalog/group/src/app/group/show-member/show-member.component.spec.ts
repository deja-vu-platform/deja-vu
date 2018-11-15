import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMemberComponent } from './show-member.component';

describe('ShowMemberComponent', () => {
  let component: ShowMemberComponent;
  let fixture: ComponentFixture<ShowMemberComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShowMemberComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
