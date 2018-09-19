import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowTransfersComponent } from './show-transfers.component';

describe('ShowTransfersComponent', () => {
  let component: ShowTransfersComponent;
  let fixture: ComponentFixture<ShowTransfersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowTransfersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowTransfersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
