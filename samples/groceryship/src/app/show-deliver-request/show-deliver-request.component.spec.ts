import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowDeliverRequestComponent } from './show-deliver-request.component';

describe('ShowDeliverRequestComponent', () => {
  let component: ShowDeliverRequestComponent;
  let fixture: ComponentFixture<ShowDeliverRequestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowDeliverRequestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowDeliverRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
