import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateGoodComponent } from './update-good.component';

describe('UpdateGoodComponent', () => {
  let component: UpdateGoodComponent;
  let fixture: ComponentFixture<UpdateGoodComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UpdateGoodComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateGoodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
