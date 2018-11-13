import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowPropertyUrlComponent } from './show-property-url.component';

describe('ShowPropertyUrlComponent', () => {
  let component: ShowPropertyUrlComponent;
  let fixture: ComponentFixture<ShowPropertyUrlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowPropertyUrlComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowPropertyUrlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
