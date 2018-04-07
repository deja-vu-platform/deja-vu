import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowChoreComponent } from './show-chore.component';

describe('ShowChoreComponent', () => {
  let component: ShowChoreComponent;
  let fixture: ComponentFixture<ShowChoreComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowChoreComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowChoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
