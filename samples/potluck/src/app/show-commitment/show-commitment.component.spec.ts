import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowCommitmentComponent } from './show-commitment.component';

describe('ShowCommitmentComponent', () => {
  let component: ShowCommitmentComponent;
  let fixture: ComponentFixture<ShowCommitmentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowCommitmentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowCommitmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
