import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowTasksComponent } from './show-tasks.component';

describe('ShowTasksComponent', () => {
  let component: ShowTasksComponent;
  let fixture: ComponentFixture<ShowTasksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowTasksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
