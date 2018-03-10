import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditGoodNameComponent } from './edit-good-name.component';

describe('EditGoodNameComponent', () => {
  let component: EditGoodNameComponent;
  let fixture: ComponentFixture<EditGoodNameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditGoodNameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditGoodNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
