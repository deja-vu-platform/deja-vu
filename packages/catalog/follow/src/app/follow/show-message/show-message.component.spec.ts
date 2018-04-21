import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMessageComponent } from './show-message.component';

describe('ShowMessageComponent', () => {
  let component: ShowMessageComponent;
  let fixture: ComponentFixture<ShowMessageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShowMessageComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
