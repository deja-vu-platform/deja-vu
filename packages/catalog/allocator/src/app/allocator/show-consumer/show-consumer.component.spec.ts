import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowConsumerComponent } from './show-consumer.component';

describe('ShowConsumerComponent', () => {
  let component: ShowConsumerComponent;
  let fixture: ComponentFixture<ShowConsumerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowConsumerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowConsumerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});
