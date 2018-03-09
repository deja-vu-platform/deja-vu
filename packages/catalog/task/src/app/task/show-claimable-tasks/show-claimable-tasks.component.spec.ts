import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowClaimableTasksComponent } from './show-claimable-tasks.component';

describe('ShowClaimableTasksComponent', () => {
  let component: ShowClaimableTasksComponent;
  let fixture: ComponentFixture<ShowClaimableTasksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowClaimableTasksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowClaimableTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
