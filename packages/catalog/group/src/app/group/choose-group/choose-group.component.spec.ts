import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseGroupComponent } from './choose-group.component';

describe('ChooseGroupComponent', () => {
  let component: ChooseGroupComponent;
  let fixture: ComponentFixture<ChooseGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ChooseGroupComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChooseGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
