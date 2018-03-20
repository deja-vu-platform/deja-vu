import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowPartyComponent } from './show-party.component';

describe('ShowPartyComponent', () => {
  let component: ShowPartyComponent;
  let fixture: ComponentFixture<ShowPartyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowPartyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowPartyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
