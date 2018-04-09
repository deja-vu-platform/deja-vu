import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowLabelsComponent } from './show-labels.component';

describe('ShowLabelsComponent', () => {
  let component: ShowLabelsComponent;
  let fixture: ComponentFixture<ShowLabelsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowLabelsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowLabelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
