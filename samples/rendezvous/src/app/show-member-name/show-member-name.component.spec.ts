import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMemberNameComponent } from './show-member-name.component';

describe('ShowMemberNameComponent', () => {
  let component: ShowMemberNameComponent;
  let fixture: ComponentFixture<ShowMemberNameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowMemberNameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMemberNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
